package com.prosos.sosos.repository;

import com.prosos.sosos.model.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    // 마이페이지 표시는 최신순이 중요해 createdAt 내림차순 조회 메서드를 사용한다.
    List<ProductReview> findByUser_IdOrderByCreatedAtDesc(Long userId);

    // 중복 리뷰(주문당 1건) 방지를 위한 존재 여부 체크 쿼리.
    boolean existsByUser_IdAndOrder_Id(Long userId, Long orderId);
}
