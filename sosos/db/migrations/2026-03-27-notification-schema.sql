-- SOS 리뉴얼 알림 스키마 추가
-- 실행 대상: 2026-03-19 스키마 업그레이드 이후 환경

CREATE DATABASE IF NOT EXISTS SOS_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE SOS_db;

CREATE TABLE IF NOT EXISTS notifications (
  notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  product_id BIGINT NULL,
  order_id BIGINT NULL,
  inquiry_id BIGINT NULL,
  is_read BIT(1) NOT NULL DEFAULT b'0',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_created (user_id, created_at),
  INDEX idx_notifications_user_read (user_id, is_read),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

SELECT 'notification schema upgrade done' AS status;
