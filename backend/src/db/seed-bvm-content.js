import pool, { execute, query } from "./index.js";
import logger from "../utils/logger.js";

const programContent = [
  {
    title: "Start here",
    description:
      "Introductory workshop content for the Best Version of Me program.",
    sortOrder: 0,
    published: true,
    modules: [
      {
        title: "Welcome to Best Version of Me",
        summary:
          "Meet the program, understand what self-awareness means, and discover the six skills you'll explore today.",
        body:
          "Welcome to the Best Version of Me program. These modules help participants explore self-awareness, self-management, social awareness, relationship management, values, character traits, strengths, and leadership.\n\nAcknowledgement of Country: We acknowledge the Kaurna people as the custodians of the lands and waters of the Adelaide region, on which we meet today. We pay respect to elders both past and present, and respect the Kaurna people's cultural, spiritual, physical and emotional connection with land, waters and community.",
        challengeText:
          "Welcome activity: stand on either side of a line in the middle of the room, facing each other. Listen to each question and position yourself to show your answer.",
        sortOrder: 0,
        published: true
      }
    ]
  },
  {
    title: "Six Skills",
    description:
      "The six core workshop modules from the original public program.",
    sortOrder: 1,
    published: true,
    modules: [
      {
        title: "Self-Awareness",
        summary:
          "Understanding your own emotions, thoughts, and behaviours, and how they affect yourself and others.",
        body:
          "Self-awareness is understanding yourself, your thoughts, feelings, and actions. It is like looking in a mirror and seeing yourself clearly, knowing what you need to work on, and how you affect others.",
        challengeText:
          "Use your BVM Journal to rate yourself on the self-awareness skills, then choose one strength and one area to grow.",
        sortOrder: 1,
        published: true
      },
      {
        title: "Self Management",
        summary:
          "Controlling your emotions, behaviours, and actions to stay focused on your goals.",
        body:
          "Self management is about noticing how you feel, choosing helpful actions, and staying focused even when things are difficult.",
        challengeText:
          "Think of one situation where you could pause, breathe, and choose your response before acting.",
        sortOrder: 2,
        published: true
      },
      {
        title: "Social Awareness",
        summary:
          "Understanding how other people feel and what's happening in the world around you.",
        body:
          "Social awareness helps you notice other people's feelings, perspectives, and needs. It supports empathy, respect, and better communication.",
        challengeText:
          "Choose a scenario and list three different perspectives people in that situation might have.",
        sortOrder: 3,
        published: true
      },
      {
        title: "Relationship Management",
        summary:
          "Effective relationships are built on communication, empathy, and trust.",
        body:
          "Relationship management is about building positive connections, listening well, resolving conflict, and supporting others.",
        challengeText:
          "Write down one relationship skill you already use well and one skill you want to practise.",
        sortOrder: 4,
        published: true
      },
      {
        title: "Values, Character Traits, & Strengths",
        summary:
          "Values = what matters most to you. Character Traits = who you are. Strengths = what you're good at.",
        body:
          "Values guide choices, character traits describe who you are, and strengths are the abilities or qualities you can use to contribute.",
        challengeText:
          "Pick three values that matter to you and one strength you can use this week.",
        sortOrder: 5,
        published: true
      },
      {
        title: "Leadership",
        summary:
          "The ability to guide, inspire, and support others in a positive way.",
        body:
          "Leadership is not only about being in charge. It is about encouraging others, making responsible choices, and helping a group move forward.",
        challengeText:
          "Name one small leadership action you can take today to support someone else.",
        sortOrder: 6,
        published: true
      }
    ]
  }
];

async function findTheme(title) {
  const rows = await query(
    `
    SELECT id
    FROM themes
    WHERE title = :title
    ORDER BY id ASC
    LIMIT 1
    `,
    { title }
  );

  return rows[0] || null;
}

async function findModule(themeId, title) {
  const rows = await query(
    `
    SELECT id
    FROM modules
    WHERE theme_id = :themeId AND title = :title
    ORDER BY id ASC
    LIMIT 1
    `,
    { themeId, title }
  );

  return rows[0] || null;
}

async function upsertTheme(theme) {
  const existing = await findTheme(theme.title);

  if (existing) {
    await execute(
      `
      UPDATE themes
      SET description = :description,
          sort_order = :sortOrder,
          published = :published
      WHERE id = :id
      `,
      {
        id: existing.id,
        description: theme.description,
        sortOrder: theme.sortOrder,
        published: theme.published
      }
    );

    return existing.id;
  }

  const result = await execute(
    `
    INSERT INTO themes (title, description, sort_order, published)
    VALUES (:title, :description, :sortOrder, :published)
    `,
    theme
  );

  return result.insertId;
}

async function upsertModule(themeId, module) {
  const existing = await findModule(themeId, module.title);
  const payload = {
    themeId,
    title: module.title,
    summary: module.summary,
    body: module.body,
    imageUrl: "",
    imageAltText: "",
    videoUrl: "",
    challengeText: module.challengeText,
    sortOrder: module.sortOrder,
    published: module.published
  };

  if (existing) {
    await execute(
      `
      UPDATE modules
      SET summary = :summary,
          body = :body,
          image_url = :imageUrl,
          image_alt_text = :imageAltText,
          video_url = :videoUrl,
          challenge_text = :challengeText,
          sort_order = :sortOrder,
          published = :published
      WHERE id = :id
      `,
      { id: existing.id, ...payload }
    );

    return existing.id;
  }

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
    payload
  );

  return result.insertId;
}

async function run() {
  for (const theme of programContent) {
    const themeId = await upsertTheme(theme);

    for (const module of theme.modules) {
      await upsertModule(themeId, module);
    }

    logger.info(`Seeded CMS theme: ${theme.title}`);
  }

  await pool.end();
}

run().catch(async (error) => {
  logger.error("BVM content seed failed", { message: error.message });
  await pool.end();
  process.exit(1);
});
