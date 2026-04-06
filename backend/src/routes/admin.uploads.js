
import { Router } from "express";
import path from "path";
import { requireAdmin } from "../middleware/auth.js";
import uploadImage from "../middleware/upload.js";

const router = Router();

router.use(requireAdmin);

router.post("/uploads/image", uploadImage.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image uploaded"
    });
  }

  const relativeUrl = `/uploads/images/${path.basename(req.file.filename)}`;

  return res.status(201).json({
    message: "Image uploaded successfully",
    imageUrl: relativeUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

export default router;
