const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const settingsController = require("../controllers/settingsController");
const { authenticate, requireRole } = require("../middleware/auth");

// Save uploaded logos in backend/uploads
const uploadDir = path.join(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const EXTENSIONS = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = EXTENSIONS[file.mimetype];
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!EXTENSIONS[file.mimetype]) {
      return cb(new Error("Only PNG, JPG, and WEBP images are allowed"));
    }
    cb(null, true);
  },
});

router.use(authenticate);

// Get shop name and logo
router.get("/", settingsController.getSettings);

// Upload logo image (admin only)
router.post(
  "/logo",
  requireRole("admin"),
  (req, res, next) => {
    upload.single("logo")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Logo upload failed",
        });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a logo image",
      });
    }

    // Store a relative path in the database, not a full URL
    const logoUrl = `/uploads/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: "Logo uploaded successfully",
      data: { logoUrl },
    });
  },
);

// Update shop name and logo URL (admin only)
router.put(
  "/",
  authenticate,
  requireRole("admin"),
  settingsController.updateSettings,
);

module.exports = router;
