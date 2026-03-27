package com.prosos.sosos.controller.api.v1;

import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.ProductReviewCreateRequest;
import com.prosos.sosos.dto.ProductReviewDto;
import com.prosos.sosos.model.User;
import com.prosos.sosos.service.ProductReviewService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
public class ProductReviewApiController {

    private final ProductReviewService productReviewService;

    public ProductReviewApiController(ProductReviewService productReviewService) {
        this.productReviewService = productReviewService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<ProductReviewDto>>> getMyReviews(HttpSession session) {
        // 세션 기반으로 "내 리뷰"만 조회한다.
        User user = resolveLoggedInUser(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure("로그인이 필요합니다."));
        }

        List<ProductReviewDto> reviews = productReviewService.getMyReviews(user.getId());
        return ResponseEntity.ok(ApiResponse.success(reviews, "내 리뷰 조회 성공"));
    }

    @PostMapping("/me")
    public ResponseEntity<ApiResponse<ProductReviewDto>> createMyReview(
            @RequestBody ProductReviewCreateRequest request,
            HttpSession session
    ) {
        // 리뷰 등록도 본인 계정 세션에서만 허용한다.
        User user = resolveLoggedInUser(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure("로그인이 필요합니다."));
        }

        try {
            ProductReviewDto created = productReviewService.createMyReview(user.getId(), request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "리뷰 등록 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    private User resolveLoggedInUser(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof User user) {
            return user;
        }
        return null;
    }
}
