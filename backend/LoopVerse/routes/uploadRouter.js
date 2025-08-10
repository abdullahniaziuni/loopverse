const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || "./public/uploads";

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Create subdirectories based on file type
    const { type } = req.body;
    let subDir = "general";

    if (type === "avatar") subDir = "avatars";
    else if (type === "portfolio") subDir = "portfolios";
    else if (type === "resource") subDir = "resources";
    else if (type === "session") subDir = "sessions";

    const fullPath = path.join(uploadPath, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${req.user.id}-${uniqueSuffix}${extension}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const { type } = req.body;

  if (type === "avatar") {
    // Only allow images for avatars
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for avatars"), false);
    }
  } else if (
    type === "portfolio" ||
    type === "resource" ||
    type === "session"
  ) {
    // Allow images, documents, videos, and audio for portfolio, resource, and session files
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
      "video/mp4",
      "video/webm",
      "video/avi",
      "video/mov",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/m4a",
      "application/zip",
      "application/x-rar-compressed",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  } else {
    cb(new Error("Invalid upload type"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default for video/audio files
  },
});

/**
 * @route POST /api/upload
 * @desc Upload a file
 * @access Private
 */
router.post("/", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const { type } = req.body;

    // Generate file URL
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const relativePath = req.file.path.replace("./public", "");
    const fileUrl = `${baseUrl}${relativePath.replace(/\\/g, "/")}`;

    // Update user profile if it's an avatar
    if (type === "avatar") {
      const Learner = require("../Models/learner");
      const Mentor = require("../Models/mentor");
      const Admin = require("../Models/admin");

      let user;
      if (req.user.userType === "learner") {
        user = await Learner.findById(req.user.id);
      } else if (req.user.userType === "mentor") {
        user = await Mentor.findById(req.user.id);
      } else if (req.user.userType === "admin") {
        user = await Admin.findById(req.user.id);
      }

      if (user) {
        user.profilePicture = fileUrl;
        await user.save();
      }
    }

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        type: type,
      },
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload file",
    });
  }
});

/**
 * @route DELETE /api/upload/:filename
 * @desc Delete an uploaded file
 * @access Private
 */
router.delete("/:filename", auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadPath = process.env.UPLOAD_PATH || "./public/uploads";

    // Find file in subdirectories
    const subdirs = ["avatars", "portfolios", "resources", "general"];
    let filePath = null;

    for (const subdir of subdirs) {
      const testPath = path.join(uploadPath, subdir, filename);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    // Check if user owns this file (filename should start with user ID)
    if (!filename.startsWith(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("File delete error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete file",
    });
  }
});

module.exports = router;
