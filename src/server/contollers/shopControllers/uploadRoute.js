import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

import { isAdmin, cors, jwtMiddleware } from "../../middleware";

import db from "../../models";

const User = db.user;

const uploadDir = path.join(__dirname, "..", "..", "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const filename = file.originalname
      .replace(/[^a-z0-9.]/gi, "_")
      .toLowerCase();
    const date = new Date().toISOString().replace(/:/g, "-"); // Replace ':' to ensure compatibility
    cb(null, `${date}-${filename}`);
  },
});

// eslint-disable-next-line
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    return cb(null, true);
  }
  cb(null, false);
  return cb(new Error("Allowed only .png, .jpg, and .jpeg files."));
};

const limits = {
  files: 1,
  fileSize: 1024 * 1024, // 1MB
};

const router = express.Router();

router.post(
  "/*",
  [
    cors,
    jwtMiddleware,
    isAdmin,
    multer({ storage: fileStorage, limits, fileFilter }).single("image"),
  ],
  async (req, res) => {
    if (!req.file) {
      return res.status(412).send({
        message: "Image is required.",
      });
    }
    const userId = req.accessTokenUserId;
    const user = await User.findById(userId);
    if (user) {
      const filePath = `/uploads/${req.file.filename}`;
      user.image = filePath;
      const updatedUser = await user.save();
      if (updatedUser) {
        return res
          .status(200)
          .send({ filePath, message: "Upload successful." });
      }
    }
    return res.status(500).send({ message: "Upload failed, try again." });
  }
);

export default router;
