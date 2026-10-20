const router = require("express").Router();
const users = require("../controllers/usersController");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate, requireRole("admin"));

router.get("/", users.getUsers);
router.get("/:id", users.getUser);
router.post("/", users.createUser);
router.put("/:id", users.updateUser);
router.delete("/:id", users.deleteUser);

module.exports = router;
