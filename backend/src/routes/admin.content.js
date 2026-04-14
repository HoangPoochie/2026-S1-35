
import { Router } from "express";
import { z } from "zod";
import { query, execute } from "../db/index.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { isMediaReference } from "../utils/media.js";

const router = Router();

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
  published: z.boolean().default(false)
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

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/themes", validate(themeSchema), async (req, res, next) => {
  try {
    const result = await execute(
      `
      INSERT INTO themes (title, description, sort_order, published)
      VALUES (:title, :description, :sortOrder, :published)
      `,
      req.body
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
    const id = Number(req.params.id);

    await execute(
      `
      UPDATE themes
      SET title = :title,
          description = :description,
          sort_order = :sortOrder,
          published = :published
      WHERE id = :id
      `,
      { id, ...req.body }
    );

    res.json({
      id,
      ...req.body
    });
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

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/modules", validate(moduleSchema), async (req, res, next) => {
  try {
    const result = await execute(
      `
      INSERT INTO modules (
        theme_id, title, summary, body, image_url, image_alt_text, video_url,
        challenge_text, sort_order, published
      )
      VALUES (
        :themeId, :title, :summary, :body, :imageUrl, :imageAltText, :videoUrl,
        :challengeText, :sortOrder, :published
      )
      `,
      req.body
    );

    res.status(201).json({
      id: result.insertId,
      ...req.body
    });
  } catch (error) {
    next(error);
  }
});

router.put("/modules/:id", validate(moduleSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    await execute(
      `
      UPDATE modules
      SET theme_id = :themeId,
        title = :title,
        summary = :summary,
        body = :body,
        image_url = :imageUrl,
        image_alt_text = :imageAltText,
        video_url = :videoUrl,
        challenge_text = :challengeText,
        sort_order = :sortOrder,
        published = :published
      WHERE id = :id
      `,
      { id, ...req.body }
    );

    res.json({
      id,
      ...req.body
    });
  } catch (error) {
    next(error);
  }
});

export default router;
