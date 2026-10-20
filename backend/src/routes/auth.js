const router = require("express").Router();
const auth = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/login", auth.login);
router.get("/me", authenticate, auth.me);

module.exports = router;
