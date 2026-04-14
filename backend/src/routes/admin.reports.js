
import { Router } from "express";
import { query } from "../db/index.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

function parseMaybeJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

router.use(requireAdmin);

router.get("/surveys/:surveyId/summary", async (req, res, next) => {
  try {
    const surveyId = Number(req.params.surveyId);

    const [survey] = await query(
      `
      SELECT id, slug, name, survey_type AS surveyType
      FROM surveys
      WHERE id = :surveyId
      LIMIT 1
      `,
      { surveyId }
    );

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const [submissionCountRow] = await query(
      `
      SELECT COUNT(*) AS totalSubmissions
      FROM survey_submissions
      WHERE survey_id = :surveyId
      `,
      { surveyId }
    );

    const questions = await query(
      `
      SELECT id, question_key AS questionKey, prompt, question_type AS questionType
      FROM survey_questions
      WHERE survey_id = :surveyId
      ORDER BY sort_order ASC, id ASC
      `,
      { surveyId }
    );

    const summaries = [];

    for (const q of questions) {
      if (q.questionType === "short_text") {
        const responses = await query(
          `
          SELECT answer_text AS answerText
          FROM survey_answers
          WHERE question_id = :questionId
            AND answer_text IS NOT NULL
            AND TRIM(answer_text) <> ''
          ORDER BY id DESC
          LIMIT 20
          `,
          { questionId: q.id }
        );

        summaries.push({
          questionId: q.id,
          questionKey: q.questionKey,
          prompt: q.prompt,
          questionType: q.questionType,
          latestResponses: responses.map((r) => r.answerText)
        });
        continue;
      }

      const distribution = await query(
        `
        SELECT answer_text AS answerText, answer_json AS answerJson, COUNT(*) AS count
        FROM survey_answers
        WHERE question_id = :questionId
        GROUP BY answer_text, answer_json
        ORDER BY count DESC
        `,
        { questionId: q.id }
      );

      const [avgRow] = await query(
        `
        SELECT AVG(CAST(answer_text AS DECIMAL(10,2))) AS averageValue
        FROM survey_answers
        WHERE question_id = :questionId
          AND answer_text REGEXP '^[0-9]+(\\.[0-9]+)?$'
        `,
        { questionId: q.id }
      );

      summaries.push({
        questionId: q.id,
        questionKey: q.questionKey,
        prompt: q.prompt,
        questionType: q.questionType,
        averageValue:
          avgRow?.averageValue === null || avgRow?.averageValue === undefined
            ? null
            : Number(avgRow.averageValue),
        distribution: distribution.map((row) => ({
          value: row.answerJson ? parseMaybeJson(row.answerJson) : row.answerText,
          count: row.count
        }))
      });
    }

    res.json({
      survey,
      totalSubmissions: submissionCountRow.totalSubmissions,
      questions: summaries
    });
  } catch (error) {
    next(error);
  }
});

export default router;
