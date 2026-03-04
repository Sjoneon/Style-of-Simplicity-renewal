package com.prosos.sosos.service;

import com.prosos.sosos.model.Cart;
import com.prosos.sosos.model.Order;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.model.User;
import com.prosos.sosos.repository.CartRepository;
import com.prosos.sosos.repository.OrderRepository;
import com.prosos.sosos.repository.ProductOptionRepository;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServicePurchaseCartTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductOptionRepository productOptionRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void purchaseCart_savesOrderWithCartQuantityAndDecreasesStock() {
        User user = new User();
        user.setId(10L);

        Product product = new Product();
        product.setId(100L);
        product.setPrice(12000.0);
        product.setQuantity(5);

        Cart cart = new Cart();
        cart.setUser(user);
        cart.setProduct(product);
        cart.setQuantity(2);

        List<Cart> carts = List.of(cart);

        when(cartRepository.findByUserId(10L)).thenReturn(carts);
        when(productRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(product));

        userService.purchaseCart(user);

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());
        verify(cartRepository).deleteAll(carts);

        Order savedOrder = orderCaptor.getValue();
        assertEquals(2, savedOrder.getQuantity());
        assertEquals("ORDERED", savedOrder.getStatus());
        assertEquals(BigDecimal.valueOf(24000.0), savedOrder.getTotalAmount());
        assertEquals(3, product.getQuantity());
    }

    @Test
    void purchaseCart_throwsWhenStockIsInsufficient() {
        User user = new User();
        user.setId(11L);

        Product product = new Product();
        product.setId(101L);
        product.setPrice(1000.0);
        product.setQuantity(1);

        Cart cart = new Cart();
        cart.setUser(user);
        cart.setProduct(product);
        cart.setQuantity(2);

        when(cartRepository.findByUserId(11L)).thenReturn(List.of(cart));
        when(productRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(product));

        assertThrows(IllegalArgumentException.class, () -> userService.purchaseCart(user));

        verify(orderRepository, never()).save(any(Order.class));
        verify(cartRepository, never()).deleteAll(any());
    }

    @Test
    void updateCartItemQuantity_updatesWhenStockIsEnough() {
        User user = new User();
        user.setId(20L);

        Product product = new Product();
        product.setId(200L);
        product.setQuantity(5);

        Cart cart = new Cart();
        cart.setId(300L);
        cart.setUser(user);
        cart.setProduct(product);
        cart.setQuantity(1);

        when(cartRepository.findByIdAndUserId(300L, 20L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(200L)).thenReturn(Optional.of(product));

        userService.updateCartItemQuantity(user, 300L, 4);

        assertEquals(4, cart.getQuantity());
        verify(cartRepository).save(cart);
    }

    @Test
    void updateCartItemQuantity_throwsWhenOptionStockIsInsufficient() {
        User user = new User();
        user.setId(21L);

        Product product = new Product();
        product.setId(201L);

        com.prosos.sosos.model.ProductOption option = new com.prosos.sosos.model.ProductOption();
        option.setId(901L);
        option.setProduct(product);
        option.setQuantity(2);

        Cart cart = new Cart();
        cart.setId(301L);
        cart.setUser(user);
        cart.setProduct(product);
        cart.setProductOption(option);
        cart.setQuantity(1);

        when(cartRepository.findByIdAndUserId(301L, 21L)).thenReturn(Optional.of(cart));
        when(productOptionRepository.findById(901L)).thenReturn(Optional.of(option));

        assertThrows(IllegalArgumentException.class, () -> userService.updateCartItemQuantity(user, 301L, 3));
        verify(cartRepository, never()).save(any(Cart.class));
    }
}
