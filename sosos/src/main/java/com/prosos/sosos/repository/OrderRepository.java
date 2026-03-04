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
    List<Order> findByBuyerId(Long buyerId);
    // 주문 상태에 따른 주문 목록 조회
    List<Order> findByStatus(String status);

    List<Order> findByProduct_Seller(Seller seller);

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
}
