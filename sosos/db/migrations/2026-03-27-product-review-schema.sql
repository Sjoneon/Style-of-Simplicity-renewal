USE SOS_db;

CREATE TABLE IF NOT EXISTS product_reviews (
  review_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  rating INT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uk_product_review_user_order UNIQUE (user_id, order_id),
  INDEX idx_product_review_user_created (user_id, created_at),
  INDEX idx_product_review_product_created (product_id, created_at),
  CONSTRAINT fk_product_review_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_product_review_product FOREIGN KEY (product_id) REFERENCES products(product_id),
  CONSTRAINT fk_product_review_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

SELECT 'product review schema upgrade done' AS status;
