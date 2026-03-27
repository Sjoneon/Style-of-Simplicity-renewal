package com.prosos.sosos.controller.api.v1;

import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.NotificationDto;
import com.prosos.sosos.model.User;
import com.prosos.sosos.service.NotificationService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationApiController {

    private final NotificationService notificationService;

    public NotificationApiController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getMyNotifications(HttpSession session) {
        try {
            // 조회 범위는 세션 사용자 기준으로 고정.
            User user = requireLoggedInUser(session);
            List<NotificationDto> notifications = notificationService.getMyNotifications(user.getId());
            return ResponseEntity.ok(ApiResponse.success(notifications, "알림 목록 조회 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getMyNotificationSummary(HttpSession session) {
        try {
            User user = requireLoggedInUser(session);
            Map<String, Long> summary = notificationService.getMyNotificationSummary(user.getId());
            return ResponseEntity.ok(ApiResponse.success(summary, "알림 요약 조회 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long notificationId,
            HttpSession session
    ) {
        try {
            User user = requireLoggedInUser(session);
            // 읽음 처리는 본인 소유 알림에만 허용.
            boolean changed = notificationService.markAsRead(user.getId(), notificationId);
            if (!changed) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("알림을 찾을 수 없습니다."));
            }
            return ResponseEntity.ok(ApiResponse.success(null, "읽음 처리되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllAsRead(HttpSession session) {
        try {
            User user = requireLoggedInUser(session);
            int changedCount = notificationService.markAllAsRead(user.getId());
            return ResponseEntity.ok(ApiResponse.success(Map.of("changedCount", changedCount), "전체 읽음 처리되었습니다."));
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
        // 비로그인 접근은 인증 오류로 명확히 처리.
        throw new IllegalStateException("로그인이 필요합니다.");
    }
}
