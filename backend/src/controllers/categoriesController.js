const Categories = require("../models/categoriesModel");

const cleanName = (body) => String(body.name || "").trim().slice(0, 80);

exports.getCategories = async (req, res) => {
  res.json(await Categories.list());
};

exports.createCategory = async (req, res) => {
  const name = cleanName(req.body);
  if (!name) return res.status(400).json({ message: "Category name is required" });
  const id = await Categories.create(name);
  res.status(201).json(await Categories.findById(id));
};

exports.updateCategory = async (req, res) => {
  const name = cleanName(req.body);
  if (!name) return res.status(400).json({ message: "Category name is required" });
  if (!(await Categories.findById(req.params.id))) return res.status(404).json({ message: "Category not found" });
  await Categories.update(req.params.id, name);
  res.json(await Categories.findById(req.params.id));
};

exports.deleteCategory = async (req, res) => {
  if (!(await Categories.findById(req.params.id))) return res.status(404).json({ message: "Category not found" });
  await Categories.remove(req.params.id); // products become "uncategorised"
  res.json({ message: "Category deleted" });
};
