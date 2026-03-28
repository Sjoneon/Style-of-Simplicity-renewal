package com.prosos.sosos.repository;

import com.prosos.sosos.model.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    // 사용자 기준 최신순 리뷰 목록 조회 메서드
    List<ProductReview> findByUser_IdOrderByCreatedAtDesc(Long userId);

    // 주문당 리뷰 1건 제약용 중복 존재 체크
    boolean existsByUser_IdAndOrder_Id(Long userId, Long orderId);
}
