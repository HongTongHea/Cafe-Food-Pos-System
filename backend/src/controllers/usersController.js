const bcrypt = require("bcryptjs");
const Users = require("../models/usersModel");
const { httpError } = require("../middleware/error");

const ROLES = ["admin", "cashier"];
const STATUSES = ["active", "inactive"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parse(body, { creating }) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const role = body.role || "cashier";
  const status = body.status || "active";
  const password = body.password ? String(body.password) : "";

  if (!name) throw httpError(400, "Name is required");
  if (!EMAIL_RE.test(email)) throw httpError(400, "A valid email is required");
  if (!ROLES.includes(role)) throw httpError(400, "Invalid role");
  if (!STATUSES.includes(status)) throw httpError(400, "Invalid status");
  if (creating && !password) throw httpError(400, "Password is required");
  if (password && password.length < 6) throw httpError(400, "Password must be at least 6 characters");

  return { name, email, role, status, password };
}

exports.getUsers = async (req, res) => {
  res.json(await Users.list());
};

exports.getUser = async (req, res) => {
  const user = await Users.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

exports.createUser = async (req, res) => {
  const data = parse(req.body, { creating: true });

  if (await Users.findByEmail(data.email)) {
    return res.status(409).json({ message: "A user with this email already exists" });
  }

  const id = await Users.create({ ...data, password: await bcrypt.hash(data.password, 10) });
  res.status(201).json(await Users.findById(id));
};

exports.updateUser = async (req, res) => {
  const id = Number(req.params.id);
  const existing = await Users.findById(id);
  if (!existing) return res.status(404).json({ message: "User not found" });

  const data = parse(req.body, { creating: false });

  const other = await Users.findByEmail(data.email);
  if (other && other.id !== id) {
    return res.status(409).json({ message: "A user with this email already exists" });
  }

  // Never let the shop lose its last active admin.
  const losingAdmin = existing.role === "admin" && (data.role !== "admin" || data.status !== "active");
  if (losingAdmin && (await Users.countActiveAdmins(id)) === 0) {
    return res.status(400).json({ message: "There must be at least one active admin" });
  }

  await Users.update(id, {
    ...data,
    password: data.password ? await bcrypt.hash(data.password, 10) : undefined,
  });
  res.json(await Users.findById(id));
};

exports.deleteUser = async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ message: "You cannot delete your own account" });

  const existing = await Users.findById(id);
  if (!existing) return res.status(404).json({ message: "User not found" });

  if (existing.role === "admin" && (await Users.countActiveAdmins(id)) === 0) {
    return res.status(400).json({ message: "There must be at least one active admin" });
  }

  await Users.remove(id); // past orders keep their data (user_id becomes NULL)
  res.json({ message: "User deleted" });
};
