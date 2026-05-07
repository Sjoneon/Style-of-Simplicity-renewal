package com.prosos.sosos.repository;

import com.prosos.sosos.model.Seller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SellerRepository extends JpaRepository<Seller, Long> {
    // 사업자번호 기준 판매자 조회
    Seller findByBusinessNumber(String businessNumber);
}
