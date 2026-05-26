
import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { requireAdmin } from "../middleware/auth.js";
import { uploadImage, uploadVideo } from "../middleware/upload.js";
import env from "../config/env.js";
import { query } from "../db/index.js";
import {
  IMAGE_UPLOAD_SUBDIR,
  VIDEO_UPLOAD_SUBDIR,
  resolveUploadDir
} from "../utils/media.js";

const router = Router();

router.use(requireAdmin);

async function listUploadFiles({ subdir, type, referenceColumn }) {
  const uploadRoot = resolveUploadDir(env.UPLOAD_DIR);
  const dir = path.join(uploadRoot, subdir);

  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const filePath = path.join(dir, entry.name);
        const stats = await fs.stat(filePath);
        const url = `/uploads/${subdir}/${entry.name}`;
        const uploadedAt =
          stats.birthtimeMs && stats.birthtimeMs > 0 ? stats.birthtime : stats.mtime;
        const references = await query(
          `
          SELECT id, title
          FROM modules
          WHERE ${referenceColumn} = :url
          ORDER BY id ASC
          `,
          { url }
        );

        return {
          type,
          filename: entry.name,
          url,
          size: stats.size,
          uploadedAt: uploadedAt.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          referencedBy: references.map((module) => ({
            id: module.id,
            title: module.title
          }))
        };
      })
  );

  return files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

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

router.get("/uploads", async (req, res, next) => {
  try {
    const [images, videos] = await Promise.all([
      listUploadFiles({
        subdir: IMAGE_UPLOAD_SUBDIR,
        type: "image",
        referenceColumn: "image_url"
      }),
      listUploadFiles({
        subdir: VIDEO_UPLOAD_SUBDIR,
        type: "video",
        referenceColumn: "video_url"
      })
    ]);

    res.json({ images, videos });
  } catch (error) {
    next(error);
  }
});

export default router;
