require("dotenv").config();

const required = ["DB_HOST", "DB_USER", "DB_NAME", "JWT_SECRET"];
const missing = required.filter(
  (key) => process.env[key] === undefined || process.env[key] === "",
);
if (missing.length) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
}

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

module.exports = {
  port: num(process.env.PORT, 3000),
  corsOrigins: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  shop: {
    name: process.env.SHOP_NAME || "Cafe & Food",
    currency: process.env.CURRENCY || "USD",
    taxRate: num(process.env.TAX_RATE, 0),
    lowStockThreshold: num(process.env.LOW_STOCK_THRESHOLD, 5),
  },
  tzOffset: /^[+-]\d{2}:\d{2}$/.test(process.env.SHOP_TZ_OFFSET || "")
    ? process.env.SHOP_TZ_OFFSET
    : "+00:00",
};
