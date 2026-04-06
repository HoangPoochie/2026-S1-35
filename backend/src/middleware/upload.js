
import fs from "fs";
import path from "path";
import multer from "multer";
import env from "../config/env.js";

const imageDir = path.join(env.UPLOAD_DIR, "images");

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg"
]);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, imageDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

function fileFilter(req, file, cb) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
  }
  cb(null, true);
}

const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024
  }
});

export default uploadImage;
