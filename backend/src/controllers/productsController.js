const Products = require("../models/productsModel");
const Categories = require("../models/categoriesModel");
const { httpError } = require("../middleware/error");

async function parse(body) {
  const product_name = String(body.product_name || "").trim();
  const price = Number(body.price);
  const track_stock = body.track_stock ? 1 : 0;
  const stock_quantity = track_stock ? Math.trunc(Number(body.stock_quantity) || 0) : 0;
  const category_id = body.category_id ? Number(body.category_id) : null;

  if (!product_name) throw httpError(400, "Product name is required");
  if (!Number.isFinite(price) || price < 0) throw httpError(400, "Price must be a positive number");
  if (stock_quantity < 0) throw httpError(400, "Stock cannot be negative");
  if (category_id && !(await Categories.findById(category_id))) throw httpError(400, "Category does not exist");

  return {
    category_id,
    product_name: product_name.slice(0, 150),
    description: body.description ? String(body.description).trim().slice(0, 255) : null,
    price: Math.round(price * 100) / 100,
    track_stock,
    stock_quantity,
    image_url: body.image_url ? String(body.image_url).trim().slice(0, 500) : null,
    is_active: body.is_active === false || body.is_active === 0 ? 0 : 1,
  };
}

// Cashiers only ever need active products; admins can see everything.
exports.getProducts = async (req, res) => {
  const onlyActive = req.query.active === "1" || req.user.role !== "admin";
  res.json(await Products.list({ onlyActive }));
};

exports.getProduct = async (req, res) => {
  const product = await Products.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

exports.createProduct = async (req, res) => {
  const data = await parse(req.body);
  if (await Products.findByName(data.product_name)) {
    return res.status(409).json({ message: "A product with this name already exists" });
  }
  const id = await Products.create(data);
  res.status(201).json(await Products.findById(id));
};

exports.updateProduct = async (req, res) => {
  const id = Number(req.params.id);
  if (!(await Products.findById(id))) return res.status(404).json({ message: "Product not found" });

  const data = await parse(req.body);
  const dupe = await Products.findByName(data.product_name);
  if (dupe && dupe.id !== id) {
    return res.status(409).json({ message: "A product with this name already exists" });
  }

  await Products.update(id, data);
  res.json(await Products.findById(id));
};

exports.deleteProduct = async (req, res) => {
  if (!(await Products.findById(req.params.id))) return res.status(404).json({ message: "Product not found" });
  await Products.remove(req.params.id); // order history keeps the product name snapshot
  res.json({ message: "Product deleted" });
};
