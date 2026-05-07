-- 2026-04-29: inquiry category + inquiry image url columns (MySQL compatibility)

SET @add_category = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'inquiries'
        AND column_name = 'category'
    ),
    'SELECT ''category exists''',
    'ALTER TABLE inquiries ADD COLUMN category VARCHAR(40) NULL AFTER content'
  )
);
PREPARE stmt_add_category FROM @add_category;
EXECUTE stmt_add_category;
DEALLOCATE PREPARE stmt_add_category;

SET @add_image_url = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'inquiries'
        AND column_name = 'image_url'
    ),
    'SELECT ''image_url exists''',
    'ALTER TABLE inquiries ADD COLUMN image_url VARCHAR(1024) NULL AFTER category'
  )
);
PREPARE stmt_add_image_url FROM @add_image_url;
EXECUTE stmt_add_image_url;
DEALLOCATE PREPARE stmt_add_image_url;

-- ?? ?? ??? ??? ?? ???? ?????.
ALTER TABLE inquiries MODIFY COLUMN category VARCHAR(40) NULL;
ALTER TABLE inquiries MODIFY COLUMN image_url VARCHAR(1024) NULL;

UPDATE inquiries
SET category = 'SERVICE'
WHERE category IS NULL OR TRIM(category) = '';
