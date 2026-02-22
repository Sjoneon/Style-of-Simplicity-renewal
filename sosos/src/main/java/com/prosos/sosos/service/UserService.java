package com.prosos.sosos.service;

import com.prosos.sosos.model.Cart;
import com.prosos.sosos.model.Order;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.model.User;
import com.prosos.sosos.dto.OrderDto;
import com.prosos.sosos.dto.ProductDto;
import com.prosos.sosos.dto.UserLoginRequest;
import com.prosos.sosos.repository.CartRepository;
import com.prosos.sosos.repository.OrderRepository;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.UserRepository;

import java.util.ArrayList;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final Map<User, List<Product>> userCartData = new ConcurrentHashMap<>();


    public UserService(UserRepository userRepository,
                       ProductRepository productRepository,
                       CartRepository cartRepository,
                       OrderRepository orderRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.cartRepository = cartRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 濡쒓렇??濡쒖쭅
    public boolean login(UserLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail());
        return verifyAndUpgradePassword(user, request.getPassword());
    }

    // ?ъ슜??ID濡??ъ슜??李얘린
    public User findUserById(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    // ?대찓?쇰줈 ?ъ슜???뺣낫 議고쉶
    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // ?대찓?쇨낵 鍮꾨?踰덊샇濡??쇰컲 ?ъ슜??濡쒓렇??
    public boolean login(String email, String password) {
        User user = userRepository.findByEmail(email);
        return verifyAndUpgradePassword(user, password);
    }

    // ?뚯썝媛??
    public void registerUser(String name, String email, String password, String phone, String address) {
        // ?대???踰덊샇 ?뺤떇 寃利?
        if (!phone.matches("010-\\d{3,4}-\\d{4}")) {
            throw new IllegalArgumentException("?대???踰덊샇??'010-XXXX-XXXX' ?뺤떇?쇰줈 ?낅젰?댁빞 ?⑸땲??");
        }

        // ?대찓??以묐났 寃利?
        if (userRepository.findByEmail(email) != null) {
            throw new IllegalArgumentException("?대? ?ъ슜 以묒씤 ?대찓?쇱엯?덈떎.");
        }

        // ?ъ슜???앹꽦 諛????
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setPhone(phone);
        user.setAddress(address);

        userRepository.save(user);
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


    // ?λ컮援щ땲???곹뭹 異붽?
    public void addToCart(User user, ProductDto productDto, int quantity) {
        // ?섎웾??1 ?댁긽?댁뼱?쇰쭔 異붽?
        if (quantity <= 0) {
            throw new IllegalArgumentException("?섎웾? 1媛??댁긽?댁뼱???⑸땲??");
        }
    
        // Cart 媛앹껜 異붽?
        Cart cart = cartRepository.findByUserIdAndProductId(user.getId(), productDto.getId());
        if (cart == null) {
            // ?λ컮援щ땲???대떦 ?곹뭹???녿떎硫??덈줈 異붽?
            cart = new Cart();
            cart.setUser(user);
            cart.setProduct(new Product(productDto));  // ProductDto瑜?Product濡?蹂??
            cart.setQuantity(quantity);  // ?ъ슜?먭? ?좏깮???섎웾??洹몃?濡??ㅼ젙
        } else {
            // ?대? ?λ컮援щ땲???대떦 ?곹뭹???덈떎硫??섎웾???덈줈 ?ㅼ젙
            cart.setQuantity(quantity);  // 湲곗〈 ?섎웾????뼱?곌퀬 ???섎웾???ㅼ젙
        }
        cartRepository.save(cart); // ?λ컮援щ땲 ???
    }
    

    // ?λ컮援щ땲?먯꽌 ?곹뭹 ?쒓굅
    public void removeFromCart(User user, Long productId) {
        Cart cart = cartRepository.findByUserIdAndProductId(user.getId(), productId); // ?λ컮援щ땲?먯꽌 ?곹뭹 李얘린
        if (cart != null) {
            cartRepository.delete(cart);  // ?λ컮援щ땲?먯꽌 ?대떦 ?곹뭹 ??젣
        }
    }
    

    // ?ъ슜?먮퀎 ?λ컮援щ땲 ?곗씠??議고쉶
    public List<ProductDto> getCartItems(User user) {
        List<Cart> foundCarts = cartRepository.findByUserId(user.getId());
        List<Cart> carts = foundCarts == null ? new ArrayList<>() : new ArrayList<>(foundCarts); // ?λ컮援щ땲 ?곗씠?곕? 李얜뒗??
        List<ProductDto> productDtos = new ArrayList<>();
        
        if (carts.isEmpty()) {
            System.out.println("?λ컮援щ땲媛 鍮꾩뼱 ?덉뒿?덈떎."); // 肄섏넄?먯꽌 濡쒓렇瑜??듯빐 ?뺤씤
        }
    
        for (Cart cart : carts) {
            ProductDto productDto = new ProductDto(cart.getProduct()); // Cart?먯꽌 ProductDto濡?蹂??
            productDto.setQuantity(cart.getQuantity());  // ?λ컮援щ땲?먯꽌 媛?몄삩 ?섎웾??ProductDto???ㅼ젙
            productDtos.add(productDto);
        }
        return productDtos;
    }
    

    // 援щℓ 泥섎━
    @Transactional
    public void purchaseCart(User user) {
        List<Cart> foundCarts = cartRepository.findByUserId(user.getId());
        List<Cart> carts = foundCarts == null ? new ArrayList<>() : new ArrayList<>(foundCarts);
        if (carts == null || carts.isEmpty()) {
            throw new IllegalStateException("?λ컮援щ땲媛 鍮꾩뼱 ?덉뒿?덈떎.");
        }

        // Deadlock risk is lower when rows are locked in a fixed order.
        carts.sort(Comparator.comparing(cart -> cart.getProduct().getId()));

        for (Cart cart : carts) {
            int orderQuantity = cart.getQuantity() == null ? 0 : cart.getQuantity();
            if (orderQuantity <= 0) {
                throw new IllegalArgumentException("二쇰Ц ?섎웾???щ컮瑜댁? ?딆뒿?덈떎.");
            }

            Long productId = cart.getProduct().getId();
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new IllegalArgumentException("?곹뭹??李얠쓣 ???놁뒿?덈떎. id=" + productId));

            if (product.getQuantity() < orderQuantity) {
                throw new IllegalArgumentException(
                        "?ш퀬媛 遺議깊빀?덈떎. ?곹뭹ID=" + productId + ", ?붿껌=" + orderQuantity + ", ?ш퀬=" + product.getQuantity());
            }

            product.setQuantity(product.getQuantity() - orderQuantity);

            Order order = new Order();
            order.setBuyer(user);
            order.setProduct(product);
            order.setQuantity(orderQuantity);
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
            throw new IllegalStateException("?λ컮援щ땲媛 鍮꾩뼱 ?덉뒿?덈떎.");
        }
        userCartData.remove(user); // 援щℓ ?꾨즺 ???λ컮援щ땲 珥덇린??
    }

    public void clearCart(User user) {
        // ?ъ슜???λ컮援щ땲?먯꽌 紐⑤뱺 ??ぉ????젣
        List<Cart> userCarts = cartRepository.findByUserId(user.getId());
        cartRepository.deleteAll(userCarts);
    }

    // ?ъ슜?먮퀎 二쇰Ц 湲곕줉 議고쉶
    public List<OrderDto> getOrdersByUserId(Long userId) {
        List<Order> orders = orderRepository.findByBuyerId(userId);
        if (orders.isEmpty()) {
            System.out.println("二쇰Ц 湲곕줉???놁뒿?덈떎.");
        } else {
            System.out.println("二쇰Ц 湲곕줉: " + orders);
        }
    
        List<OrderDto> orderDtos = new ArrayList<>();
        for (Order order : orders) {
            OrderDto orderDto = new OrderDto(order);
            orderDtos.add(orderDto);
        }
        return orderDtos;
    }
    
    
}

