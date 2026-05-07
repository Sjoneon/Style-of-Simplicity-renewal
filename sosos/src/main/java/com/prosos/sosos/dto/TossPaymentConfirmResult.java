package com.prosos.sosos.dto;

public class TossPaymentConfirmResult {

    private String paymentKey;
    private String orderId;
    private String status;
    private String method;
    private Long totalAmount;
    private String approvedAt;

    public TossPaymentConfirmResult() {
    }

    public TossPaymentConfirmResult(
            String paymentKey,
            String orderId,
            String status,
            String method,
            Long totalAmount,
            String approvedAt
    ) {
        this.paymentKey = paymentKey;
        this.orderId = orderId;
        this.status = status;
        this.method = method;
        this.totalAmount = totalAmount;
        this.approvedAt = approvedAt;
    }

    public String getPaymentKey() {
        return paymentKey;
    }

    public void setPaymentKey(String paymentKey) {
        this.paymentKey = paymentKey;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public Long getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Long totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(String approvedAt) {
        this.approvedAt = approvedAt;
    }
}
