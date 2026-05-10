
CREATE TABLE IF NOT EXISTS page_views (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  submission_code VARCHAR(50) NULL,
  page_path VARCHAR(500) NOT NULL,
  page_title VARCHAR(255) NULL,
  referrer VARCHAR(500) NULL,
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_submission_code (submission_code),
  INDEX idx_viewed_at (viewed_at),
  INDEX idx_page_path (page_path),
  CONSTRAINT fk_page_views_submission
    FOREIGN KEY (submission_code)
    REFERENCES survey_submissions(submission_code)
    ON DELETE SET NULL
);
