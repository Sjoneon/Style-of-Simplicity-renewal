package com.prosos.sosos.service;

import com.prosos.sosos.model.Order;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.model.User;
import com.prosos.sosos.repository.InquiryRepository;
import com.prosos.sosos.repository.KeywordRepository;
import com.prosos.sosos.repository.OrderRepository;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.SellerRepository;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SellerServicePurchaseTest {

    @Mock
    private SellerRepository sellerRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private InquiryRepository inquiryRepository;

    @Mock
    private KeywordRepository keywordRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private SellerService sellerService;

    @Test
    void processPurchase_savesOrderWithQuantityOne() {
        User user = new User();
        user.setId(1L);

        Product product = new Product();
        product.setId(200L);
        product.setPrice(15000.0);
        product.setQuantity(3);

        HttpSession session = new MockHttpSession();
        session.setAttribute("loggedInUser", user);

        when(productRepository.findByIdForUpdate(200L)).thenReturn(Optional.of(product));

        sellerService.processPurchase(200L, session);

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());

        Order savedOrder = orderCaptor.getValue();
        assertEquals(1, savedOrder.getQuantity());
        assertEquals("ORDERED", savedOrder.getStatus());
        assertEquals(BigDecimal.valueOf(15000.0), savedOrder.getTotalAmount());
        assertEquals(2, product.getQuantity());
    }

    @Test
    void processPurchase_throwsWhenNotLoggedIn() {
        HttpSession session = new MockHttpSession();

        assertThrows(IllegalStateException.class, () -> sellerService.processPurchase(201L, session));

        verify(productRepository, never()).findByIdForUpdate(any());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void processPurchase_throwsWhenStockIsInsufficient() {
        User user = new User();
        user.setId(2L);

        Product product = new Product();
        product.setId(202L);
        product.setPrice(1000.0);
        product.setQuantity(0);

        HttpSession session = new MockHttpSession();
        session.setAttribute("loggedInUser", user);

        when(productRepository.findByIdForUpdate(202L)).thenReturn(Optional.of(product));

        assertThrows(IllegalArgumentException.class, () -> sellerService.processPurchase(202L, session));

        verify(orderRepository, never()).save(any(Order.class));
    }
}
