package com.prosos.sosos.controller.api.v1;

import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.TossPaymentConfirmRequest;
import com.prosos.sosos.dto.TossPaymentConfirmResult;
import com.prosos.sosos.model.User;
import com.prosos.sosos.service.TossPaymentService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentApiController {

    private final TossPaymentService tossPaymentService;

    public PaymentApiController(TossPaymentService tossPaymentService) {
        this.tossPaymentService = tossPaymentService;
    }

    @PostMapping("/toss/confirm")
    public ResponseEntity<ApiResponse<TossPaymentConfirmResult>> confirmTossPayment(
            @RequestBody TossPaymentConfirmRequest request,
            HttpSession session
    ) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (!(loggedInUser instanceof User)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure("사용자 로그인이 필요합니다."));
        }

        try {
            TossPaymentConfirmResult result = tossPaymentService.confirmPayment(request);
            return ResponseEntity.ok(ApiResponse.success(result, "토스 결제 승인 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }
}
