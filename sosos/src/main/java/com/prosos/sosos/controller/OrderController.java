package com.prosos.sosos.controller;

import com.prosos.sosos.dto.OrderDto;
import com.prosos.sosos.model.Order;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.model.User;
import com.prosos.sosos.service.SellerService;
import com.prosos.sosos.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/api/orders")
// 레거시(Thymeleaf) 주문 처리 엔드포인트를 제공한다.
public class OrderController {

    private final SellerService sellerService;
    private final UserService userService;

    public OrderController(SellerService sellerService, UserService userService) {
        this.sellerService = sellerService;
        this.userService = userService;
    }

    @PutMapping("/{orderId}/process")
    public ResponseEntity<?> processOrder(@PathVariable Long orderId, HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            sellerService.processOrderForSeller(orderId, seller.getId());
            return ResponseEntity.ok(Map.of("message", "주문이 성공적으로 처리되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long orderId, HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            sellerService.cancelOrderForSeller(orderId, seller.getId());
            return ResponseEntity.ok(Map.of("message", "주문이 성공적으로 취소되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/return")
    public ResponseEntity<?> processReturn(@PathVariable Long orderId, HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            sellerService.processReturnForSeller(orderId, seller.getId());
            return ResponseEntity.ok(Map.of("message", "반품이 성공적으로 처리되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/exchange")
    public ResponseEntity<?> processExchange(@PathVariable Long orderId, HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            sellerService.processExchangeForSeller(orderId, seller.getId());
            return ResponseEntity.ok(Map.of("message", "교환이 성공적으로 처리되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/purchase")
    public ResponseEntity<?> purchaseProduct(@RequestParam Long productId, HttpSession session) {
        try {
            sellerService.processPurchase(productId, session);
            return ResponseEntity.ok(Map.of("message", "구매가 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/seller")
    public ResponseEntity<?> getOrdersForSeller(HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            List<Order> orders = sellerService.getOrdersBySeller(seller.getId());
            List<OrderDto> orderDtos = orders.stream().map(OrderDto::new).toList();
            return ResponseEntity.ok(orderDtos);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public String getUserOrders(HttpSession session, Model model) {
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/users/login";
        }

        List<OrderDto> orders = userService.getOrdersByUserId(loggedInUser.getId());
        model.addAttribute("orders", orders);

        return "user-order";
    }

    private Seller requireLoggedInSeller(HttpSession session) {
        // 판매자 전용 기능은 세션 사용자 타입을 강제해 우회 접근을 막는다.
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof Seller seller) {
            return seller;
        }
        throw new IllegalStateException("판매자 로그인이 필요합니다.");
    }
}
