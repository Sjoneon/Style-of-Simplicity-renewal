package com.prosos.sosos.repository;

import com.prosos.sosos.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    // 사용자 찜 목록 최신순 조회
    List<WishlistItem> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 상품 기준 찜 목록 조회
    List<WishlistItem> findByProductId(Long productId);

    // 사용자-상품 찜 존재 확인
    boolean existsByUserIdAndProductId(Long userId, Long productId);

    // 사용자-상품 찜 단건 조회
    Optional<WishlistItem> findByUserIdAndProductId(Long userId, Long productId);

    void deleteByProductId(Long productId);
}
