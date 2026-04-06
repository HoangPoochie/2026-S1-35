
ALTER TABLE modules
  ADD COLUMN image_url VARCHAR(500) NULL AFTER body,
  ADD COLUMN image_alt_text VARCHAR(255) NULL AFTER image_url;
  