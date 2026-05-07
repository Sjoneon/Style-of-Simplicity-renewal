package com.prosos.sosos.repository;

import com.prosos.sosos.model.RecentProductView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecentProductViewRepository extends JpaRepository<RecentProductView, Long> {

    // 사용자 기준 최근 본 상품 20건 조회
    List<RecentProductView> findTop20ByUserIdOrderByViewedAtDesc(Long userId);

    // 사용자-상품 조합 레코드 조회
    Optional<RecentProductView> findByUserIdAndProductId(Long userId, Long productId);

    void deleteByProductId(Long productId);
}
