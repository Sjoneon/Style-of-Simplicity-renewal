package com.prosos.sosos.repository;

import com.prosos.sosos.model.DiscoveryTab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscoveryTabRepository extends JpaRepository<DiscoveryTab, Long> {
    // 활성 탭 노출 순서 조회
    List<DiscoveryTab> findByActiveTrueOrderByDisplayOrderAscIdAsc();

    // 전체 탭 노출 순서 조회
    List<DiscoveryTab> findAllByOrderByDisplayOrderAscIdAsc();

    // 탭 키 중복 확인
    boolean existsByTabKey(String tabKey);
}
