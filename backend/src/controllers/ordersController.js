const db = require("../config/db");
const { shop } = require("../config/env");
const Orders = require("../models/ordersModel");
const { toCents, fromCents } = require("../utils/money");
const { httpError } = require("../middleware/error");

const ORDER_TYPES = ["dine_in", "takeaway"];
const PAYMENT_METHODS = ["cash", "card", "qr"];

// POST /api/orders  — the checkout. Everything happens in one DB transaction,
// and prices always come from the database, never from the browser.
exports.createOrder = async (req, res) => {
  const body = req.body;

  // ----- 1. validate input -----
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw httpError(400, "The order has no items");
  }
  const order_type = body.order_type || "dine_in";
  const payment_method = body.payment_method || "cash";
  if (!ORDER_TYPES.includes(order_type)) throw httpError(400, "Invalid order type");
  if (!PAYMENT_METHODS.includes(payment_method)) throw httpError(400, "Invalid payment method");

  // merge duplicate lines
  const wanted = new Map();
  for (const line of body.items) {
    const productId = Number(line.product_id);
    const qty = Number(line.quantity);
    if (!Number.isInteger(productId) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw httpError(400, "Invalid item or quantity");
    }
    wanted.set(productId, (wanted.get(productId) || 0) + qty);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ----- 2. lock the product rows so two cashiers can't oversell stock -----
    const [products] = await conn.query(
      `SELECT id, product_name, price, track_stock, stock_quantity, is_active
         FROM products WHERE id IN (?) FOR UPDATE`,
      [[...wanted.keys()]]
    );
    const byId = new Map(products.map((p) => [p.id, p]));

    const lines = [];
    let subtotal = 0;
    for (const [productId, qty] of wanted) {
      const p = byId.get(productId);
      if (!p || !p.is_active) throw httpError(400, "One of the products is no longer available");
      if (p.track_stock && p.stock_quantity < qty) {
        throw httpError(409, `Not enough stock for "${p.product_name}" (only ${p.stock_quantity} left)`);
      }
      const unit = toCents(p.price);
      subtotal += unit * qty;
      lines.push({ p, qty, unit });
    }

    // ----- 3. totals (integer cents) -----
    let discount = 0;
    const discountValue = Number(body.discount_value) || 0;
    if (body.discount_type === "percent") {
      if (discountValue < 0 || discountValue > 100) throw httpError(400, "Discount must be between 0 and 100%");
      discount = Math.round((subtotal * discountValue) / 100);
    } else if (body.discount_type === "amount") {
      if (discountValue < 0) throw httpError(400, "Discount cannot be negative");
      discount = Math.min(subtotal, toCents(discountValue));
    }
    const taxable = subtotal - discount;
    const tax = Math.round((taxable * shop.taxRate) / 100);
    const total = taxable + tax;

    // ----- 4. payment -----
    let paid = total;
    if (payment_method === "cash") {
      paid = toCents(body.amount_paid);
      if (!Number.isFinite(paid) || paid < total) throw httpError(400, "Cash received is less than the total");
    }
    const change = paid - total;

    // ----- 5. save order, items, and update stock -----
    const [orderResult] = await conn.query(
      `INSERT INTO orders
         (user_id, order_type, table_no, note, subtotal, discount, tax, total,
          payment_method, amount_paid, change_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid')`,
      [
        req.user.id,
        order_type,
        order_type === "dine_in" && body.table_no ? String(body.table_no).trim().slice(0, 20) : null,
        body.note ? String(body.note).trim().slice(0, 255) : null,
        fromCents(subtotal),
        fromCents(discount),
        fromCents(tax),
        fromCents(total),
        payment_method,
        fromCents(paid),
        fromCents(change),
      ]
    );
    const orderId = orderResult.insertId;

    await conn.query(
      "INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total) VALUES ?",
      [lines.map((l) => [orderId, l.p.id, l.p.product_name, fromCents(l.unit), l.qty, fromCents(l.unit * l.qty)])]
    );

    for (const l of lines) {
      if (l.p.track_stock) {
        await conn.query("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?", [l.qty, l.p.id]);
      }
    }

    await conn.commit();
    res.status(201).json(await Orders.findById(orderId));
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// GET /api/orders?from=&to=&status=&q=&limit=
// Cashiers only see their own orders; admins see everything.
exports.getOrders = async (req, res) => {
  const { from, to, status, q } = req.query;
  const dateOk = (d) => !d || /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (!dateOk(from) || !dateOk(to)) throw httpError(400, "Dates must be YYYY-MM-DD");

  const orders = await Orders.list({
    from,
    to,
    status: ["paid", "void"].includes(status) ? status : undefined,
    q: q ? String(q).trim().slice(0, 50) : undefined,
    userId: req.user.role === "admin" ? undefined : req.user.id,
    limit: Math.min(Number(req.query.limit) || 200, 500),
  });
  res.json(orders);
};

// GET /api/orders/:id
exports.getOrder = async (req, res) => {
  const order = await Orders.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (req.user.role !== "admin" && order.user_id !== req.user.id) {
    return res.status(403).json({ message: "You do not have permission to view this order" });
  }
  res.json(order);
};

// POST /api/orders/:id/void  (admin) — cancels the sale and puts stock back
exports.voidOrder = async (req, res) => {
  const reason = String(req.body.reason || "").trim().slice(0, 255);
  if (!reason) throw httpError(400, "Please give a reason for voiding this order");

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query("SELECT id, status FROM orders WHERE id = ? FOR UPDATE", [req.params.id]);
    if (!rows[0]) throw httpError(404, "Order not found");
    if (rows[0].status === "void") throw httpError(400, "This order is already voided");

    await conn.query(
      "UPDATE orders SET status = 'void', void_reason = ?, voided_by = ?, voided_at = NOW() WHERE id = ?",
      [reason, req.user.id, req.params.id]
    );

    // give the stock back (only for products that track stock and still exist)
    await conn.query(
      `UPDATE products p
         JOIN order_items oi ON oi.product_id = p.id
          SET p.stock_quantity = p.stock_quantity + oi.quantity
        WHERE oi.order_id = ? AND p.track_stock = 1`,
      [req.params.id]
    );

    await conn.commit();
    res.json(await Orders.findById(req.params.id));
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
