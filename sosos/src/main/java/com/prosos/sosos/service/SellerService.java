package com.prosos.sosos.service;

import com.prosos.sosos.dto.ProductDto;
import com.prosos.sosos.model.Keyword;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.model.User;
import com.prosos.sosos.model.Inquiry;
import com.prosos.sosos.model.Order;
import com.prosos.sosos.repository.KeywordRepository;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.SellerRepository;

import jakarta.servlet.http.HttpSession;

import com.prosos.sosos.repository.InquiryRepository;
import com.prosos.sosos.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SellerService {

    private final SellerRepository sellerRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final InquiryRepository inquiryRepository;
    private final KeywordRepository keywordRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public SellerService(SellerRepository sellerRepository, ProductRepository productRepository,
                         OrderRepository orderRepository, InquiryRepository inquiryRepository,
                         KeywordRepository keywordRepository, PasswordEncoder passwordEncoder) {
        this.sellerRepository = sellerRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.inquiryRepository = inquiryRepository;
        this.keywordRepository = keywordRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 1.1.1 ?ъ뾽???깅줉
    public Seller registerSeller(Seller seller) {
        if (seller.getPassword() == null || seller.getPassword().isBlank()) {
            throw new IllegalArgumentException("鍮꾨?踰덊샇???꾩닔?낅땲??");
        }
        seller.setPassword(passwordEncoder.encode(seller.getPassword()));
        return sellerRepository.save(seller);
    }

    // 1.1.2 ?ъ뾽??濡쒓렇??(?ъ뾽?먮벑濡앸쾲?몃쭔?쇰줈 濡쒓렇??媛??
    public boolean login(String businessNumber, String password) {
        Seller seller = sellerRepository.findByBusinessNumber(businessNumber);
        return verifyAndUpgradePassword(seller, password);
    }

    // 1.1.3 濡쒓렇?꾩썐
    public void logout(Long sellerId) {
        // 濡쒓렇?꾩썐 濡쒖쭅: ?ㅼ젣 援ы쁽?먯꽌???몄뀡 臾댄슚???먮뒗 JWT ?좏겙 臾댄슚?붽? ?꾩슂?????덉뒿?덈떎.
    }

    // 1.2.1 ?곹뭹 ?깅줉 (?대?吏? ?ㅼ썙???ы븿)
    public ProductDto addProduct(ProductDto productDto, MultipartFile imageFile, Map<String, List<String>> keywords, MultipartFile descriptionImageFile) {
        Product product = new Product();
        product.setName(productDto.getName());
        product.setCategory(productDto.getCategory());
        product.setPrice(productDto.getPrice());
        product.setQuantity(productDto.getQuantity());
        product.setDescription(productDto.getDescription());
        product.setSituationScore(productDto.getSituationScore());
    
        // ????대?吏 泥섎━
        if (imageFile != null && !imageFile.isEmpty()) {
            String imagePath = saveImageFile(imageFile);
            product.setImageUrl(imagePath);
        }
    
        // ?곸꽭 ?ㅻ챸 ?대?吏 泥섎━
        if (descriptionImageFile != null && !descriptionImageFile.isEmpty()) {
            String descriptionImagePath = saveDescriptionImage(descriptionImageFile);
            product.setDescriptionImageUrl(descriptionImagePath); // SQL ?꾨뱶?????
        }
    
        // ?먮ℓ???ㅼ젙
        Seller seller = sellerRepository.findById(productDto.getSellerId())
                .orElseThrow(() -> new IllegalArgumentException("?대떦 ID???먮ℓ?먭? 議댁옱?섏? ?딆뒿?덈떎."));
        product.setSeller(seller);
    
        // ?곹뭹 ???
        Product savedProduct = productRepository.save(product);
    
        // ?ㅼ썙?????
        saveKeywords(savedProduct, keywords);
    
        return new ProductDto(savedProduct);
    }
    
    
    

    // ?ㅼ썙?????硫붿꽌??
    private void saveKeywords(Product product, Map<String, List<String>> keywords) {
        keywords.forEach((type, keywordList) -> {
            keywordList.forEach(keyword -> {
                // ?ㅼ썙??媛?몄삤嫄곕굹 ?덈줈 ?앹꽦
                Keyword keywordEntity = keywordRepository.findByKeyword(keyword)
                    .orElseGet(() -> {
                        Keyword newKeyword = new Keyword(keyword, type);
                        return keywordRepository.save(newKeyword);
                    });
    
                // ProductKeyword ?앹꽦 諛??곹뭹-?ㅼ썙??愿怨?異붽?
                Keyword.ProductKeyword productKeyword = new Keyword.ProductKeyword(product, keywordEntity);
                product.getProductKeywords().add(productKeyword);
            });
        });
    
        // ?곹뭹 ???(?곹뭹-?ㅼ썙??愿怨??ы븿)
        productRepository.save(product);
    }
    

    

    // ?곹뭹 ?섏젙 (?대?吏? ?ㅼ썙???ы븿)
    public ProductDto updateProduct(Long productId, ProductDto productDto, MultipartFile imageFile, MultipartFile descriptionImageFile) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("?대떦 ID???곹뭹??議댁옱?섏? ?딆뒿?덈떎."));
    
        product.setName(productDto.getName());
        product.setCategory(productDto.getCategory());
        product.setPrice(productDto.getPrice());
        product.setDescription(productDto.getDescription());
        product.setSituationScore(productDto.getSituationScore());
    
        // ????대?吏 ?낅뜲?댄듃 泥섎━
        if (imageFile != null && !imageFile.isEmpty()) {
            String imagePath = saveImageFile(imageFile);
            product.setImageUrl(imagePath);
        }
    
        // ?곸꽭 ?ㅻ챸 ?대?吏 ?낅뜲?댄듃 泥섎━
        if (descriptionImageFile != null && !descriptionImageFile.isEmpty()) {
            String descriptionImagePath = saveDescriptionImage(descriptionImageFile);
            product.setDescriptionImageUrl(descriptionImagePath);
        }
    
        Product updatedProduct = productRepository.save(product);
        return new ProductDto(updatedProduct);
    }
    
    


    // ?곸꽭 ?ㅻ챸 ?대?吏 ???
public String saveDescriptionImage(MultipartFile descriptionImageFile) {
    try {
        String uploadDir = "C:\\Users\\Roneon\\Desktop\\SosProject\\images\\description";
        File uploadDirectory = new File(uploadDir);
        if (!uploadDirectory.exists()) {
            uploadDirectory.mkdirs(); // ?붾젆?좊━ ?앹꽦
        }

        // 怨좎쑀???뚯씪 ?대쫫 ?앹꽦
        String uniqueFileName = UUID.randomUUID().toString() + "_" + descriptionImageFile.getOriginalFilename();
        String filePath = uploadDir + File.separator + uniqueFileName;
        File destinationFile = new File(filePath);

        // ?뚯씪 ???
        descriptionImageFile.transferTo(destinationFile);

        // 釉뚮씪?곗??먯꽌 ?묎렐 媛?ν븳 URL 諛섑솚
        return "/images/description/" + uniqueFileName;
    } catch (IOException e) {
        throw new RuntimeException("?곸꽭 ?ㅻ챸 ?대?吏 ????ㅽ뙣", e);
    }
}



    // ?대?吏 ???濡쒖쭅 (?? 濡쒖뺄 ?뚯씪 ?쒖뒪???먮뒗 ?대씪?곕뱶 ?ㅽ넗由ъ?)
    private String saveImageFile(MultipartFile imageFile) {
        try {
            String uploadDir = "C:\\Users\\Roneon\\Desktop\\SosProject\\images"; // ?대?吏 ????대뜑
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                uploadDirectory.mkdirs(); // ?붾젆?좊━媛 ?놁쑝硫??앹꽦
            }
    
            // ?뚯씪 ?대쫫??UUID濡??ㅼ젙?섏뿬 怨좎쑀?섍쾶 留뚮벊?덈떎.
            String uniqueFileName = UUID.randomUUID().toString() + "_" + imageFile.getOriginalFilename();
            String filePath = uploadDir + File.separator + uniqueFileName;
            File destinationFile = new File(filePath);
    
            // ?대?吏 ?뚯씪 ???
            imageFile.transferTo(destinationFile);
    
            // 釉뚮씪?곗??먯꽌 ?묎렐 媛?ν븳 URL 諛섑솚
            return "/images/" + uniqueFileName;
        } catch (IOException e) {
            throw new RuntimeException("?대?吏 ?뚯씪 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎.", e);
        }
    }
    
    

    // 1.2.3 ?곹뭹 ??젣
    public void deleteProduct(Long productId) {
        productRepository.deleteById(productId);
    }

    // 1.2.4 臾쇳뭹 ?쒕ぉ 寃??
    public List<ProductDto> searchProductsByTitle(String title) {
        List<Product> products = productRepository.findByNameContaining(title);
        return products.stream().map(ProductDto::new).toList();
    }

    // 1.2.5 ?꾩껜 ?곹뭹 紐⑸줉 議고쉶
    public List<ProductDto> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return products.stream().map(ProductDto::new).toList();
    }

    // 1.2.6 移댄뀒怨좊━ 遺꾨쪟
    public List<ProductDto> getProductsByCategory(String categoryName) {
        // 移댄뀒怨좊━ ?꾨뱶瑜?湲곗??쇰줈 寃??
        List<Product> products = productRepository.findByCategory(categoryName);
        return products.stream().map(ProductDto::new).toList();
    }
    
    //1.2.7 ?곸꽭?섏씠吏 議고쉶
    public ProductDto getProductById(Long id) {
        System.out.println("?곹뭹 議고쉶 以?.. ID: " + id);
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("?대떦 ID???곹뭹??議댁옱?섏? ?딆뒿?덈떎."));
        System.out.println("議고쉶???곹뭹: " + product.getName());
        return new ProductDto(product);
    }
    
    
    // 1.3.1 ?좉퇋 二쇰Ц ?뺤씤 諛?泥섎━
    @Transactional
    public void processOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("?대떦 ID??二쇰Ц??議댁옱?섏? ?딆뒿?덈떎."));
        order.setStatus("PROCESSED");
        orderRepository.save(order);
    }

    // 1.3.2 痍⑥냼 愿由?
    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("?대떦 ID??二쇰Ц??議댁옱?섏? ?딆뒿?덈떎."));
        order.setStatus("CANCELLED");
        orderRepository.save(order);
    }

    // 1.3.3 諛섑뭹 愿由?
    @Transactional
    public void processReturn(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("?대떦 ID??二쇰Ц??議댁옱?섏? ?딆뒿?덈떎."));
        order.setStatus("RETURNED");
        orderRepository.save(order);
    }

    // 1.3.4 援먰솚 愿由?
    @Transactional
    public void processExchange(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("?대떦 ID??二쇰Ц??議댁옱?섏? ?딆뒿?덈떎."));
        order.setStatus("EXCHANGED");
        orderRepository.save(order);
    }


    // 1.3.5 즉시 구매 처리
    @Transactional
    public void processPurchase(Long productId, HttpSession session) {
        User buyer = (User) session.getAttribute("loggedInUser");
        if (buyer == null) {
            throw new IllegalStateException("로그인한 사용자가 없습니다.");
        }

        int orderQuantity = 1;
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        if (product.getQuantity() < orderQuantity) {
            throw new IllegalArgumentException("재고가 부족합니다.");
        }

        product.setQuantity(product.getQuantity() - orderQuantity);

        Order order = new Order();
        order.setBuyer(buyer);
        order.setProduct(product);
        order.setQuantity(orderQuantity);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("ORDERED");
        order.setTotalAmount(BigDecimal.valueOf(product.getPrice())
                .multiply(BigDecimal.valueOf(orderQuantity)));
        orderRepository.save(order);
    }


    // 1.3.6 ?먮ℓ?먮퀎 二쇰Ц 議고쉶
    public List<Order> getOrdersBySeller(Long sellerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("?먮ℓ?먮? 李얠쓣 ???놁뒿?덈떎."));
        return orderRepository.findByProduct_Seller(seller);
    }

    // 1.4.1 臾몄쓽 ?듬? ?깅줉
    public void answerInquiry(Long inquiryId, String answer) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("?대떦 ID??臾몄쓽媛 議댁옱?섏? ?딆뒿?덈떎."));
        inquiry.setAnswer(answer);
        inquiry.setSellerName("시스템"); // ?됰꽕???ㅼ젙
        inquiry.setAnsweredDate(LocalDateTime.now());
        inquiryRepository.save(inquiry);
    }


    // 1.4.2 臾몄쓽 ?듬? ??젣
    public void deleteInquiryAnswer(Long inquiryId) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("?대떦 ID??臾몄쓽媛 議댁옱?섏? ?딆뒿?덈떎."));
        inquiry.setAnswer(null);
        inquiryRepository.save(inquiry);
    }

    // 1.4.3 臾몄쓽 ?듬? ?섏젙
    public void updateInquiryAnswer(Long inquiryId, String newAnswer) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("?대떦 ID??臾몄쓽媛 議댁옱?섏? ?딆뒿?덈떎."));
        inquiry.setAnswer(newAnswer);
        inquiryRepository.save(inquiry);
    }

    // 1.5.1 ?ㅼ썙??愿由?
    public void manageKeyword(String keyword, boolean add) {
        if (add) {
            // ???ㅼ썙???앹꽦 諛????
            Keyword newKeyword = new Keyword(keyword, ""); // ????꾨뱶?????湲곕낯 媛??ㅼ젙
            keywordRepository.save(newKeyword);
        } else {
            // ?ㅼ썙????젣
            Optional<Keyword> keywordToDelete = keywordRepository.findByKeyword(keyword);
            if (keywordToDelete.isPresent()) {
                keywordRepository.delete(keywordToDelete.get());
            } else {
                throw new IllegalArgumentException("?대떦 ?ㅼ썙?쒓? 議댁옱?섏? ?딆뒿?덈떎.");
            }
        }
    }


    // 1.6.1 ?ъ뾽?먮벑濡앸쾲?몃줈 ?먮ℓ??議고쉶
    public Seller findByBusinessNumber(String businessNumber) {
        return sellerRepository.findByBusinessNumber(businessNumber);
    }

    private boolean verifyAndUpgradePassword(Seller seller, String rawPassword) {
        if (seller == null || rawPassword == null || rawPassword.isBlank()) {
            return false;
        }

        String storedPassword = seller.getPassword();
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
            seller.setPassword(passwordEncoder.encode(rawPassword));
            sellerRepository.save(seller);
            return true;
        }

        return false;
    }
}

