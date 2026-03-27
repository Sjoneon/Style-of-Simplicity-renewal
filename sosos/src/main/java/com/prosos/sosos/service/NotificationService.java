package com.prosos.sosos.service;

import com.prosos.sosos.dto.NotificationDto;
import com.prosos.sosos.model.Inquiry;
import com.prosos.sosos.model.Notification;
import com.prosos.sosos.model.Order;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.model.User;
import com.prosos.sosos.model.WishlistItem;
import com.prosos.sosos.repository.NotificationRepository;
import com.prosos.sosos.repository.UserRepository;
import com.prosos.sosos.repository.WishlistItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
public class NotificationService {

    public static final String TYPE_RESTOCK = "RESTOCK";
    public static final String TYPE_DISCOUNT = "DISCOUNT";
    public static final String TYPE_ORDER_STATUS = "ORDER_STATUS";
    public static final String TYPE_INQUIRY_ANSWER = "INQUIRY_ANSWER";

    private final NotificationRepository notificationRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            WishlistItemRepository wishlistItemRepository,
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.wishlistItemRepository = wishlistItemRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getMyNotifications(Long userId) {
        // 사용자 본인 알림만 최신순으로 조회.
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDto::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getMyNotificationSummary(Long userId) {
        // 알림 칩/배지 표시에 사용하는 집계값.
        Map<String, Long> summary = new LinkedHashMap<>();
        long total = notificationRepository.countByUserId(userId);
        long unread = notificationRepository.countByUserIdAndReadFalse(userId);
        summary.put("total", total);
        summary.put("unread", unread);
        summary.put(TYPE_RESTOCK, notificationRepository.countByUserIdAndType(userId, TYPE_RESTOCK));
        summary.put(TYPE_DISCOUNT, notificationRepository.countByUserIdAndType(userId, TYPE_DISCOUNT));
        summary.put(TYPE_ORDER_STATUS, notificationRepository.countByUserIdAndType(userId, TYPE_ORDER_STATUS));
        summary.put(TYPE_INQUIRY_ANSWER, notificationRepository.countByUserIdAndType(userId, TYPE_INQUIRY_ANSWER));
        return summary;
    }

    @Transactional
    public boolean markAsRead(Long userId, Long notificationId) {
        // 본인 소유 알림인지 확인해 타인 알림 읽음 처리를 방지.
        Optional<Notification> target = notificationRepository.findByIdAndUserId(notificationId, userId);
        if (target.isEmpty()) {
            return false;
        }

        Notification notification = target.get();
        if (!Boolean.TRUE.equals(notification.getRead())) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
        return true;
    }

    @Transactional
    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public void notifyOrderStatusChanged(Order order, String previousStatus) {
        if (order == null || order.getBuyer() == null || order.getId() == null) {
            return;
        }

        String before = normalizeStatus(previousStatus);
        String after = normalizeStatus(order.getStatus());
        if (Objects.equals(before, after)) {
            // 상태가 실제로 바뀌지 않았으면 중복 알림을 만들지 않음.
            return;
        }

        User user = order.getBuyer();
        String productName = order.getProduct() == null
                ? "상품"
                : safeText(order.getProduct().getName(), "상품");
        Long productId = order.getProduct() == null ? null : order.getProduct().getId();

        String title = "주문 상태 변경";
        String message = productName + " 주문 상태가 " + toOrderStatusLabel(after) + "로 변경되었습니다.";

        createNotification(user, TYPE_ORDER_STATUS, title, message, productId, order.getId(), null);
    }

    @Transactional
    public void notifyInquiryAnswered(Inquiry inquiry, boolean updated) {
        if (inquiry == null || inquiry.getId() == null || inquiry.getUserId() == null) {
            return;
        }

        String answer = safeText(inquiry.getAnswer(), "");
        if (answer.isBlank()) {
            return;
        }

        User user = userRepository.findById(inquiry.getUserId()).orElse(null);
        if (user == null) {
            return;
        }

        String title = updated ? "문의 답변 수정" : "문의 답변 등록";
        String inquiryTitle = safeText(inquiry.getTitle(), "문의");
        String message = inquiryTitle + " 문의에 답변이 " + (updated ? "수정" : "등록") + "되었습니다.";
        createNotification(user, TYPE_INQUIRY_ANSWER, title, message, inquiry.getProductId(), null, inquiry.getId());
    }

    @Transactional
    public void notifyProductUpdatedForWishlist(Product product, double previousPrice, int previousQuantity) {
        if (product == null || product.getId() == null) {
            return;
        }

        int currentQuantity = product.getQuantity();
        double currentPrice = product.getPrice();

        boolean restocked = previousQuantity <= 0 && currentQuantity > 0;
        boolean discounted = previousPrice > 0 && currentPrice > 0 && currentPrice < previousPrice;

        if (!restocked && !discounted) {
            // 재입고/할인 변화가 없으면 알림을 만들지 않음.
            return;
        }

        List<WishlistItem> wishlistItems = wishlistItemRepository.findByProductId(product.getId());
        if (wishlistItems.isEmpty()) {
            return;
        }

        String productName = safeText(product.getName(), "상품");
        for (WishlistItem wishlistItem : wishlistItems) {
            User user = wishlistItem.getUser();
            if (user == null) {
                continue;
            }

            if (restocked) {
                String restockMessage = productName + " 상품이 재입고되었습니다.";
                createNotification(
                        user,
                        TYPE_RESTOCK,
                        "재입고 알림",
                        restockMessage,
                        product.getId(),
                        null,
                        null
                );
            }

            if (discounted) {
                String discountMessage = productName + " 가격이 인하되었습니다. "
                        + formatPrice(previousPrice) + " -> " + formatPrice(currentPrice);
                createNotification(
                        user,
                        TYPE_DISCOUNT,
                        "할인 알림",
                        discountMessage,
                        product.getId(),
                        null,
                        null
                );
            }
        }
    }

    private void createNotification(
            User user,
            String type,
            String title,
            String message,
            Long productId,
            Long orderId,
            Long inquiryId
    ) {
        // 생성 규칙 일관성을 위해 알림 저장 경로를 단일화.
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setProductId(productId);
        notification.setOrderId(orderId);
        notification.setInquiryId(inquiryId);
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    private String normalizeStatus(String status) {
        return safeText(status, "").trim().toUpperCase();
    }

    private String toOrderStatusLabel(String status) {
        return switch (status) {
            case "ORDERED" -> "결제완료/배송준비";
            case "PROCESSED" -> "배송중";
            case "CANCELLED" -> "주문취소";
            case "RETURNED" -> "반품";
            case "EXCHANGED" -> "교환";
            default -> status;
        };
    }

    private String safeText(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }

    private String formatPrice(double value) {
        long rounded = Math.round(value);
        return String.format("%,d원", rounded);
    }
}
