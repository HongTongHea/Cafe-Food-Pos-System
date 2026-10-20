const mysql = require("mysql2/promise");
require("./env");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  // Keep this small: every serverless instance on Vercel opens its own pool.
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 5,
  queueLimit: 0,
  enableKeepAlive: true,
  decimalNumbers: true, // return DECIMAL columns as numbers instead of strings
  timezone: "Z", // read/write dates as UTC
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

// Store and compare all timestamps in UTC.
pool.on("connection", (conn) => conn.query("SET time_zone = '+00:00'"));

module.exports = pool;
