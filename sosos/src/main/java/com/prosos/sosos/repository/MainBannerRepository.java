package com.prosos.sosos.repository;

import com.prosos.sosos.model.MainBanner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MainBannerRepository extends JpaRepository<MainBanner, Long> {

    List<MainBanner> findByActiveTrueOrderByDisplayOrderAscIdDesc();

    List<MainBanner> findBySeller_IdOrderByDisplayOrderAscIdDesc(Long sellerId);
}
