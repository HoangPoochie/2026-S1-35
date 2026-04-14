
import fs from "fs";
import path from "path";
import multer from "multer";
import env from "../config/env.js";
import {
  IMAGE_UPLOAD_SUBDIR,
  VIDEO_UPLOAD_SUBDIR,
  resolveUploadDir
} from "../utils/media.js";

const imageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg"
]);

const videoMimeTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg"
]);

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createUpload({ subdir, allowedMimeTypes, errorMessage, maxUploadMb }) {
  const uploadDir = path.join(resolveUploadDir(env.UPLOAD_DIR), subdir);
  ensureDirExists(uploadDir);

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, uploadDir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safeName);
    }
  });

  function fileFilter(req, file, cb) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error(errorMessage));
    }

    cb(null, true);
  }

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxUploadMb * 1024 * 1024
    }
  });
}

const uploadImage = createUpload({
  subdir: IMAGE_UPLOAD_SUBDIR,
  allowedMimeTypes: imageMimeTypes,
  errorMessage: "Only JPG, PNG, and WEBP images are allowed.",
  maxUploadMb: env.MAX_UPLOAD_MB
});

export const uploadVideo = createUpload({
  subdir: VIDEO_UPLOAD_SUBDIR,
  allowedMimeTypes: videoMimeTypes,
  errorMessage: "Only MP4, WEBM, MOV, and OGG videos are allowed.",
  maxUploadMb: env.MAX_VIDEO_UPLOAD_MB
});

export { uploadImage };
export default uploadImage;
