const db = require("../config/db");

const SELECT = `
  SELECT p.id, p.category_id, c.name AS category, p.product_name, p.description, p.price,
         p.track_stock, p.stock_quantity, p.image_url, p.is_active, p.created_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id`;

exports.list = async ({ onlyActive = false } = {}) => {
  const where = onlyActive ? "WHERE p.is_active = 1" : "";
  const [rows] = await db.query(`${SELECT} ${where} ORDER BY p.product_name`);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(`${SELECT} WHERE p.id = ?`, [id]);
  return rows[0];
};

exports.findByName = async (name) => {
  const [rows] = await db.query("SELECT id FROM products WHERE product_name = ?", [name]);
  return rows[0];
};

exports.create = async (p) => {
  const [result] = await db.query(
    `INSERT INTO products
       (category_id, product_name, description, price, track_stock, stock_quantity, image_url, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.category_id, p.product_name, p.description, p.price, p.track_stock, p.stock_quantity, p.image_url, p.is_active]
  );
  return result.insertId;
};

exports.update = async (id, p) => {
  await db.query(
    `UPDATE products
        SET category_id = ?, product_name = ?, description = ?, price = ?,
            track_stock = ?, stock_quantity = ?, image_url = ?, is_active = ?
      WHERE id = ?`,
    [p.category_id, p.product_name, p.description, p.price, p.track_stock, p.stock_quantity, p.image_url, p.is_active, id]
  );
};

exports.remove = async (id) => {
  await db.query("DELETE FROM products WHERE id = ?", [id]);
};
