package com.prosos.sosos.repository;

import com.prosos.sosos.model.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // 상품 이름으로 검색 (부분 일치)
    List<Product> findByNameContaining(String name);

    // 카테고리별로 분류 조회
    List<Product> findByCategory(String category);

    // 재고 차감 전 행 잠금으로 동시 구매 충돌 방지
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
