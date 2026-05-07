package com.prosos.sosos.repository;

import com.prosos.sosos.model.MainBanner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MainBannerRepository extends JpaRepository<MainBanner, Long> {

    // 활성 배너 노출 순서 조회
    List<MainBanner> findByActiveTrueOrderByDisplayOrderAscIdDesc();

    // 판매자별 배너 노출 순서 조회
    List<MainBanner> findBySeller_IdOrderByDisplayOrderAscIdDesc(Long sellerId);

    void deleteByTargetProductId(Long targetProductId);
}
