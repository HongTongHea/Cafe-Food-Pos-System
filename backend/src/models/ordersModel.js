const db = require("../config/db");
const { tzOffset } = require("../config/env");

const ORDER_SELECT = `
  SELECT o.id, CONCAT('#', LPAD(o.id, 5, '0')) AS order_no, o.user_id, u.name AS cashier_name,
         o.order_type, o.table_no, o.note, o.subtotal, o.discount, o.tax, o.total,
         o.payment_method, o.amount_paid, o.change_amount, o.status,
         o.void_reason, o.voided_at, o.created_at
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id`;

exports.findById = async (id) => {
  const [rows] = await db.query(`${ORDER_SELECT} WHERE o.id = ?`, [id]);
  const order = rows[0];
  if (!order) return null;
  const [items] = await db.query(
    `SELECT id, product_id, product_name, unit_price, quantity, line_total
       FROM order_items WHERE order_id = ? ORDER BY id`,
    [id]
  );
  return { ...order, items };
};

// Filters: from/to are local calendar dates (YYYY-MM-DD) in the shop's timezone.
exports.list = async ({ from, to, status, q, userId, limit = 200 }) => {
  const where = [];
  const params = [];

  if (from) {
    where.push("DATE(CONVERT_TZ(o.created_at, '+00:00', ?)) >= ?");
    params.push(tzOffset, from);
  }
  if (to) {
    where.push("DATE(CONVERT_TZ(o.created_at, '+00:00', ?)) <= ?");
    params.push(tzOffset, to);
  }
  if (status) {
    where.push("o.status = ?");
    params.push(status);
  }
  if (userId) {
    where.push("o.user_id = ?");
    params.push(userId);
  }
  if (q) {
    where.push("(CONCAT('#', LPAD(o.id, 5, '0')) LIKE ? OR u.name LIKE ? OR o.table_no LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await db.query(
    `${ORDER_SELECT} ${clause} ORDER BY o.id DESC LIMIT ?`,
    [...params, limit]
  );

  if (rows.length) {
    const [counts] = await db.query(
      "SELECT order_id, SUM(quantity) AS item_count FROM order_items WHERE order_id IN (?) GROUP BY order_id",
      [rows.map((r) => r.id)]
    );
    const map = new Map(counts.map((c) => [c.order_id, Number(c.item_count)]));
    rows.forEach((r) => (r.item_count = map.get(r.id) || 0));
  }
  return rows;
};
