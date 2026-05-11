package com.prosos.sosos.service.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Service
public class TurnstileVerificationService {

    private final boolean enabled;
    private final String secretKey;
    private final String verifyUrl;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public TurnstileVerificationService(
            @Value("${app.security.turnstile.enabled:false}") boolean enabled,
            @Value("${app.security.turnstile.secret-key:}") String secretKey,
            @Value("${app.security.turnstile.verify-url:https://challenges.cloudflare.com/turnstile/v0/siteverify}") String verifyUrl,
            ObjectMapper objectMapper
    ) {
        this.enabled = enabled;
        this.secretKey = trimToEmpty(secretKey);
        this.verifyUrl = trimToEmpty(verifyUrl);
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
    }

    public void verifyOrThrow(String token, HttpServletRequest request) {
        if (!enabled) {
            return;
        }

        if (secretKey.isBlank() || verifyUrl.isBlank()) {
            throw new IllegalStateException("Turnstile configuration is missing.");
        }

        String safeToken = trimToEmpty(token);
        if (safeToken.isBlank()) {
            throw new IllegalArgumentException("보안 검증이 필요합니다. 인증 후 다시 시도해 주세요.");
        }

        String clientIp = resolveClientIp(request);
        String requestBody = buildRequestBody(safeToken, clientIp);

        HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(verifyUrl))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .build();

        try {
            HttpResponse<String> httpResponse = httpClient.send(
                    httpRequest,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );
            if (httpResponse.statusCode() < 200 || httpResponse.statusCode() >= 300) {
                throw new IllegalArgumentException("보안 검증에 실패했습니다. 잠시 후 다시 시도해 주세요.");
            }

            JsonNode responseBody = objectMapper.readTree(httpResponse.body());
            boolean success = responseBody.path("success").asBoolean(false);
            if (!success) {
                throw new IllegalArgumentException("보안 검증에 실패했습니다. 다시 시도해 주세요.");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Turnstile verification interrupted", e);
        } catch (IOException e) {
            throw new RuntimeException("Turnstile verification failed", e);
        }
    }

    private String buildRequestBody(String token, String clientIp) {
        StringBuilder builder = new StringBuilder();
        builder.append("secret=").append(urlEncode(secretKey));
        builder.append("&response=").append(urlEncode(token));
        if (!clientIp.isBlank()) {
            builder.append("&remoteip=").append(urlEncode(clientIp));
        }
        return builder.toString();
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "";
        }

        String forwardedFor = trimToEmpty(request.getHeader("X-Forwarded-For"));
        if (!forwardedFor.isBlank()) {
            String[] parts = forwardedFor.split(",");
            if (parts.length > 0) {
                return trimToEmpty(parts[0]);
            }
        }

        String realIp = trimToEmpty(request.getHeader("X-Real-IP"));
        if (!realIp.isBlank()) {
            return realIp;
        }

        return trimToEmpty(request.getRemoteAddr());
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
