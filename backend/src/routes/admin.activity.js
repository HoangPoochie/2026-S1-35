
import { Router } from "express";
import { z } from "zod";
import { query } from "../db/index.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { publicLimiter } from "../middleware/rateLimit.js";

const router = Router();

const pageViewSchema = z.object({
  submissionCode: z.string().trim().min(1).max(50).nullable().optional(),
  pagePath: z.string().trim().min(1).max(500),
  pageTitle: z.string().trim().max(255).nullable().optional(),
  referrer: z.string().trim().max(500).nullable().optional()
});

router.post(
  "/page-view",
  publicLimiter,
  validate(pageViewSchema),
  async (req, res, next) => {
    try {
      await query(
        `
        INSERT INTO page_views (submission_code, page_path, page_title, referrer)
        VALUES (:submissionCode, :pagePath, :pageTitle, :referrer)
        `,
        {
          submissionCode: req.body.submissionCode || null,
          pagePath: req.body.pagePath,
          pageTitle: req.body.pageTitle || null,
          referrer: req.body.referrer || null
        }
      );

      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/recent", requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const activities = await query(
      `
      SELECT
        'page_view' AS activityType,
        pv.id,
        pv.submission_code AS submissionCode,
        ss.cohort_code AS cohortCode,
        pv.page_title AS pageTitle,
        pv.page_path AS pagePath,
        pv.viewed_at AS timestamp
      FROM page_views pv
      LEFT JOIN survey_submissions ss ON pv.submission_code = ss.submission_code

      UNION ALL

      SELECT
        'survey_submission' AS activityType,
        ss.id,
        ss.submission_code AS submissionCode,
        ss.cohort_code AS cohortCode,
        s.name AS surveyName,
        NULL AS pagePath,
        ss.created_at AS timestamp
      FROM survey_submissions ss
      JOIN surveys s ON ss.survey_id = s.id

      ORDER BY timestamp DESC
      LIMIT :limit
      `,
      { limit }
    );

    res.json({ activities });
  } catch (error) {
    next(error);
  }
});

router.get("/views-per-day", requireAdmin, async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 90);

    const report = await query(
      `
      SELECT
        DATE_FORMAT(viewed_at, '%Y-%m-%d') AS date,
        COUNT(*) AS totalViews,
        COUNT(DISTINCT submission_code) AS uniqueUsers
      FROM page_views
      WHERE viewed_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
      GROUP BY DATE_FORMAT(viewed_at, '%Y-%m-%d')
      ORDER BY date DESC
      `
    );

    const [summaryRow] = await query(
      `
      SELECT
        COUNT(*) AS totalViews,
        COUNT(*) / ${days} AS averageViewsPerDay
      FROM page_views
      WHERE viewed_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
      `
    );

    const summary = {
      totalViews: summaryRow?.totalViews || 0,
      averageViewsPerDay: summaryRow?.averageViewsPerDay || 0
    };

    res.json({ report, summary });
  } catch (error) {
    next(error);
  }
});

router.get("/views-per-page", requireAdmin, async (req, res, next) => {
  try {
    const report = await query(
      `
      SELECT
        page_path AS pagePath,
        MAX(page_title) AS pageTitle,
        COUNT(*) AS totalViews,
        COUNT(DISTINCT submission_code) AS uniqueUsers
      FROM page_views
      GROUP BY page_path
      ORDER BY totalViews DESC
      `
    );

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

export default router;
