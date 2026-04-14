
SET @image_url_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'modules'
    AND COLUMN_NAME = 'image_url'
);

SET @image_url_sql := IF(
  @image_url_exists = 0,
  'ALTER TABLE modules ADD COLUMN image_url VARCHAR(500) NULL AFTER body',
  'SELECT 1'
);

PREPARE add_image_url_stmt FROM @image_url_sql;
EXECUTE add_image_url_stmt;
DEALLOCATE PREPARE add_image_url_stmt;

SET @image_alt_text_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'modules'
    AND COLUMN_NAME = 'image_alt_text'
);

SET @image_alt_text_sql := IF(
  @image_alt_text_exists = 0,
  'ALTER TABLE modules ADD COLUMN image_alt_text VARCHAR(255) NULL AFTER image_url',
  'SELECT 1'
);

PREPARE add_image_alt_text_stmt FROM @image_alt_text_sql;
EXECUTE add_image_alt_text_stmt;
DEALLOCATE PREPARE add_image_alt_text_stmt;
  
