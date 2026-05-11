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
    // 상품명 부분 일치 검색
    List<Product> findByNameContaining(String name);

    @Query("select p from Product p where lower(p.name) like lower(concat('%', :keyword, '%')) escape '\\'")
    List<Product> searchByNameEscaped(@Param("keyword") String keyword);

    // 카테고리 기준 목록 조회
    List<Product> findByCategory(String category);

    // 판매자 소유 상품 조회
    List<Product> findBySeller_Id(Long sellerId);

    // 재고 차감 전 잠금 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    // 재고 보유 상품 키워드 포함 조회
    @Query("""
            select distinct p
            from Product p
            left join fetch p.productKeywords pk
            left join fetch pk.keyword
            where p.quantity > 0
            """)
    List<Product> findAllInStockWithKeywords();
}
