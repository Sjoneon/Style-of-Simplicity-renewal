package com.prosos.sosos.service;

import com.prosos.sosos.dto.ProductReviewCreateRequest;
import com.prosos.sosos.dto.ProductReviewDto;
import com.prosos.sosos.model.Order;
import com.prosos.sosos.model.ProductReview;
import com.prosos.sosos.repository.OrderRepository;
import com.prosos.sosos.repository.ProductReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductReviewService {

    // 과도한 본문 입력으로 인한 저장/렌더링 부담을 줄이기 위한 상한값.
    private static final int REVIEW_CONTENT_MAX_LENGTH = 1000;

    private final ProductReviewRepository productReviewRepository;
    private final OrderRepository orderRepository;

    public ProductReviewService(
            ProductReviewRepository productReviewRepository,
            OrderRepository orderRepository
    ) {
        this.productReviewRepository = productReviewRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductReviewDto> getMyReviews(Long userId) {
        // 목록 조회만 수행하므로 readOnly 트랜잭션으로 변경 추적 부담을 줄인다.
        return productReviewRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(ProductReviewDto::new)
                .toList();
    }

    @Transactional
    public ProductReviewDto createMyReview(Long userId, ProductReviewCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("리뷰 요청 정보가 없습니다.");
        }
        if (request.getOrderId() == null) {
            throw new IllegalArgumentException("리뷰를 작성할 주문을 선택해 주세요.");
        }
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("평점은 1점에서 5점 사이여야 합니다.");
        }

        String content = String.valueOf(request.getContent() == null ? "" : request.getContent()).trim();
        if (content.isBlank()) {
            throw new IllegalArgumentException("리뷰 내용을 입력해 주세요.");
        }
        if (content.length() > REVIEW_CONTENT_MAX_LENGTH) {
            throw new IllegalArgumentException("리뷰 내용은 1000자 이하로 입력해 주세요.");
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("주문 정보를 찾을 수 없습니다."));

        // 세션 사용자(userId)와 주문 구매자 ID를 비교해 권한을 강제한다.
        if (order.getBuyer() == null || !userId.equals(order.getBuyer().getId())) {
            throw new IllegalArgumentException("본인 주문에 대해서만 리뷰를 작성할 수 있습니다.");
        }

        String orderStatus = String.valueOf(order.getStatus() == null ? "" : order.getStatus()).trim();
        if ("CANCELLED".equalsIgnoreCase(orderStatus)) {
            throw new IllegalArgumentException("취소된 주문에는 리뷰를 작성할 수 없습니다.");
        }

        boolean alreadyReviewed = productReviewRepository.existsByUser_IdAndOrder_Id(userId, request.getOrderId());
        // 중복 작성은 DB Unique 제약 전에 서비스 단에서 먼저 차단한다.
        if (alreadyReviewed) {
            throw new IllegalArgumentException("이미 리뷰를 작성한 주문입니다.");
        }

        ProductReview review = new ProductReview();
        review.setUser(order.getBuyer());
        review.setOrder(order);
        review.setProduct(order.getProduct());
        review.setRating(request.getRating());
        review.setContent(content);

        ProductReview saved = productReviewRepository.save(review);
        return new ProductReviewDto(saved);
    }
}
