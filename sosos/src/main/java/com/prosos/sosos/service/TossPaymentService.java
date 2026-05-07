package com.prosos.sosos.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prosos.sosos.dto.TossPaymentConfirmRequest;
import com.prosos.sosos.dto.TossPaymentConfirmResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;

@Service
public class TossPaymentService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.payment.toss.enabled:false}")
    private boolean tossEnabled;

    @Value("${app.payment.toss.secret-key:}")
    private String tossSecretKey;

    @Value("${app.payment.toss.confirm-url:https://api.tosspayments.com/v1/payments/confirm}")
    private String tossConfirmUrl;

    public TossPaymentService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .build();
    }

    // 토스 승인 API 호출은 서버에서만 수행해 secret key 노출을 방지한다.
    public TossPaymentConfirmResult confirmPayment(TossPaymentConfirmRequest request) {
        if (!tossEnabled) {
            throw new IllegalStateException("토스 결제가 비활성화되어 있습니다. TOSS_ENABLED=true 설정이 필요합니다.");
        }

        String paymentKey = String.valueOf(request.getPaymentKey() == null ? "" : request.getPaymentKey()).trim();
        String orderId = String.valueOf(request.getOrderId() == null ? "" : request.getOrderId()).trim();
        Long amount = request.getAmount();

        if (paymentKey.isBlank() || orderId.isBlank() || amount == null || amount <= 0) {
            throw new IllegalArgumentException("결제 승인 요청 값이 올바르지 않습니다.");
        }

        String safeSecretKey = String.valueOf(tossSecretKey == null ? "" : tossSecretKey).trim();
        if (safeSecretKey.isBlank()) {
            throw new IllegalStateException("TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.");
        }

        Map<String, Object> payload = Map.of(
                "paymentKey", paymentKey,
                "orderId", orderId,
                "amount", amount
        );

        String requestBody;
        try {
            requestBody = objectMapper.writeValueAsString(payload);
        } catch (IOException e) {
            throw new IllegalStateException("결제 승인 요청 직렬화에 실패했습니다.", e);
        }

        String authToken = Base64.getEncoder()
                .encodeToString((safeSecretKey + ":").getBytes(StandardCharsets.UTF_8));

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(tossConfirmUrl))
                .timeout(Duration.ofSeconds(12))
                .header("Authorization", "Basic " + authToken)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IllegalStateException("토스 결제 승인 API 호출에 실패했습니다.", e);
        }

        Map<String, Object> body = parseJsonBody(response.body());
        int statusCode = response.statusCode();
        if (statusCode < 200 || statusCode >= 300) {
            String message = String.valueOf(body.getOrDefault("message", "토스 결제 승인이 거절되었습니다."));
            throw new IllegalArgumentException(message);
        }

        String approvedPaymentKey = String.valueOf(body.getOrDefault("paymentKey", paymentKey));
        String approvedOrderId = String.valueOf(body.getOrDefault("orderId", orderId));
        String status = String.valueOf(body.getOrDefault("status", ""));
        String method = String.valueOf(body.getOrDefault("method", ""));
        Long totalAmount = toLongValue(body.get("totalAmount"), amount);
        String approvedAt = String.valueOf(body.getOrDefault("approvedAt", ""));

        return new TossPaymentConfirmResult(
                approvedPaymentKey,
                approvedOrderId,
                status,
                method,
                totalAmount,
                approvedAt
        );
    }

    private Map<String, Object> parseJsonBody(String rawBody) {
        try {
            return objectMapper.readValue(rawBody, new TypeReference<>() {
            });
        } catch (IOException e) {
            throw new IllegalStateException("결제 승인 응답 파싱에 실패했습니다.", e);
        }
    }

    private Long toLongValue(Object rawValue, Long fallback) {
        if (rawValue instanceof Number number) {
            return number.longValue();
        }
        if (rawValue == null) {
            return fallback;
        }
        try {
            return Long.parseLong(String.valueOf(rawValue));
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
