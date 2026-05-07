package com.prosos.sosos.repository;

import com.prosos.sosos.model.Order;
import com.prosos.sosos.model.Seller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // 구매자 기준 주문 목록 조회
    List<Order> findByBuyerId(Long buyerId);

    // 주문 상태 기준 주문 목록 조회
    List<Order> findByStatus(String status);

    // 판매자 기준 주문 목록 조회
    List<Order> findByProduct_Seller(Seller seller);

    // 상품별 판매 수량 집계
    @Query("""
            select o.product.id, coalesce(sum(o.quantity), 0)
            from Order o
            where o.product.id in :productIds
              and (o.status is null or o.status not in :excludedStatuses)
            group by o.product.id
            """)
    List<Object[]> sumSoldQuantityByProductIds(
            @Param("productIds") Collection<Long> productIds,
            @Param("excludedStatuses") Collection<String> excludedStatuses
    );

    void deleteByProduct_Id(Long productId);
}
