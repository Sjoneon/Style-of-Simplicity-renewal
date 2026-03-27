-- SOS 리뉴얼 스키마 보강 스크립트 (기존 DB 업그레이드용)
-- 실행 대상: 기존 SOS_db를 이미 사용 중인 환경
-- 주의: 실행 전 DB 백업 권장

CREATE DATABASE IF NOT EXISTS SOS_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE SOS_db;

-- 1) 기존 테이블 컬럼 보강
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS show_in_starter_tab BIT(1) NULL,
  ADD COLUMN IF NOT EXISTS show_in_gift_tab BIT(1) NULL,
  ADD COLUMN IF NOT EXISTS show_in_new_tab BIT(1) NULL,
  ADD COLUMN IF NOT EXISTS show_in_basic_tab BIT(1) NULL,
  ADD COLUMN IF NOT EXISTS show_in_work_tab BIT(1) NULL,
  ADD COLUMN IF NOT EXISTS discovery_tab_keys VARCHAR(500) NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS size_label VARCHAR(40) NULL;

ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS product_option_id BIGINT NULL;

-- 2) 누락 테이블 생성
CREATE TABLE IF NOT EXISTS discovery_tabs (
  discovery_tab_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tab_key VARCHAR(80) NOT NULL UNIQUE,
  label VARCHAR(80) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BIT(1) NOT NULL DEFAULT b'1'
);

CREATE TABLE IF NOT EXISTS product_options (
  option_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  size_label VARCHAR(40) NOT NULL,
  quantity INT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_product_options_product
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE IF NOT EXISTS main_banners (
  banner_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(120) NULL,
  subtitle TEXT NULL,
  image_url VARCHAR(255) NOT NULL,
  target_product_id BIGINT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BIT(1) NOT NULL DEFAULT b'1',
  seller_id BIGINT NOT NULL,
  created_date DATETIME NOT NULL,
  updated_date DATETIME NOT NULL,
  CONSTRAINT fk_main_banners_seller
    FOREIGN KEY (seller_id) REFERENCES sellers(seller_id)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  wishlist_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uk_wishlist_user_product (user_id, product_id),
  CONSTRAINT fk_wishlist_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_wishlist_product
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 3) 누락 FK/인덱스 보강 (이미 있으면 skip)
SET @fk_cart_option_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'cart_items'
    AND CONSTRAINT_NAME = 'fk_cart_items_product_option'
);
SET @sql_fk_cart_option := IF(
  @fk_cart_option_exists = 0,
  'ALTER TABLE cart_items ADD CONSTRAINT fk_cart_items_product_option FOREIGN KEY (product_option_id) REFERENCES product_options(option_id)',
  'SELECT 1'
);
PREPARE stmt_fk_cart_option FROM @sql_fk_cart_option;
EXECUTE stmt_fk_cart_option;
DEALLOCATE PREPARE stmt_fk_cart_option;

SET @idx_wishlist_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'wishlist_items'
    AND INDEX_NAME = 'uk_wishlist_user_product'
);
SET @sql_idx_wishlist := IF(
  @idx_wishlist_exists = 0,
  'ALTER TABLE wishlist_items ADD UNIQUE KEY uk_wishlist_user_product (user_id, product_id)',
  'SELECT 1'
);
PREPARE stmt_idx_wishlist FROM @sql_idx_wishlist;
EXECUTE stmt_idx_wishlist;
DEALLOCATE PREPARE stmt_idx_wishlist;

-- 완료 확인용
SELECT 'schema upgrade done' AS status;
