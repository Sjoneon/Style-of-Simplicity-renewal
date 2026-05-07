package com.prosos.sosos.repository;

import com.prosos.sosos.model.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    // 사용자 기준 최신순 리뷰 조회
    List<ProductReview> findByUser_IdOrderByCreatedAtDesc(Long userId);

    // 주문 기준 리뷰 중복 확인
    boolean existsByUser_IdAndOrder_Id(Long userId, Long orderId);

    void deleteByProduct_Id(Long productId);
}
