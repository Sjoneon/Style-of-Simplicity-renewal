package com.prosos.sosos.dto;

import com.prosos.sosos.model.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OrderDto {

    private Long id; // 二쇰Ц ID
    private String productName; // ?곹뭹紐?
    private BigDecimal totalAmount; // 珥?寃곗젣 湲덉븸
    private LocalDateTime orderDate; // 二쇰Ц ?좎쭨
    private String status; // 二쇰Ц ?곹깭
    private Integer quantity; // ?섎웾

    public OrderDto() {}

    // Order 媛앹껜瑜?湲곕컲?쇰줈 OrderDto ?앹꽦
    public OrderDto(Order order) {
        this.id = order.getId();
        this.productName = order.getProduct().getName();
        this.totalAmount = order.getTotalAmount();
        this.orderDate = order.getOrderDate();
        this.status = order.getStatus(); // ?곹깭媛?留ㅽ븨
        this.quantity = order.getQuantity(); // ?섎웾 留ㅽ븨

        // ?곹깭 媛??뺤씤 濡쒓렇
        System.out.println("OrderDto ?앹꽦 以??곹깭媛? " + this.status);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}

