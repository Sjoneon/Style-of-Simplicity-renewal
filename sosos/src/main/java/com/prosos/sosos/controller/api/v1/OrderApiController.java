package com.prosos.sosos.controller.api.v1;

import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.OrderDto;
import com.prosos.sosos.model.Order;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.model.User;
import com.prosos.sosos.service.SellerService;
import com.prosos.sosos.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
// 주문 상태 변경/구매/주문조회 API를 제공한다.
public class OrderApiController {

    private final SellerService sellerService;
    private final UserService userService;

    public OrderApiController(SellerService sellerService, UserService userService) {
        this.sellerService = sellerService;
        this.userService = userService;
    }

    @PutMapping("/{orderId}/process")
    public ResponseEntity<ApiResponse<Void>> processOrder(@PathVariable Long orderId, HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            sellerService.processOrderForSeller(orderId, seller.getId());
            return ResponseEntity.ok(ApiResponse.success(null, "주문 처리 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure(e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(@PathVariable Long orderId, HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            sellerService.cancelOrderForSeller(orderId, seller.getId());
            return ResponseEntity.ok(ApiResponse.success(null, "주문 취소 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure(e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/return")
    public ResponseEntity<ApiResponse<Void>> processReturn(@PathVariable Long orderId, HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            sellerService.processReturnForSeller(orderId, seller.getId());
            return ResponseEntity.ok(ApiResponse.success(null, "반품 처리 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure(e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/exchange")
    public ResponseEntity<ApiResponse<Void>> processExchange(@PathVariable Long orderId, HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            sellerService.processExchangeForSeller(orderId, seller.getId());
            return ResponseEntity.ok(ApiResponse.success(null, "교환 처리 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure(e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PostMapping("/purchase")
    public ResponseEntity<ApiResponse<Void>> purchaseProduct(
            @RequestParam Long productId,
            @RequestParam(value = "optionId", required = false) Long optionId,
            HttpSession session
    ) {
        try {
            sellerService.processPurchase(productId, optionId, session);
            return ResponseEntity.ok(ApiResponse.success(null, "구매 처리 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PostMapping("/cart/purchase")
    public ResponseEntity<ApiResponse<Void>> purchaseCart(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (!(loggedInUser instanceof User user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure("사용자 로그인이 필요합니다."));
        }

        try {
            // 장바구니 전체 결제는 서비스 내부 트랜잭션에서 재고/옵션을 함께 검증한다.
            userService.purchaseCart(user);
            return ResponseEntity.ok(ApiResponse.success(null, "장바구니 주문 성공"));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @GetMapping("/seller")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getOrdersForSeller(HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            List<Order> orders = sellerService.getOrdersBySeller(seller.getId());
            List<OrderDto> orderDtos = orders.stream().map(OrderDto::new).toList();
            return ResponseEntity.ok(ApiResponse.success(orderDtos, "판매자 주문 조회 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getMyOrders(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (!(loggedInUser instanceof User user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure("사용자 로그인이 필요합니다."));
        }
        List<OrderDto> orders = userService.getOrdersByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(orders, "내 주문 조회 성공"));
    }

    private Seller requireLoggedInSeller(HttpSession session) {
        // 판매자 전용 주문 처리 엔드포인트 공통 권한 검증.
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof Seller seller) {
            return seller;
        }
        throw new IllegalStateException("판매자 로그인이 필요합니다.");
    }
}
