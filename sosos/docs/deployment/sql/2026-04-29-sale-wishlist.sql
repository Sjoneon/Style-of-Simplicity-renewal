-- 2026-04-29
-- 목적:
-- 1) 세일 기능용 products.original_price 컬럼 보강
-- 2) 찜 기능용 wishlist_items 테이블/인덱스/제약 조건 보강
--
-- 사용 대상: MySQL 8.x
-- 실행 권장 순서: 스테이징 -> 운영

START TRANSACTION;

-- ---------------------------------------------------------------------------
-- 1) products.original_price 컬럼 추가 (없을 때만)
-- ---------------------------------------------------------------------------
SET @schema_name := DATABASE();

SET @sql_add_original_price := (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @schema_name
        AND table_name = 'products'
        AND column_name = 'original_price'
    ),
    'SELECT ''SKIP: products.original_price already exists'' AS msg',
    'ALTER TABLE products ADD COLUMN original_price DOUBLE NULL AFTER price'
  )
);
PREPARE stmt_add_original_price FROM @sql_add_original_price;
EXECUTE stmt_add_original_price;
DEALLOCATE PREPARE stmt_add_original_price;

-- ---------------------------------------------------------------------------
-- 2) wishlist_items 테이블 생성
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist_items (
  wishlist_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (wishlist_id),
  CONSTRAINT uk_wishlist_user_product UNIQUE (user_id, product_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 3) wishlist_items 인덱스 보강 (없을 때만)
-- ---------------------------------------------------------------------------
SET @sql_add_idx_user_created := (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = @schema_name
        AND table_name = 'wishlist_items'
        AND index_name = 'idx_wishlist_user_created'
    ),
    'SELECT ''SKIP: idx_wishlist_user_created already exists'' AS msg',
    'CREATE INDEX idx_wishlist_user_created ON wishlist_items (user_id, created_at)'
  )
);
PREPARE stmt_add_idx_user_created FROM @sql_add_idx_user_created;
EXECUTE stmt_add_idx_user_created;
DEALLOCATE PREPARE stmt_add_idx_user_created;

SET @sql_add_idx_product := (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = @schema_name
        AND table_name = 'wishlist_items'
        AND index_name = 'idx_wishlist_product'
    ),
    'SELECT ''SKIP: idx_wishlist_product already exists'' AS msg',
    'CREATE INDEX idx_wishlist_product ON wishlist_items (product_id)'
  )
);
PREPARE stmt_add_idx_product FROM @sql_add_idx_product;
EXECUTE stmt_add_idx_product;
DEALLOCATE PREPARE stmt_add_idx_product;

COMMIT;

-- ---------------------------------------------------------------------------
-- 검증 쿼리
-- ---------------------------------------------------------------------------
-- 1) products 컬럼 확인
-- SHOW COLUMNS FROM products LIKE 'original_price';
--
-- 2) wishlist_items 생성/인덱스 확인
-- SHOW CREATE TABLE wishlist_items;
-- SHOW INDEX FROM wishlist_items;
