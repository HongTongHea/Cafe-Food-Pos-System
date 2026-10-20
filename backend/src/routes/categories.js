const router = require("express").Router();
const categories = require("../controllers/categoriesController");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate);

router.get("/", categories.getCategories);
router.post("/", requireRole("admin"), categories.createCategory);
router.put("/:id", requireRole("admin"), categories.updateCategory);
router.delete("/:id", requireRole("admin"), categories.deleteCategory);

module.exports = router;
