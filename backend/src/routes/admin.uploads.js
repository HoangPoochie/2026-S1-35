
import { Router } from "express";
import path from "path";
import { requireAdmin } from "../middleware/auth.js";
import { uploadImage, uploadVideo } from "../middleware/upload.js";
import {
  IMAGE_UPLOAD_SUBDIR,
  VIDEO_UPLOAD_SUBDIR
} from "../utils/media.js";

const router = Router();

router.use(requireAdmin);

function buildUploadResponse(req, res, { fieldName, subdir, responseKey, successMessage }) {
  if (!req.file) {
    return res.status(400).json({
      message: `No ${fieldName} uploaded`
    });
  }

  const relativeUrl = `/uploads/${subdir}/${path.basename(req.file.filename)}`;

  return res.status(201).json({
    message: successMessage,
    [responseKey]: relativeUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
}

router.post("/uploads/image", uploadImage.single("image"), (req, res) => {
  return buildUploadResponse(req, res, {
    fieldName: "image",
    subdir: IMAGE_UPLOAD_SUBDIR,
    responseKey: "imageUrl",
    successMessage: "Image uploaded successfully"
  });
});

router.post("/uploads/video", uploadVideo.single("video"), (req, res) => {
  return buildUploadResponse(req, res, {
    fieldName: "video",
    subdir: VIDEO_UPLOAD_SUBDIR,
    responseKey: "videoUrl",
    successMessage: "Video uploaded successfully"
  });
});

export default router;
