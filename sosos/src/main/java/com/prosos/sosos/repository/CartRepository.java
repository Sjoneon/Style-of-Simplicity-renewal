package com.prosos.sosos.repository;

import com.prosos.sosos.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    // 사용자 장바구니 목록 조회
    List<Cart> findByUserId(Long userId);

    // 사용자-상품 장바구니 단건 조회
    Cart findByUserIdAndProductId(Long userId, Long productId);

    // 사용자-상품-옵션 장바구니 단건 조회
    Cart findByUserIdAndProductIdAndProductOption_Id(Long userId, Long productId, Long optionId);

    // 사용자-상품 장바구니 단건 조회 옵션 없음
    Cart findByUserIdAndProductIdAndProductOptionIsNull(Long userId, Long productId);

    // 사용자 소유 장바구니 항목 조회
    Optional<Cart> findByIdAndUserId(Long cartItemId, Long userId);

    void deleteByProduct_Id(Long productId);
}
