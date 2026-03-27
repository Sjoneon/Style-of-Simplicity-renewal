package com.prosos.sosos.repository;

import com.prosos.sosos.model.RecentProductView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecentProductViewRepository extends JpaRepository<RecentProductView, Long> {

    // 사용자별 최근 본 상품 20건을 최근 시각 기준으로 조회한다.
    List<RecentProductView> findTop20ByUserIdOrderByViewedAtDesc(Long userId);

    // 동일 사용자-상품 레코드 재사용(업서트 유사 동작)을 위한 조회.
    Optional<RecentProductView> findByUserIdAndProductId(Long userId, Long productId);
}
