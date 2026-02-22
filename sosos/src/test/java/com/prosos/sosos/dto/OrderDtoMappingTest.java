package com.prosos.sosos.dto;

import com.prosos.sosos.model.Order;
import com.prosos.sosos.model.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OrderDtoMappingTest {

    @Test
    void constructor_usesOrderQuantityNotCurrentStockQuantity() {
        Product product = new Product();
        product.setName("test-product");
        product.setQuantity(99);

        Order order = new Order();
        order.setProduct(product);
        order.setQuantity(3);
        order.setStatus("ORDERED");
        order.setOrderDate(LocalDateTime.now());
        order.setTotalAmount(BigDecimal.valueOf(3000));

        OrderDto dto = new OrderDto(order);

        assertEquals(3, dto.getQuantity());
    }
}
