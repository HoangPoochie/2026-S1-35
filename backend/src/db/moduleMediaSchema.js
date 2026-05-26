import { query } from "./index.js";

let ensurePromise = null;

async function createModuleMediaTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS module_media (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      module_id BIGINT UNSIGNED NOT NULL,
      media_type ENUM('image', 'video') NOT NULL,
      url VARCHAR(500) NOT NULL,
      alt_text VARCHAR(255) NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_module_media_module (module_id),
      INDEX idx_module_media_url (url),
      CONSTRAINT fk_module_media_module
        FOREIGN KEY (module_id) REFERENCES modules(id)
        ON DELETE CASCADE
    )
  `);
}

async function backfillLegacyModuleMedia() {
  await query(`
    INSERT INTO module_media (module_id, media_type, url, alt_text, sort_order)
    SELECT m.id, 'image', m.image_url, m.image_alt_text, 0
    FROM modules m
    WHERE m.image_url IS NOT NULL
      AND m.image_url <> ''
      AND NOT EXISTS (
        SELECT 1
        FROM module_media mm
        WHERE mm.module_id = m.id
          AND mm.media_type = 'image'
          AND mm.url = m.image_url
      )
  `);

  await query(`
    INSERT INTO module_media (module_id, media_type, url, alt_text, sort_order)
    SELECT m.id, 'video', m.video_url, '', 1
    FROM modules m
    WHERE m.video_url IS NOT NULL
      AND m.video_url <> ''
      AND NOT EXISTS (
        SELECT 1
        FROM module_media mm
        WHERE mm.module_id = m.id
          AND mm.media_type = 'video'
          AND mm.url = m.video_url
      )
  `);
}

export async function ensureModuleMediaSchema() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await createModuleMediaTable();
      await backfillLegacyModuleMedia();
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  return ensurePromise;
}
