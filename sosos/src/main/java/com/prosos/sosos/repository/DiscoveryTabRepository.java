package com.prosos.sosos.repository;

import com.prosos.sosos.model.DiscoveryTab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscoveryTabRepository extends JpaRepository<DiscoveryTab, Long> {
    List<DiscoveryTab> findByActiveTrueOrderByDisplayOrderAscIdAsc();

    List<DiscoveryTab> findAllByOrderByDisplayOrderAscIdAsc();

    boolean existsByTabKey(String tabKey);
}
