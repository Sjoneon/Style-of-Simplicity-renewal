package com.prosos.sosos.service;

import com.prosos.sosos.dto.OrderDto;
import com.prosos.sosos.dto.ProductDto;
import com.prosos.sosos.dto.UserLoginRequest;
import com.prosos.sosos.model.Cart;
import com.prosos.sosos.model.Order;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.model.ProductOption;
import com.prosos.sosos.model.User;
import com.prosos.sosos.repository.CartRepository;
import com.prosos.sosos.repository.OrderRepository;
import com.prosos.sosos.repository.ProductOptionRepository;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final Map<User, List<Product>> userCartData = new ConcurrentHashMap<>();

    public UserService(
            UserRepository userRepository,
            ProductRepository productRepository,
            ProductOptionRepository productOptionRepository,
            CartRepository cartRepository,
            OrderRepository orderRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.productOptionRepository = productOptionRepository;
        this.cartRepository = cartRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean login(UserLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail());
        return verifyAndUpgradePassword(user, request.getPassword());
    }

    public User findUserById(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean login(String email, String password) {
        User user = userRepository.findByEmail(email);
        return verifyAndUpgradePassword(user, password);
    }

    public void registerUser(String name, String email, String password, String phone, String address) {
        String normalizedPhone = normalizePhoneNumber(phone);
        if (!normalizedPhone.matches("010-\\d{3,4}-\\d{4}")) {
            throw new IllegalArgumentException("휴대폰 번호는 010-XXXX-XXXX 형식으로 입력해 주세요.");
        }

        if (userRepository.findByEmail(email) != null) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setPhone(normalizedPhone);
        user.setAddress(address);

        userRepository.save(user);
    }

    private String normalizePhoneNumber(String phone) {
        if (phone == null) {
            return "";
        }

        String digitsOnly = phone.replaceAll("\\D", "");
        if (digitsOnly.matches("^010\\d{8}$")) {
            return digitsOnly.replaceFirst("(010)(\\d{4})(\\d{4})", "$1-$2-$3");
        }

        if (digitsOnly.matches("^010\\d{7}$")) {
            return digitsOnly.replaceFirst("(010)(\\d{3})(\\d{4})", "$1-$2-$3");
        }

        return phone.trim();
    }

    private boolean verifyAndUpgradePassword(User user, String rawPassword) {
        if (user == null || rawPassword == null || rawPassword.isBlank()) {
            return false;
        }

        String storedPassword = user.getPassword();
        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }

        try {
            if (passwordEncoder.matches(rawPassword, storedPassword)) {
                return true;
            }
        } catch (IllegalArgumentException ignored) {
            // Legacy plaintext password may exist in old rows.
        }

        if (storedPassword.equals(rawPassword)) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            return true;
        }

        return false;
    }

    public void addToCart(User user, Long productId, Long optionId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("수량은 1개 이상이어야 합니다.");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품 정보를 확인할 수 없습니다."));

        List<ProductOption> options = productOptionRepository.findByProductIdOrderByDisplayOrderAscIdAsc(productId);
        boolean hasOptions = !options.isEmpty();

        ProductOption selectedOption = null;
        int availableStock;

        if (hasOptions) {
            if (optionId == null) {
                throw new IllegalArgumentException("사이즈를 선택해 주세요.");
            }
            selectedOption = productOptionRepository.findById(optionId)
                    .orElseThrow(() -> new IllegalArgumentException("선택한 사이즈를 찾을 수 없습니다."));
            if (!selectedOption.getProduct().getId().equals(productId)) {
                throw new IllegalArgumentException("상품과 사이즈 정보가 일치하지 않습니다.");
            }
            availableStock = selectedOption.getQuantity() == null ? 0 : selectedOption.getQuantity();
        } else {
            if (optionId != null) {
                throw new IllegalArgumentException("이 상품은 사이즈 옵션이 없습니다.");
            }
            availableStock = product.getQuantity();
        }

        Cart cart;
        if (selectedOption != null) {
            cart = cartRepository.findByUserIdAndProductIdAndProductOption_Id(user.getId(), productId, selectedOption.getId());
        } else {
            cart = cartRepository.findByUserIdAndProductIdAndProductOptionIsNull(user.getId(), productId);
        }

        int nextQuantity = (cart == null || cart.getQuantity() == null ? 0 : cart.getQuantity()) + quantity;
        if (availableStock < nextQuantity) {
            throw new IllegalArgumentException("SOLD OUT 상품입니다.");
        }

        if (cart == null) {
            cart = new Cart();
            cart.setUser(user);
            cart.setProduct(product);
            cart.setProductOption(selectedOption);
        }
        cart.setQuantity(nextQuantity);
        cartRepository.save(cart);
    }

    public void removeFromCart(User user, Long productId) {
        Cart cart = cartRepository.findByUserIdAndProductIdAndProductOptionIsNull(user.getId(), productId);
        if (cart == null) {
            cart = cartRepository.findByUserIdAndProductId(user.getId(), productId);
        }
        if (cart != null) {
            cartRepository.delete(cart);
        }
    }

    public void removeCartItem(User user, Long cartItemId) {
        Cart cart = cartRepository.findByIdAndUserId(cartItemId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("장바구니 항목을 찾을 수 없습니다."));
        cartRepository.delete(cart);
    }

    @Transactional
    public void updateCartItemQuantity(User user, Long cartItemId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("수량은 1개 이상이어야 합니다.");
        }

        Cart cart = cartRepository.findByIdAndUserId(cartItemId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("장바구니 항목을 찾을 수 없습니다."));

        int availableStock;
        ProductOption cartOption = cart.getProductOption();
        if (cartOption != null) {
            ProductOption option = productOptionRepository.findById(cartOption.getId())
                    .orElseThrow(() -> new IllegalArgumentException("선택한 사이즈를 찾을 수 없습니다."));
            availableStock = option.getQuantity() == null ? 0 : option.getQuantity();
        } else {
            Product product = productRepository.findById(cart.getProduct().getId())
                    .orElseThrow(() -> new IllegalArgumentException("상품 정보를 확인할 수 없습니다."));
            availableStock = product.getQuantity();
        }

        if (quantity > availableStock) {
            throw new IllegalArgumentException("SOLD OUT 상품입니다.");
        }

        cart.setQuantity(quantity);
        cartRepository.save(cart);
    }

    public List<ProductDto> getCartItems(User user) {
        List<Cart> carts = cartRepository.findByUserId(user.getId());
        List<ProductDto> result = new ArrayList<>();

        for (Cart cart : carts) {
            ProductDto dto = new ProductDto(cart.getProduct());
            dto.setCartItemId(cart.getId());
            dto.setQuantity(cart.getQuantity() == null ? 0 : cart.getQuantity());
            if (cart.getProductOption() != null) {
                dto.setSelectedOptionId(cart.getProductOption().getId());
                dto.setSelectedSizeLabel(cart.getProductOption().getSizeLabel());
            }
            result.add(dto);
        }
        return result;
    }

    @Transactional
    public void purchaseCart(User user) {
        List<Cart> carts = new ArrayList<>(cartRepository.findByUserId(user.getId()));
        if (carts.isEmpty()) {
            throw new IllegalStateException("장바구니가 비어 있습니다.");
        }

        carts.sort(Comparator.comparing(cart -> cart.getProduct().getId()));

        for (Cart cart : carts) {
            int orderQuantity = cart.getQuantity() == null ? 0 : cart.getQuantity();
            if (orderQuantity <= 0) {
                throw new IllegalArgumentException("주문 수량이 올바르지 않습니다.");
            }

            Long productId = cart.getProduct().getId();
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. id=" + productId));

            List<ProductOption> optionList = productOptionRepository.findByProductIdOrderByDisplayOrderAscIdAsc(productId);
            boolean hasOptions = !optionList.isEmpty();

            String sizeLabel = null;
            if (cart.getProductOption() != null) {
                Long optionId = cart.getProductOption().getId();
                ProductOption option = productOptionRepository.findByIdForUpdate(optionId)
                        .orElseThrow(() -> new IllegalArgumentException("선택한 사이즈를 찾을 수 없습니다."));

                if (!option.getProduct().getId().equals(productId)) {
                    throw new IllegalArgumentException("상품과 사이즈 정보가 일치하지 않습니다.");
                }
                if (option.getQuantity() < orderQuantity) {
                    throw new IllegalArgumentException("SOLD OUT 상품이 포함되어 주문할 수 없습니다.");
                }

                option.setQuantity(option.getQuantity() - orderQuantity);
                sizeLabel = option.getSizeLabel();
            } else if (hasOptions) {
                throw new IllegalArgumentException("사이즈를 선택하지 않은 상품이 장바구니에 있습니다.");
            } else if (product.getQuantity() < orderQuantity) {
                throw new IllegalArgumentException("SOLD OUT 상품이 포함되어 주문할 수 없습니다.");
            }

            product.setQuantity(Math.max(product.getQuantity() - orderQuantity, 0));

            Order order = new Order();
            order.setBuyer(user);
            order.setProduct(product);
            order.setQuantity(orderQuantity);
            order.setSizeLabel(sizeLabel);
            order.setOrderDate(LocalDateTime.now());
            order.setStatus("ORDERED");
            order.setTotalAmount(BigDecimal.valueOf(product.getPrice())
                    .multiply(BigDecimal.valueOf(orderQuantity)));
            orderRepository.save(order);
        }

        cartRepository.deleteAll(carts);
    }

    public void checkout(User user) {
        List<Product> cart = userCartData.get(user);
        if (cart == null || cart.isEmpty()) {
            throw new IllegalStateException("장바구니가 비어 있습니다.");
        }
        userCartData.remove(user);
    }

    public void clearCart(User user) {
        List<Cart> userCarts = cartRepository.findByUserId(user.getId());
        cartRepository.deleteAll(userCarts);
    }

    public List<OrderDto> getOrdersByUserId(Long userId) {
        List<Order> orders = orderRepository.findByBuyerId(userId);
        List<OrderDto> orderDtos = new ArrayList<>();
        for (Order order : orders) {
            orderDtos.add(new OrderDto(order));
        }
        return orderDtos;
    }
}
