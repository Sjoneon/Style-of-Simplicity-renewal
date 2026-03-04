package com.prosos.sosos.repository;

import com.prosos.sosos.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    List<Cart> findByUserId(Long userId);

    Cart findByUserIdAndProductId(Long userId, Long productId);

    Cart findByUserIdAndProductIdAndProductOption_Id(Long userId, Long productId, Long optionId);

    Cart findByUserIdAndProductIdAndProductOptionIsNull(Long userId, Long productId);

    Optional<Cart> findByIdAndUserId(Long cartItemId, Long userId);
}
