
import { Router } from "express";
import { query } from "../db/index.js";
import { ensureModuleMediaSchema } from "../db/moduleMediaSchema.js";

const router = Router();

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

async function attachMediaItems(modules) {
  const mediaByModule = await loadMediaItemsForModules(
    modules.map((module) => module.id)
  );

  return modules.map((module) => ({
    ...module,
    mediaItems: mediaByModule.get(Number(module.id)) || []
  }));
}

router.get("/themes", async (req, res, next) => {
  try {
    const rows = await query(
      `
      SELECT id, title, description, sort_order AS sortOrder
      FROM themes
      WHERE published = 1
      ORDER BY sort_order ASC, id ASC
      `
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/themes/:id/modules", async (req, res, next) => {
  try {
    const themeId = Number(req.params.id);

    const rows = await query(
      `
      SELECT id, theme_id AS themeId, title, summary, body,
        image_url AS imageUrl,
        image_alt_text AS imageAltText,
        video_url AS videoUrl,
        challenge_text AS challengeText,
        sort_order AS sortOrder
      FROM modules
      WHERE published = 1 AND theme_id = :themeId
      ORDER BY sort_order ASC, id ASC
      `,
      { themeId }
    );

    res.json(await attachMediaItems(rows));
  } catch (error) {
    next(error);
  }
});

router.get("/modules/:id", async (req, res, next) => {
  try {
    const moduleId = Number(req.params.id);

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
      WHERE id = :moduleId AND published = 1
      LIMIT 1
      `,
      { moduleId }
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Module not found" });
    }

    const [moduleWithMedia] = await attachMediaItems(rows);

    res.json(moduleWithMedia);
  } catch (error) {
    next(error);
  }
});

export default router;
