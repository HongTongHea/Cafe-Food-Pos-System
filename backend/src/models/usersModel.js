const db = require("../config/db");

const PUBLIC_COLUMNS = "id, name, email, role, status, created_at";

exports.list = async () => {
  const [rows] = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY id DESC`,
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`,
    [id],
  );
  return rows[0];
};

// Includes the password hash. Only used by login.
exports.findByEmailWithPassword = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};

exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE email = ?`,
    [email],
  );
  return rows[0];
};

exports.create = async ({ name, email, password, role, status }) => {
  const [result] = await db.query(
    "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
    [name, email, password, role, status],
  );
  return result.insertId;
};

// `password` is optional: when undefined the existing hash is kept.
exports.update = async (id, { name, email, role, status, password }) => {
  const fields = ["name = ?", "email = ?", "role = ?", "status = ?"];
  const values = [name, email, role, status];
  if (password) {
    fields.push("password = ?");
    values.push(password);
  }
  values.push(id);
  await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
};

exports.remove = async (id) => {
  await db.query("DELETE FROM users WHERE id = ?", [id]);
};

exports.countActiveAdmins = async (excludeId = 0) => {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND status = 'active' AND id <> ?",
    [excludeId],
  );
  return rows[0].n;
};
