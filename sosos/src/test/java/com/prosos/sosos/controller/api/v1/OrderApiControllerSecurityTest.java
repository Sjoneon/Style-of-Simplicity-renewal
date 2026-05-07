package com.prosos.sosos.controller.api.v1;

import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.OrderDto;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.service.SellerService;
import com.prosos.sosos.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class OrderApiControllerSecurityTest {

    private SellerService sellerService;
    private UserService userService;
    private OrderApiController controller;

    @BeforeEach
    void setUp() {
        sellerService = mock(SellerService.class);
        userService = mock(UserService.class);
        controller = new OrderApiController(sellerService, userService);
    }

    @Test
    void shouldReturnUnauthorizedWhenSellerActionCalledWithoutLogin() {
        ResponseEntity<ApiResponse<Void>> response = controller.processOrder(1L, new MockHttpSession());

        assertEquals(401, response.getStatusCode().value());
        verifyNoInteractions(sellerService);
    }

    @Test
    void shouldReturnForbiddenWhenSellerTriesToProcessOtherSellerOrder() {
        MockHttpSession session = new MockHttpSession();
        Seller seller = new Seller();
        seller.setId(7L);
        session.setAttribute("loggedInUser", seller);

        doThrow(new SecurityException("권한 없음"))
                .when(sellerService)
                .processOrderForSeller(eq(10L), eq(7L));

        ResponseEntity<ApiResponse<Void>> response = controller.processOrder(10L, session);

        assertEquals(403, response.getStatusCode().value());
    }

    @Test
    void shouldReadSellerOrdersFromSessionSellerIdOnly() {
        MockHttpSession session = new MockHttpSession();
        Seller seller = new Seller();
        seller.setId(3L);
        session.setAttribute("loggedInUser", seller);

        when(sellerService.getOrdersBySeller(3L)).thenReturn(List.of());

        ResponseEntity<ApiResponse<List<OrderDto>>> response = controller.getOrdersForSeller(session);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        verify(sellerService).getOrdersBySeller(3L);
    }
}
