import { query } from "./index.js";

let ensurePromise = null;

async function createModulePagesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS module_pages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      module_id BIGINT UNSIGNED NOT NULL,
      page_type VARCHAR(50) NOT NULL DEFAULT 'text',
      title VARCHAR(255) NULL,
      body LONGTEXT NULL,
      media_url VARCHAR(500) NULL,
      media_alt_text VARCHAR(255) NULL,
      content_json JSON NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_module_pages_module (module_id),
      INDEX idx_module_pages_media_url (media_url),
      CONSTRAINT fk_module_pages_module
        FOREIGN KEY (module_id) REFERENCES modules(id)
        ON DELETE CASCADE
    )
  `);
}

async function ensureContentJsonColumn() {
  const rows = await query(`
    SELECT COUNT(*) AS columnCount
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'module_pages'
      AND COLUMN_NAME = 'content_json'
  `);

  if (Number(rows[0]?.columnCount || 0) === 0) {
    await query(`
      ALTER TABLE module_pages
      ADD COLUMN content_json JSON NULL AFTER media_alt_text
    `);
  }
}

export async function ensureModulePageSchema() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await createModulePagesTable();
      await ensureContentJsonColumn();
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  return ensurePromise;
}
