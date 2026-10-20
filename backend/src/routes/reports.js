const router = require("express").Router();
const reports = require("../controllers/reportsController");
const { authenticate, requireRole } = require("../middleware/auth");

router.get("/dashboard", authenticate, requireRole("admin"), reports.dashboard);

module.exports = router;
