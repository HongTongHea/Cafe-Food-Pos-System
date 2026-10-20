const db = require("../config/db");
const { tzOffset, shop } = require("../config/env");

const LOCAL_DATE = "DATE(CONVERT_TZ(o.created_at, '+00:00', ?))";

// Today's date in the shop's timezone as 'YYYY-MM-DD'
exports.today = async () => {
  const [rows] = await db.query(
    "SELECT DATE_FORMAT(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', ?), '%Y-%m-%d') AS d",
    [tzOffset]
  );
  return rows[0].d;
};

exports.totals = async (from, to) => {
  const [[sales]] = await db.query(
    `SELECT COALESCE(SUM(o.total), 0) AS revenue, COUNT(*) AS orders
       FROM orders o
      WHERE o.status = 'paid' AND ${LOCAL_DATE} BETWEEN ? AND ?`,
    [tzOffset, from, to]
  );
  const [[items]] = await db.query(
    `SELECT COALESCE(SUM(oi.quantity), 0) AS items_sold
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 'paid' AND ${LOCAL_DATE} BETWEEN ? AND ?`,
    [tzOffset, from, to]
  );
  return {
    revenue: Number(sales.revenue),
    orders: Number(sales.orders),
    items_sold: Number(items.items_sold),
  };
};

exports.dailyRevenue = async (from, to) => {
  const [rows] = await db.query(
    `SELECT DATE_FORMAT(${LOCAL_DATE}, '%Y-%m-%d') AS day,
            SUM(o.total) AS revenue, COUNT(*) AS orders
       FROM orders o
      WHERE o.status = 'paid' AND ${LOCAL_DATE} BETWEEN ? AND ?
      GROUP BY day ORDER BY day`,
    [tzOffset, tzOffset, from, to]
  );
  return rows.map((r) => ({ day: r.day, revenue: Number(r.revenue), orders: Number(r.orders) }));
};

exports.topProducts = async (from, to, limit = 5) => {
  const [rows] = await db.query(
    `SELECT oi.product_name AS name, SUM(oi.quantity) AS quantity, SUM(oi.line_total) AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 'paid' AND ${LOCAL_DATE} BETWEEN ? AND ?
      GROUP BY oi.product_name
      ORDER BY revenue DESC LIMIT ?`,
    [tzOffset, from, to, limit]
  );
  return rows.map((r) => ({ name: r.name, quantity: Number(r.quantity), revenue: Number(r.revenue) }));
};

exports.paymentBreakdown = async (from, to) => {
  const [rows] = await db.query(
    `SELECT o.payment_method AS method, COUNT(*) AS orders, SUM(o.total) AS revenue
       FROM orders o
      WHERE o.status = 'paid' AND ${LOCAL_DATE} BETWEEN ? AND ?
      GROUP BY o.payment_method`,
    [tzOffset, from, to]
  );
  return rows.map((r) => ({ method: r.method, orders: Number(r.orders), revenue: Number(r.revenue) }));
};

exports.lowStock = async () => {
  const [rows] = await db.query(
    `SELECT id, product_name, stock_quantity FROM products
      WHERE track_stock = 1 AND is_active = 1 AND stock_quantity <= ?
      ORDER BY stock_quantity ASC, product_name LIMIT 8`,
    [shop.lowStockThreshold]
  );
  return rows;
};
