
import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../db/index.js";
import { createSubmissionCode } from "../utils/ids.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const submissionSchema = z.object({
  cohortCode: z.string().trim().min(1).max(100).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.coerce.number().int().positive(),
        answer: z.union([
          z.string(),
          z.number(),
          z.array(z.string()),
          z.array(z.number())
        ])
      })
    )
    .min(1)
});

function parseMaybeJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function hasMeaningfulAnswer(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
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
      SELECT id, question_key AS questionKey, prompt, question_type AS questionType, 
          options_json AS optionsJson, is_required AS isRequired, sort_order AS sortOrder
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

router.post(
  "/:surveyId/submissions",
  validate(submissionSchema),
  async (req, res, next) => {
    try {
      const survey = await findSurvey(req.params.surveyId);

      if (!survey || !survey.published) {
        return res.status(404).json({ message: "Survey not found" });
      }

      const questions = await query(
        `
        SELECT id, question_type AS questionType, is_required AS isRequired
        FROM survey_questions
        WHERE survey_id = :surveyId
        `,
        { surveyId: survey.id }
      );

      const questionMap = new Map(questions.map((q) => [q.id, q]));
      const answerMap = new Map(req.body.answers.map((a) => [a.questionId, a]));

      if (answerMap.size !== req.body.answers.length) {
        return res.status(400).json({
          message: "Duplicate answers for the same question are not allowed"
        });
      }

      for (const q of questions) {
        if (q.isRequired && !answerMap.has(q.id)) {
          return res.status(400).json({
            message: `Missing required question: ${q.id}`
          });
        }

        if (q.isRequired && !hasMeaningfulAnswer(answerMap.get(q.id)?.answer)) {
          return res.status(400).json({
            message: `Question ${q.id} requires a non-empty answer`
          });
        }
      }

      for (const item of req.body.answers) {
        const question = questionMap.get(item.questionId);

        if (!question) {
          return res.status(400).json({
            message: `Question ${item.questionId} does not belong to this survey`
          });
        }

        if (
          question.questionType === "short_text" &&
          typeof item.answer !== "string"
        ) {
          return res.status(400).json({
            message: `Question ${item.questionId} requires a text answer`
          });
        }

        if (
          question.questionType === "likert" &&
          !["string", "number"].includes(typeof item.answer)
        ) {
          return res.status(400).json({
            message: `Question ${item.questionId} requires a scalar answer`
          });
        }
      }

      const submissionCode = createSubmissionCode();

      const submissionId = await withTransaction(async (conn) => {
        const [submissionResult] = await conn.execute(
          `
          INSERT INTO survey_submissions (survey_id, submission_code, cohort_code)
          VALUES (?, ?, ?)
          `,
          [survey.id, submissionCode, req.body.cohortCode || null]
        );

        const newSubmissionId = submissionResult.insertId;

        for (const item of req.body.answers) {
          const isJsonValue = Array.isArray(item.answer);
          await conn.execute(
            `
            INSERT INTO survey_answers (submission_id, question_id, answer_text, answer_json)
            VALUES (?, ?, ?, ?)
            `,
            [
              newSubmissionId,
              item.questionId,
              isJsonValue ? null : String(item.answer),
              isJsonValue ? JSON.stringify(item.answer) : null
            ]
          );
        }

        return newSubmissionId;
      });

      res.status(201).json({
        submissionId,
        submissionCode
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
