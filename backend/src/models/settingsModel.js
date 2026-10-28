const db = require("../config/db");

const DEFAULT_SHOP_NAME = "Caffee & Food";

// Get shop settings (creates a default row if the table is empty)
exports.getSettings = async () => {
  const [rows] = await db.query(
    `SELECT id, shop_name, logo_url
       FROM settings
      ORDER BY id ASC
      LIMIT 1`,
  );

  if (rows.length > 0) {
    return rows[0];
  }

  await db.query(`INSERT INTO settings (shop_name, logo_url) VALUES (?, ?)`, [
    DEFAULT_SHOP_NAME,
    null,
  ]);

  const [newRows] = await db.query(
    `SELECT id, shop_name, logo_url
       FROM settings
      ORDER BY id ASC
      LIMIT 1`,
  );

  return newRows[0];
};

// Find settings by ID
exports.findById = async (id) => {
  const [rows] = await db.query(
    "SELECT id, shop_name, logo_url FROM settings WHERE id = ?",
    [id],
  );

  return rows[0];
};

// Update shop name and logo, then return the updated row
exports.update = async (id, shopName, logoUrl) => {
  await db.query(
    `UPDATE settings
        SET shop_name = ?,
            logo_url = ?
      WHERE id = ?`,
    [shopName, logoUrl || null, id],
  );

  return exports.findById(id);
};
