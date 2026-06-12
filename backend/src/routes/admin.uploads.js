
import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { requireAdmin } from "../middleware/auth.js";
import { uploadImage, uploadVideo } from "../middleware/upload.js";
import env from "../config/env.js";
import { query, withTransaction } from "../db/index.js";
import { ensureModuleMediaSchema } from "../db/moduleMediaSchema.js";
import { ensureModulePageSchema } from "../db/modulePageSchema.js";
import {
  IMAGE_UPLOAD_SUBDIR,
  VIDEO_UPLOAD_SUBDIR,
  resolveUploadDir
} from "../utils/media.js";

const router = Router();

router.use(requireAdmin);

function uploadConfigForType(type) {
  if (type === "image") {
    return {
      type,
      subdir: IMAGE_UPLOAD_SUBDIR,
      referenceColumn: "image_url"
    };
  }

  if (type === "video") {
    return {
      type,
      subdir: VIDEO_UPLOAD_SUBDIR,
      referenceColumn: "video_url"
    };
  }

  return null;
}

async function listUploadFiles({ subdir, type, referenceColumn }) {
  await ensureModuleMediaSchema();
  await ensureModulePageSchema();

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
          SELECT DISTINCT m.id, m.title
          FROM modules m
          LEFT JOIN module_media mm ON mm.module_id = m.id
          LEFT JOIN module_pages mp ON mp.module_id = m.id
          WHERE m.${referenceColumn} = :url
            OR (mm.media_type = :type AND mm.url = :url)
            OR (mp.page_type = :type AND mp.media_url = :url)
          ORDER BY m.id ASC
          `,
          { url, type }
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

router.delete("/uploads/:type/:filename", async (req, res, next) => {
  try {
    await ensureModuleMediaSchema();
    await ensureModulePageSchema();

    const config = uploadConfigForType(req.params.type);
    if (!config) {
      return res.status(400).json({ message: "Invalid upload type" });
    }

    const filename = path.basename(req.params.filename);
    if (filename !== req.params.filename || !filename) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    const url = `/uploads/${config.subdir}/${filename}`;
    const filePath = path.join(resolveUploadDir(env.UPLOAD_DIR), config.subdir, filename);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    const result = await withTransaction(async (conn) => {
      const [legacyUpdate] = await conn.execute(
        config.type === "image"
          ? `
            UPDATE modules
            SET image_url = '', image_alt_text = ''
            WHERE image_url = ?
            `
          : `
            UPDATE modules
            SET video_url = ''
            WHERE video_url = ?
            `,
        [url]
      );

      const [mediaDelete] = await conn.execute(
        `
        DELETE FROM module_media
        WHERE media_type = ? AND url = ?
        `,
        [config.type, url]
      );

      const [pageDelete] = await conn.execute(
        `
        DELETE FROM module_pages
        WHERE page_type = ? AND media_url = ?
        `,
        [config.type, url]
      );

      return {
        legacyReferencesCleared: legacyUpdate.affectedRows,
        mediaItemsDeleted: mediaDelete.affectedRows,
        pageMediaPagesDeleted: pageDelete.affectedRows
      };
    });

    res.json({
      ok: true,
      type: config.type,
      url,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
