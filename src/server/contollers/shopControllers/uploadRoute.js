import express from "express";
import multer from "multer";

import { isAdmin, cors, jwtMiddleware } from "../../middleware";

import db from "../../models";

const User = db.user;

const fileStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    const filename = file.originalname
      .replace(/[^a-z0-9.]/gi, "_")
      .toLowerCase();
    cb(null, `${new Date().toISOString()}-${filename}`);
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
      return res.status(500).send({
        message: "Internal server error, try again.",
      });
    }

    const userId = req.accessTokenUserId;
    const user = await User.findById(userId);
    if (user) {
      user.image = req.file.path;
      const updatedUser = await user.save();
      if (updatedUser) {
        return res.status(200).send({ filePath: `/${req.file.path}` });
      }
    }
    return res.status(500).send({ message: "Upload failed, try again." });
  }
);

export default router;
