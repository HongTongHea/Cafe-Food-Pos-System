const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");

const { corsOrigins } = require("./config/env");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
  }),
);

app.use(express.json({ limit: "100kb" }));

// Uploaded files are stored in backend/uploads.
// This file is located at backend/src/app.js.
const uploadDir = path.join(__dirname, "../uploads");

// Serve logo images publicly.
// Example: http://localhost:3000/uploads/logo.png
app.use("/uploads", express.static(uploadDir));

// Health check
app.get("/", (req, res) => {
  res.json({
    name: "Cafe POS API",
    status: "ok",
  });
});

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/settings", require("./routes/settings"));

// Error handlers must come after the routes.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
