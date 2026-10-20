const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn } = require("../config/env");
const Users = require("../models/usersModel");

// POST /api/auth/login
exports.login = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await Users.findByEmailWithPassword(email);
  // Same message for unknown email / wrong password so accounts can't be enumerated.
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) return res.status(401).json({ message: "Invalid email or password" });

  if (user.status !== "active") {
    return res.status(403).json({ message: "This account has been disabled" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

// GET /api/auth/me
exports.me = async (req, res) => {
  res.json({ user: req.user });
};
