-- SOS 리뉴얼 최근 본 상품 스키마 추가
-- 실행 대상: 기존 SOS_db 환경

CREATE DATABASE IF NOT EXISTS SOS_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE SOS_db;

CREATE TABLE IF NOT EXISTS recent_product_views (
  recent_view_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recent_view_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_recent_view_product
    FOREIGN KEY (product_id) REFERENCES products(product_id),
  CONSTRAINT uk_recent_view_user_product
    UNIQUE (user_id, product_id),
  INDEX idx_recent_view_user_viewed (user_id, viewed_at)
);

SELECT 'recent product view schema upgrade done' AS status;
