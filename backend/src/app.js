const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { corsOrigins, shop, tzOffset } = require("./config/env");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();

app.use(helmet());
app.use(
  cors({
    // No CORS_ORIGIN set = allow any origin (handy in development).
    origin: corsOrigins.length ? corsOrigins : true,
  })
);
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => res.json({ name: "Cafe POS API", status: "ok" }));

// Public: shop name, currency and tax rate so the frontend can show prices correctly.
app.get("/api/settings", (req, res) => {
  // "today" in the shop's own timezone (SHOP_TZ_OFFSET), used for default date filters
  const [h, m] = tzOffset.slice(1).split(":").map(Number);
  const offsetMs = (tzOffset[0] === "-" ? -1 : 1) * (h * 60 + m) * 60000;
  const today = new Date(Date.now() + offsetMs).toISOString().slice(0, 10);
  res.json({ shopName: shop.name, currency: shop.currency, taxRate: shop.taxRate, today });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reports", require("./routes/reports"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
