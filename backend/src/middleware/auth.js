const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const Users = require("../models/usersModel");

// Verifies the Bearer token and loads the user fresh from the database,
// so deactivated users or role changes take effect immediately.
exports.authenticate = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required" });

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }

  const user = await Users.findById(payload.id);
  if (!user || user.status !== "active") {
    return res.status(401).json({ message: "Account not found or disabled" });
  }

  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to do that" });
  }
  next();
};
