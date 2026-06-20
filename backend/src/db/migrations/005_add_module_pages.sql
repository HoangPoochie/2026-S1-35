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
);

INSERT INTO module_pages (
  module_id, page_type, title, body, media_url, media_alt_text, sort_order
)
SELECT m.id, 'text', m.title, m.summary, '', '', 0
FROM modules m
WHERE m.summary IS NOT NULL
  AND m.summary <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM module_pages mp
    WHERE mp.module_id = m.id
      AND mp.page_type = 'text'
      AND mp.sort_order = 0
  );

INSERT INTO module_pages (
  module_id, page_type, title, body, media_url, media_alt_text, sort_order
)
SELECT
  mm.module_id,
  mm.media_type,
  COALESCE(NULLIF(mm.alt_text, ''), m.title),
  '',
  mm.url,
  COALESCE(mm.alt_text, ''),
  10 + mm.sort_order
FROM module_media mm
INNER JOIN modules m ON m.id = mm.module_id
WHERE mm.url IS NOT NULL
  AND mm.url <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM module_pages mp
    WHERE mp.module_id = mm.module_id
      AND mp.page_type = mm.media_type
      AND mp.media_url = mm.url
  );

INSERT INTO module_pages (
  module_id, page_type, title, body, media_url, media_alt_text, sort_order
)
SELECT m.id, 'text', 'What we learned', m.body, '', '', 100
FROM modules m
WHERE m.body IS NOT NULL
  AND m.body <> ''
  AND (m.summary IS NULL OR m.body <> m.summary)
  AND NOT EXISTS (
    SELECT 1
    FROM module_pages mp
    WHERE mp.module_id = m.id
      AND mp.page_type = 'text'
      AND mp.sort_order = 100
  );

INSERT INTO module_pages (
  module_id, page_type, title, body, media_url, media_alt_text, sort_order
)
SELECT m.id, 'activity', 'Challenge', m.challenge_text, '', '', 200
FROM modules m
WHERE m.challenge_text IS NOT NULL
  AND m.challenge_text <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM module_pages mp
    WHERE mp.module_id = m.id
      AND mp.page_type = 'activity'
      AND mp.sort_order = 200
  );
