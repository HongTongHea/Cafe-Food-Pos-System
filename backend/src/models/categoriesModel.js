const db = require("../config/db");

exports.list = async () => {
  const [rows] = await db.query(
    `SELECT c.id, c.name, c.sort_order, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name, c.sort_order
      ORDER BY c.sort_order, c.name`
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM categories WHERE id = ?", [id]);
  return rows[0];
};

exports.create = async (name) => {
  const [result] = await db.query(
    "INSERT INTO categories (name, sort_order) SELECT ?, COALESCE(MAX(sort_order), 0) + 1 FROM categories",
    [name]
  );
  return result.insertId;
};

exports.update = async (id, name) => {
  await db.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
};

exports.remove = async (id) => {
  await db.query("DELETE FROM categories WHERE id = ?", [id]);
};
