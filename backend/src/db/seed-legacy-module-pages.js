import fs from "fs/promises";
import { fileURLToPath } from "url";
import pool, { execute, query } from "./index.js";
import { ensureModulePageSchema } from "./modulePageSchema.js";
import logger from "../utils/logger.js";

const legacyScreensUrl = new URL("./bvmLegacyScreens.json", import.meta.url);
const legacyScreens = JSON.parse(
  await fs.readFile(fileURLToPath(legacyScreensUrl), "utf8")
);

const targetTitlesByLegacyId = {
  "self-awareness": ["Self-Awareness"],
  "self-management": ["Self Management"],
  "social-awareness": ["Social Awareness"],
  "relationship-management": ["Relationship Management"],
  values: ["Values, Character Traits, & Strengths", "Values-CharacterTraits-&-Strengths"],
  leadership: ["Leadership"]
};

function titleFromScreen(screen, fallback) {
  return screen.heading || screen.title || screen.videoTitle || fallback;
}

function bodyFromScreen(screen) {
  return screen.body || screen.activity || screen.instruction || screen.intro || "";
}

function mediaUrlFromScreen(screen) {
  return screen.imageUrl || screen.url || "";
}

function mediaAltTextFromScreen(screen) {
  return screen.imageAltText || screen.videoTitle || screen.heading || "";
}

async function findModuleForLegacyId(legacyId) {
  const titles = targetTitlesByLegacyId[legacyId] || [];

  if (titles.length === 0) {
    return null;
  }

  const placeholders = titles.map(() => "?").join(",");
  const rows = await query(
    `
    SELECT m.id, m.title
    FROM modules m
    INNER JOIN themes t ON t.id = m.theme_id
    WHERE t.title = 'Six Skills'
      AND m.title IN (${placeholders})
    ORDER BY m.id ASC
    LIMIT 1
    `,
    titles
  );

  return rows[0] || null;
}

async function modulePageStats(moduleId) {
  const rows = await query(
    `
    SELECT COUNT(*) AS pageCount,
      SUM(CASE WHEN content_json IS NULL THEN 0 ELSE 1 END) AS richPageCount
    FROM module_pages
    WHERE module_id = :moduleId
    `,
    { moduleId }
  );

  return {
    pageCount: Number(rows[0]?.pageCount || 0),
    richPageCount: Number(rows[0]?.richPageCount || 0)
  };
}

async function replacePages(module, screens) {
  await execute(
    `
    DELETE FROM module_pages
    WHERE module_id = :moduleId
    `,
    { moduleId: module.id }
  );

  for (const [index, screen] of screens.entries()) {
    await execute(
      `
      INSERT INTO module_pages (
        module_id, page_type, title, body, media_url, media_alt_text,
        content_json, sort_order
      )
      VALUES (
        :moduleId, :pageType, :title, :body, :mediaUrl, :mediaAltText,
        :contentJson, :sortOrder
      )
      `,
      {
        moduleId: module.id,
        pageType: screen.type || "text",
        title: titleFromScreen(screen, module.title),
        body: bodyFromScreen(screen),
        mediaUrl: mediaUrlFromScreen(screen),
        mediaAltText: mediaAltTextFromScreen(screen),
        contentJson: JSON.stringify(screen),
        sortOrder: index
      }
    );
  }
}

async function run() {
  await ensureModulePageSchema();

  for (const legacyModule of legacyScreens) {
    const screens = legacyModule.screens || [];
    if (screens.length === 0) continue;

    const module = await findModuleForLegacyId(legacyModule.id);
    if (!module) continue;

    const { pageCount, richPageCount } = await modulePageStats(module.id);
    const hasOnlyCompressedPages = richPageCount === 0 && pageCount <= 3;

    if (!hasOnlyCompressedPages) {
      logger.info(`Skipped legacy pages for module: ${module.title}`, {
        pageCount,
        richPageCount
      });
      continue;
    }

    await replacePages(module, screens);
    logger.info(`Restored legacy pages for module: ${module.title}`, {
      pages: screens.length
    });
  }

  await pool.end();
}

run().catch(async (error) => {
  logger.error("Legacy module page seed failed", { message: error.message });
  await pool.end();
  process.exit(1);
});
