
import { Router } from "express";
import { z } from "zod";
import { query, execute, withTransaction } from "../db/index.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ensureModuleMediaSchema } from "../db/moduleMediaSchema.js";
import { isMediaReference } from "../utils/media.js";

const router = Router();

function toPublishedFlag(value) {
  return value ? 1 : 0;
}

function normalizeTheme(row) {
  return {
    ...row,
    published: row.published === true || row.published === 1 || row.published === "1"
  };
}

function normalizeModule(row) {
  return {
    ...row,
    published: row.published === true || row.published === 1 || row.published === "1",
    mediaItems: row.mediaItems || []
  };
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeMediaItem(row) {
  return {
    id: row.id,
    moduleId: row.moduleId,
    mediaType: row.mediaType,
    url: row.url,
    altText: row.altText || "",
    sortOrder: row.sortOrder
  };
}

async function loadMediaItemsForModules(moduleIds) {
  await ensureModuleMediaSchema();

  const ids = [...new Set(moduleIds.map(Number).filter((id) => id > 0))];

  if (ids.length === 0) {
    return new Map();
  }

  const placeholders = ids.map(() => "?").join(",");
  const rows = await query(
    `
    SELECT id, module_id AS moduleId, media_type AS mediaType, url,
      alt_text AS altText, sort_order AS sortOrder
    FROM module_media
    WHERE module_id IN (${placeholders})
    ORDER BY module_id ASC, sort_order ASC, id ASC
    `,
    ids
  );

  const mediaByModule = new Map(ids.map((id) => [id, []]));

  for (const row of rows) {
    mediaByModule.get(Number(row.moduleId))?.push(normalizeMediaItem(row));
  }

  return mediaByModule;
}

function legacyMediaItemsFromPayload(payload) {
  const mediaItems = [];

  if (payload.imageUrl) {
    mediaItems.push({
      mediaType: "image",
      url: payload.imageUrl,
      altText: payload.imageAltText || "",
      sortOrder: 0
    });
  }

  if (payload.videoUrl) {
    mediaItems.push({
      mediaType: "video",
      url: payload.videoUrl,
      altText: "",
      sortOrder: mediaItems.length
    });
  }

  return mediaItems;
}

function normalizePayloadMediaItems(payload) {
  const suppliedItems = Array.isArray(payload.mediaItems)
    ? payload.mediaItems
    : [];
  const sourceItems = suppliedItems.length > 0
    ? suppliedItems
    : legacyMediaItemsFromPayload(payload);

  return sourceItems
    .filter((item) => item.url)
    .map((item, index) => ({
      mediaType: item.mediaType,
      url: item.url,
      altText: item.altText || "",
      sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : index
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function modulePayloadForDb(payload, mediaItems) {
  const firstImage = mediaItems.find((item) => item.mediaType === "image");
  const firstVideo = mediaItems.find((item) => item.mediaType === "video");

  return {
    ...payload,
    imageUrl: firstImage?.url || "",
    imageAltText: firstImage?.altText || "",
    videoUrl: firstVideo?.url || "",
    published: toPublishedFlag(payload.published)
  };
}

async function replaceModuleMedia(conn, moduleId, mediaItems) {
  await ensureModuleMediaSchema();

  await conn.execute("DELETE FROM module_media WHERE module_id = ?", [moduleId]);

  for (const [index, item] of mediaItems.entries()) {
    await conn.execute(
      `
      INSERT INTO module_media (module_id, media_type, url, alt_text, sort_order)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        moduleId,
        item.mediaType,
        item.url,
        item.altText || "",
        Number.isInteger(item.sortOrder) ? item.sortOrder : index
      ]
    );
  }
}

async function attachMediaItems(modules) {
  const mediaByModule = await loadMediaItemsForModules(
    modules.map((module) => module.id)
  );

  return modules.map((module) =>
    normalizeModule({
      ...module,
      mediaItems: mediaByModule.get(Number(module.id)) || []
    })
  );
}

const themeSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().default(""),
  sortOrder: z.number().int().min(0).default(0),
  published: z.boolean().default(false)
});

function mediaReferenceSchema(type) {
  return z
    .string()
    .trim()
    .max(500)
    .refine((value) => isMediaReference(value, type), {
      message:
        type === "image"
          ? "Must be an http(s) URL or a local /uploads/images/... path."
          : "Must be an http(s) URL or a local /uploads/videos/... path."
    });
}

export const moduleSchema = z.object({
  themeId: z.number().int().positive(),
  title: z.string().trim().min(1).max(255),
  summary: z.string().trim().max(5000).optional().default(""),
  body: z.string().trim().max(50000).optional().default(""),
  imageUrl: mediaReferenceSchema("image").optional().default(""),
  imageAltText: z.string().trim().max(255).optional().default(""),
  videoUrl: mediaReferenceSchema("video").optional().default(""),
  challengeText: z.string().trim().max(5000).optional().default(""),
  sortOrder: z.number().int().min(0).default(0),
  published: z.boolean().default(false),
  mediaItems: z
    .array(
      z
        .object({
          mediaType: z.enum(["image", "video"]),
          url: z.string().trim().min(1).max(500),
          altText: z.string().trim().max(255).optional().default(""),
          sortOrder: z.number().int().min(0).default(0)
        })
        .superRefine((item, ctx) => {
          if (!isMediaReference(item.url, item.mediaType)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["url"],
              message:
                item.mediaType === "image"
                  ? "Must be an http(s) URL or a local /uploads/images/... path."
                  : "Must be an http(s) URL or a local /uploads/videos/... path."
            });
          }
        })
    )
    .optional()
    .default([])
});

router.use(requireAdmin);

router.get("/themes", async (req, res, next) => {
  try {
    const rows = await query(
      `
      SELECT id, title, description, sort_order AS sortOrder, published
      FROM themes
      ORDER BY sort_order ASC, id ASC
      `
    );

    res.json(rows.map(normalizeTheme));
  } catch (error) {
    next(error);
  }
});

router.post("/themes", validate(themeSchema), async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      published: toPublishedFlag(req.body.published)
    };

    const result = await execute(
      `
      INSERT INTO themes (title, description, sort_order, published)
      VALUES (:title, :description, :sortOrder, :published)
      `,
      payload
    );

    res.status(201).json({
      id: result.insertId,
      ...req.body
    });
  } catch (error) {
    next(error);
  }
});

router.put("/themes/:id", validate(themeSchema), async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid theme id" });
    }

    const payload = {
      id,
      ...req.body,
      published: toPublishedFlag(req.body.published)
    };

    await execute(
      `
      UPDATE themes
      SET title = :title,
          description = :description,
          sort_order = :sortOrder,
          published = :published
      WHERE id = :id
      `,
      payload
    );

    res.json({
      id,
      ...req.body
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/themes/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid theme id" });
    }

    const result = await execute(
      `
      DELETE FROM themes
      WHERE id = :id
      `,
      { id }
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Theme not found" });
    }

    res.json({ ok: true, id });
  } catch (error) {
    next(error);
  }
});

router.get("/modules", async (req, res, next) => {
  try {
    const rows = await query(
      `
      SELECT id, theme_id AS themeId, title, summary, body,
        image_url AS imageUrl,
        image_alt_text AS imageAltText,
        video_url AS videoUrl,
        challenge_text AS challengeText,
        sort_order AS sortOrder,
        published
      FROM modules
      ORDER BY theme_id ASC, sort_order ASC, id ASC
      `
    );

    res.json(await attachMediaItems(rows));
  } catch (error) {
    next(error);
  }
});

router.post("/modules", validate(moduleSchema), async (req, res, next) => {
  try {
    const mediaItems = normalizePayloadMediaItems(req.body);
    const payload = modulePayloadForDb(req.body, mediaItems);

    const id = await withTransaction(async (conn) => {
      const [result] = await conn.execute(
        `
        INSERT INTO modules (
          theme_id, title, summary, body, image_url, image_alt_text, video_url,
          challenge_text, sort_order, published
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          payload.themeId,
          payload.title,
          payload.summary,
          payload.body,
          payload.imageUrl,
          payload.imageAltText,
          payload.videoUrl,
          payload.challengeText,
          payload.sortOrder,
          payload.published
        ]
      );

      await replaceModuleMedia(conn, result.insertId, mediaItems);

      return result.insertId;
    });

    res.status(201).json({
      id,
      ...req.body,
      imageUrl: payload.imageUrl,
      imageAltText: payload.imageAltText,
      videoUrl: payload.videoUrl,
      mediaItems
    });
  } catch (error) {
    next(error);
  }
});

router.put("/modules/:id", validate(moduleSchema), async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid module id" });
    }

    const mediaItems = normalizePayloadMediaItems(req.body);
    const payload = {
      id,
      ...modulePayloadForDb(req.body, mediaItems)
    };

    await withTransaction(async (conn) => {
      await conn.execute(
        `
        UPDATE modules
        SET theme_id = ?,
          title = ?,
          summary = ?,
          body = ?,
          image_url = ?,
          image_alt_text = ?,
          video_url = ?,
          challenge_text = ?,
          sort_order = ?,
          published = ?
        WHERE id = ?
        `,
        [
          payload.themeId,
          payload.title,
          payload.summary,
          payload.body,
          payload.imageUrl,
          payload.imageAltText,
          payload.videoUrl,
          payload.challengeText,
          payload.sortOrder,
          payload.published,
          id
        ]
      );

      await replaceModuleMedia(conn, id, mediaItems);
    });

    res.json({
      id,
      ...req.body,
      imageUrl: payload.imageUrl,
      imageAltText: payload.imageAltText,
      videoUrl: payload.videoUrl,
      mediaItems
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/modules/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid module id" });
    }

    const result = await execute(
      `
      DELETE FROM modules
      WHERE id = :id
      `,
      { id }
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Module not found" });
    }

    res.json({ ok: true, id });
  } catch (error) {
    next(error);
  }
});

export default router;
