
import { Router } from "express";
import { query } from "../db/index.js";

const router = Router();

function parseMaybeJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function findSurvey(surveyIdOrSlug) {
  const isNumeric = /^\d+$/.test(String(surveyIdOrSlug));
  const rows = await query(
    `
    SELECT id, slug, name, survey_type AS surveyType, published
    FROM surveys
    WHERE ${isNumeric ? "id = :value" : "slug = :value"}
    LIMIT 1
    `,
    { value: surveyIdOrSlug }
  );

  return rows[0] || null;
}

router.get("/:surveyId", async (req, res, next) => {
  try {
    const survey = await findSurvey(req.params.surveyId);

    if (!survey || !survey.published) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const questions = await query(
      `
      SELECT id, question_key AS questionKey, prompt, question_type AS questionType, options_json AS optionsJson, is_required AS isRequired, sort_order AS sortOrder
      FROM survey_questions
      WHERE survey_id = :surveyId
      ORDER BY sort_order ASC, id ASC
      `,
      { surveyId: survey.id }
    );

    res.json({
      id: survey.id,
      slug: survey.slug,
      name: survey.name,
      surveyType: survey.surveyType,
      questions: questions.map((q) => ({
        id: q.id,
        questionKey: q.questionKey,
        prompt: q.prompt,
        questionType: q.questionType,
        options: parseMaybeJson(q.optionsJson),
        isRequired: Boolean(q.isRequired),
        sortOrder: q.sortOrder
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;
