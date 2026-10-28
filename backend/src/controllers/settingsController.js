const path = require("path");
const fs = require("fs");
const Settings = require("../models/settingsModel");

const uploadDir = path.join(__dirname, "../../uploads");

// Delete an old logo file from disk (only files inside /uploads)
const deleteOldLogo = (logoUrl) => {
  if (!logoUrl) return;

  try {
    // Works for "/uploads/x.png" and for old full URLs "http://host/uploads/x.png"
    const pathname = logoUrl.startsWith("http")
      ? new URL(logoUrl).pathname
      : logoUrl;

    if (!pathname.startsWith("/uploads/")) return;

    const filePath = path.join(uploadDir, path.basename(pathname));

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Delete old logo error:", error);
  }
};

// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    return res.status(200).json({
      success: true,
      data: {
        shopName: settings.shop_name,
        logoUrl: settings.logo_url,
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get shop settings",
    });
  }
};

// PUT /api/settings
exports.updateSettings = async (req, res) => {
  try {
    const { shopName, logoUrl } = req.body;

    if (
      typeof shopName !== "string" ||
      !shopName.trim() ||
      shopName.trim().length > 255
    ) {
      return res.status(400).json({
        success: false,
        message: "Shop name is required and must not exceed 255 characters",
      });
    }

    if (
      logoUrl !== undefined &&
      logoUrl !== null &&
      (typeof logoUrl !== "string" || logoUrl.length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid logo URL",
      });
    }

    const current = await Settings.getSettings();

    // undefined = keep the current logo, null = remove the logo
    const nextLogoUrl = logoUrl === undefined ? current.logo_url : logoUrl;

    const settings = await Settings.update(
      current.id,
      shopName.trim(),
      nextLogoUrl ?? null,
    );

    // Remove the previous file if the logo was replaced or removed
    if (current.logo_url && current.logo_url !== settings.logo_url) {
      deleteOldLogo(current.logo_url);
    }

    return res.status(200).json({
      success: true,
      message: "Shop settings updated successfully",
      data: {
        shopName: settings.shop_name,
        logoUrl: settings.logo_url,
      },
    });
  } catch (error) {
    console.error("Update settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update shop settings",
    });
  }
};
