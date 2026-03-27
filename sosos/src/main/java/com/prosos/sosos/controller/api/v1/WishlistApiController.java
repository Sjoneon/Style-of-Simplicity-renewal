package com.prosos.sosos.controller.api.v1;

import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.ProductDto;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.model.User;
import com.prosos.sosos.model.WishlistItem;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.WishlistItemRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/wishlist")
public class WishlistApiController {

    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;

    public WishlistApiController(
            WishlistItemRepository wishlistItemRepository,
            ProductRepository productRepository
    ) {
        this.wishlistItemRepository = wishlistItemRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDto>>> getMyWishlist(HttpSession session) {
        try {
            User user = requireLoggedInUser(session);
            List<ProductDto> items = wishlistItemRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                    .stream()
                    .map(WishlistItem::getProduct)
                    .map(ProductDto::new)
                    .toList();
            return ResponseEntity.ok(ApiResponse.success(items, "찜 목록 조회 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @GetMapping("/{productId}/status")
    public ResponseEntity<ApiResponse<Boolean>> getWishlistStatus(
            @PathVariable Long productId,
            HttpSession session
    ) {
        try {
            User user = requireLoggedInUser(session);
            boolean liked = wishlistItemRepository.existsByUserIdAndProductId(user.getId(), productId);
            return ResponseEntity.ok(ApiResponse.success(liked, "찜 상태 조회 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<Boolean>> addWishlistItem(
            @PathVariable Long productId,
            HttpSession session
    ) {
        try {
            User user = requireLoggedInUser(session);
            Product product = findProduct(productId);

            if (!wishlistItemRepository.existsByUserIdAndProductId(user.getId(), productId)) {
                WishlistItem item = new WishlistItem();
                item.setUser(user);
                item.setProduct(product);
                item.setCreatedAt(LocalDateTime.now());
                wishlistItemRepository.save(item);
            }

            return ResponseEntity.ok(ApiResponse.success(true, "찜에 추가했습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Boolean>> removeWishlistItem(
            @PathVariable Long productId,
            HttpSession session
    ) {
        try {
            User user = requireLoggedInUser(session);
            wishlistItemRepository.findByUserIdAndProductId(user.getId(), productId)
                    .ifPresent(wishlistItemRepository::delete);
            return ResponseEntity.ok(ApiResponse.success(false, "찜에서 제거했습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    private User requireLoggedInUser(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof User user) {
            return user;
        }
        throw new IllegalStateException("사용자 로그인이 필요합니다.");
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
    }
}
