
import { Router } from "express";
import { query } from "../db/index.js";

const router = Router();

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
      SELECT id, theme_id AS themeId, title, summary, video_url AS videoUrl,
             challenge_text AS challengeText, sort_order AS sortOrder
      FROM modules
      WHERE published = 1 AND theme_id = :themeId
      ORDER BY sort_order ASC, id ASC
      `,
      { themeId }
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/modules/:id", async (req, res, next) => {
  try {
    const moduleId = Number(req.params.id);

    const rows = await query(
      `
      SELECT id, theme_id AS themeId, title, summary, body, video_url AS videoUrl, challenge_text AS challengeText, sort_order AS sortOrder, published
      FROM modules
      WHERE id = :moduleId AND published = 1
      LIMIT 1
      `,
      { moduleId }
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Module not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
