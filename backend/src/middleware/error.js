exports.notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler. Express 5 forwards rejected promises here automatically.
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ message: err.message });

  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "That value already exists" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
};

// Small helper for throwing HTTP errors from controllers/models.
exports.httpError = (status, message) => Object.assign(new Error(message), { status });
