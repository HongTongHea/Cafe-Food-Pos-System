const router = require("express").Router();
const orders = require("../controllers/ordersController");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate);

router.get("/", orders.getOrders);
router.post("/", orders.createOrder);
router.get("/:id", orders.getOrder);
router.post("/:id/void", requireRole("admin"), orders.voidOrder);

module.exports = router;
