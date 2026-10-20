const router = require("express").Router();
const products = require("../controllers/productsController");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate);

router.get("/", products.getProducts);
router.get("/:id", products.getProduct);
router.post("/", requireRole("admin"), products.createProduct);
router.put("/:id", requireRole("admin"), products.updateProduct);
router.delete("/:id", requireRole("admin"), products.deleteProduct);

module.exports = router;
