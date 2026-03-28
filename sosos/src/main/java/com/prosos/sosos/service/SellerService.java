package com.prosos.sosos.service;

import com.prosos.sosos.dto.ProductDto;
import com.prosos.sosos.dto.ProductOptionDto;
import com.prosos.sosos.model.Keyword;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.model.ProductOption;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.model.User;
import com.prosos.sosos.model.Inquiry;
import com.prosos.sosos.model.Order;
import com.prosos.sosos.repository.KeywordRepository;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.ProductOptionRepository;
import com.prosos.sosos.repository.SellerRepository;
import com.prosos.sosos.service.storage.FileStorageService;

import jakarta.servlet.http.HttpSession;

import com.prosos.sosos.repository.InquiryRepository;
import com.prosos.sosos.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class SellerService {

    private final SellerRepository sellerRepository;
    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final OrderRepository orderRepository;
    private final InquiryRepository inquiryRepository;
    private final KeywordRepository keywordRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private static final Set<String> EXCLUDED_RANKING_STATUSES = Set.of("CANCELLED", "RETURNED");

    @Autowired
    public SellerService(SellerRepository sellerRepository, ProductRepository productRepository,
                         ProductOptionRepository productOptionRepository,
                         OrderRepository orderRepository, InquiryRepository inquiryRepository,
                         KeywordRepository keywordRepository, NotificationService notificationService,
                         PasswordEncoder passwordEncoder, FileStorageService fileStorageService) {
        this.sellerRepository = sellerRepository;
        this.productRepository = productRepository;
        this.productOptionRepository = productOptionRepository;
        this.orderRepository = orderRepository;
        this.inquiryRepository = inquiryRepository;
        this.keywordRepository = keywordRepository;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
    }

    // 1.1.1 판매자 회원가입
    public Seller registerSeller(Seller seller) {
        if (seller.getPassword() == null || seller.getPassword().isBlank()) {
            throw new IllegalArgumentException("비밀번호 입력");
        }
        seller.setPassword(passwordEncoder.encode(seller.getPassword()));
        return sellerRepository.save(seller);
    }

    // 1.1.2 판매자 로그인
    public boolean login(String businessNumber, String password) {
        Seller seller = sellerRepository.findByBusinessNumber(businessNumber);
        return verifyAndUpgradePassword(seller, password);
    }

    // 1.1.3 판매자 로그아웃
    public void logout(Long sellerId) {
        // 세션 기반 로그아웃, 현재 구현은 상위 레이어 session.invalidate 처리
    }

    // 1.2.1 상품 등록
    public ProductDto addProduct(
            ProductDto productDto,
            MultipartFile imageFile,
            Map<String, List<String>> keywords,
            MultipartFile descriptionImageFile,
            List<ProductOptionDto> optionDtos
    ) {
        Product product = new Product();
        product.setName(productDto.getName());
        product.setCategory(productDto.getCategory());
        product.setPrice(productDto.getPrice());
        product.setDescription(productDto.getDescription());
        product.setSituationScore(productDto.getSituationScore());
        applyDiscoveryTabExposure(product, productDto);
        applyDiscoveryTabKeys(product, productDto);

        if (imageFile != null && !imageFile.isEmpty()) {
            String imagePath = saveImageFile(imageFile);
            product.setImageUrl(imagePath);
        }

        if (descriptionImageFile != null && !descriptionImageFile.isEmpty()) {
            String descriptionImagePath = saveDescriptionImage(descriptionImageFile);
            product.setDescriptionImageUrl(descriptionImagePath);
        }

        Seller seller = sellerRepository.findById(productDto.getSellerId())
                .orElseThrow(() -> new IllegalArgumentException("판매자 정보를 찾을 수 없습니다."));
        product.setSeller(seller);

        if (optionDtos != null && !optionDtos.isEmpty()) {
            applyProductOptions(product, optionDtos);
        } else {
            product.setQuantity(Math.max(productDto.getQuantity(), 0));
        }

        Product savedProduct = productRepository.save(product);
        saveKeywords(savedProduct, keywords);

        return new ProductDto(savedProduct);
    }
    
    
    

    // 상품 키워드 저장
    
    private void saveKeywords(Product product, Map<String, List<String>> keywords) {
        if (keywords == null || keywords.isEmpty()) {
            return;
        }

        keywords.forEach((type, keywordList) -> {
            if (keywordList == null) {
                return;
            }

            keywordList.stream()
                    .map(keyword -> keyword == null ? "" : keyword.trim())
                    .filter(keyword -> !keyword.isBlank())
                    .forEach(keyword -> {
                        Keyword keywordEntity = keywordRepository.findByKeyword(keyword)
                                .orElseGet(() -> keywordRepository.save(new Keyword(keyword, type)));

                        Keyword.ProductKeyword productKeyword = new Keyword.ProductKeyword(product, keywordEntity);
                        product.getProductKeywords().add(productKeyword);
                    });
        });

        productRepository.save(product);
    }

    private void applyProductOptions(Product product, List<ProductOptionDto> optionDtos) {
        if (optionDtos == null) {
            return;
        }

        product.getOptions().clear();
        if (optionDtos.isEmpty()) {
            product.setQuantity(0);
            return;
        }

        Set<String> dedupe = new HashSet<>();
        int totalQuantity = 0;
        int index = 0;

        for (ProductOptionDto optionDto : optionDtos) {
            if (optionDto == null) {
                continue;
            }

            String sizeLabel = optionDto.getSizeLabel() == null ? "" : optionDto.getSizeLabel().trim().toUpperCase();
            if (sizeLabel.isBlank()) {
                throw new IllegalArgumentException("사이즈 라벨 입력");
            }
            if (!dedupe.add(sizeLabel)) {
                throw new IllegalArgumentException("중복 사이즈 라벨: " + sizeLabel);
            }

            int quantity = optionDto.getQuantity() == null ? 0 : optionDto.getQuantity();
            if (quantity < 0) {
                throw new IllegalArgumentException("옵션 수량은 0 이상");
            }

            ProductOption option = new ProductOption();
            option.setProduct(product);
            option.setSizeLabel(sizeLabel);
            option.setQuantity(quantity);
            option.setDisplayOrder(optionDto.getDisplayOrder() == null ? index : Math.max(optionDto.getDisplayOrder(), 0));

            product.getOptions().add(option);
            totalQuantity += quantity;
            index++;
        }

        if (product.getOptions().isEmpty()) {
            throw new IllegalArgumentException("최소 1개 옵션 필요");
        }

        product.setQuantity(totalQuantity);
    }

    private void applyDiscoveryTabExposure(Product product, ProductDto productDto) {
        product.setShowInStarterTab(productDto.getShowInStarterTab());
        product.setShowInGiftTab(productDto.getShowInGiftTab());
        product.setShowInNewTab(productDto.getShowInNewTab());
        product.setShowInBasicTab(productDto.getShowInBasicTab());
        product.setShowInWorkTab(productDto.getShowInWorkTab());
    }

    private void applyDiscoveryTabKeys(Product product, ProductDto productDto) {
        if (productDto.getDiscoveryTabKeys() == null) {
            return;
        }
        product.setDiscoveryTabKeys(productDto.toDiscoveryTabKeysCsv());
    }

    private void attachSoldCount(List<ProductDto> productDtos) {
        if (productDtos == null || productDtos.isEmpty()) {
            return;
        }

        List<Long> productIds = productDtos.stream()
                .map(ProductDto::getId)
                .filter(id -> id != null)
                .toList();

        Map<Long, Integer> soldCountMap = fetchSoldCountMap(productIds);
        for (ProductDto productDto : productDtos) {
            Long productId = productDto.getId();
            productDto.setSoldCount(soldCountMap.getOrDefault(productId, 0));
        }
    }

    private Map<Long, Integer> fetchSoldCountMap(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Object[]> rows = orderRepository.sumSoldQuantityByProductIds(productIds, EXCLUDED_RANKING_STATUSES);
        Map<Long, Integer> soldCountMap = new HashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null || row[1] == null) {
                continue;
            }
            Long productId = ((Number) row[0]).longValue();
            Integer soldCount = ((Number) row[1]).intValue();
            soldCountMap.put(productId, soldCount);
        }
        return soldCountMap;
    }
    

    

    // 1.2.2 상품 수정
    public ProductDto updateProduct(
            Long productId,
            ProductDto productDto,
            MultipartFile imageFile,
            MultipartFile descriptionImageFile,
            List<ProductOptionDto> optionDtos
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("수정할 상품을 찾을 수 없습니다."));

        double previousPrice = product.getPrice();
        int previousQuantity = product.getQuantity();

        product.setName(productDto.getName());
        product.setCategory(productDto.getCategory());
        product.setPrice(productDto.getPrice());
        product.setDescription(productDto.getDescription());
        product.setSituationScore(productDto.getSituationScore());
        applyDiscoveryTabExposure(product, productDto);
        applyDiscoveryTabKeys(product, productDto);

        if (imageFile != null && !imageFile.isEmpty()) {
            String imagePath = saveImageFile(imageFile);
            product.setImageUrl(imagePath);
        }

        if (descriptionImageFile != null && !descriptionImageFile.isEmpty()) {
            String descriptionImagePath = saveDescriptionImage(descriptionImageFile);
            product.setDescriptionImageUrl(descriptionImagePath);
        }

        if (optionDtos != null) {
            applyProductOptions(product, optionDtos);
            if (optionDtos.isEmpty()) {
                product.setQuantity(0);
            }
        } else {
            product.setQuantity(Math.max(productDto.getQuantity(), 0));
        }

        Product updatedProduct = productRepository.save(product);
        // 재입고/할인 조건을 만족하면 찜 사용자에게 알림 전송.
        notificationService.notifyProductUpdatedForWishlist(updatedProduct, previousPrice, previousQuantity);
        return new ProductDto(updatedProduct);
    }
    
    


    // 상세 설명 이미지 저장
    public String saveDescriptionImage(MultipartFile descriptionImageFile) {
        return fileStorageService.upload(descriptionImageFile, "description", "description-image");
    }


    // 대표 상품 이미지 저장
    private String saveImageFile(MultipartFile imageFile) {
        return fileStorageService.upload(imageFile, "", "product-image");
    }


    // 1.2.3 상품 삭제
    public void deleteProduct(Long productId) {
        productRepository.deleteById(productId);
    }

    // 1.2.4 상품명 검색
    public List<ProductDto> searchProductsByTitle(String title) {
        List<Product> products = productRepository.findByNameContaining(title);
        List<ProductDto> productDtos = products.stream().map(ProductDto::new).toList();
        attachSoldCount(productDtos);
        return productDtos;
    }

    // 1.2.5 전체 상품 조회
    public List<ProductDto> getAllProducts() {
        List<Product> products = productRepository.findAll();
        List<ProductDto> productDtos = products.stream().map(ProductDto::new).toList();
        attachSoldCount(productDtos);
        return productDtos;
    }

    // 1.2.6 카테고리별 상품 조회
    public List<ProductDto> getProductsByCategory(String categoryName) {
        // categoryName 기준 필터 조회
        List<Product> products = productRepository.findByCategory(categoryName);
        List<ProductDto> productDtos = products.stream().map(ProductDto::new).toList();
        attachSoldCount(productDtos);
        return productDtos;
    }
    
    // 1.2.7 상품 단건 조회
    public ProductDto getProductById(Long id) {
        System.out.println("상품 단건 조회 요청 ID: " + id);
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("해당 ID 상품을 찾을 수 없습니다."));
        System.out.println("조회된 상품명: " + product.getName());
        ProductDto productDto = new ProductDto(product);
        attachSoldCount(List.of(productDto));
        return productDto;
    }
    
    
    // 1.3.1 주문 상태 처리중 변경
    @Transactional
    public void processOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));
        String previousStatus = order.getStatus();
        order.setStatus("PROCESSED");
        orderRepository.save(order);
        // 상태 변경이 저장된 뒤 알림 전송.
        notificationService.notifyOrderStatusChanged(order, previousStatus);
    }

    // 1.3.2 주문 취소 변경
    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));
        String previousStatus = order.getStatus();
        order.setStatus("CANCELLED");
        orderRepository.save(order);
        // 상태 변경이 저장된 뒤 알림 전송.
        notificationService.notifyOrderStatusChanged(order, previousStatus);
    }

    // 1.3.3 주문 반품 변경
    @Transactional
    public void processReturn(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));
        String previousStatus = order.getStatus();
        order.setStatus("RETURNED");
        orderRepository.save(order);
        // 상태 변경이 저장된 뒤 알림 전송.
        notificationService.notifyOrderStatusChanged(order, previousStatus);
    }

    // 1.3.4 주문 교환 변경
    @Transactional
    public void processExchange(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));
        String previousStatus = order.getStatus();
        order.setStatus("EXCHANGED");
        orderRepository.save(order);
        // 상태 변경이 저장된 뒤 알림 전송.
        notificationService.notifyOrderStatusChanged(order, previousStatus);
    }


    // 1.3.5 상품 구매 처리
    @Transactional
    public void processPurchase(Long productId, HttpSession session) {
        processPurchase(productId, null, session);
    }

    @Transactional
    public void processPurchase(Long productId, Long optionId, HttpSession session) {
        User buyer = (User) session.getAttribute("loggedInUser");
        if (buyer == null) {
            throw new IllegalStateException("사용자 로그인이 필요합니다.");
        }

        int orderQuantity = 1;
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        String selectedSize = null;
        List<ProductOption> productOptions = productOptionRepository.findByProductIdOrderByDisplayOrderAscIdAsc(productId);
        boolean hasOptions = !productOptions.isEmpty();

        if (hasOptions) {
            if (optionId == null) {
                throw new IllegalArgumentException("사이즈 선택");
            }

            ProductOption option = productOptionRepository.findByIdForUpdate(optionId)
                    .orElseThrow(() -> new IllegalArgumentException("선택한 사이즈를 찾을 수 없습니다."));

            if (!option.getProduct().getId().equals(productId)) {
                throw new IllegalArgumentException("상품과 사이즈 정보가 일치하지 않습니다.");
            }

            if (option.getQuantity() < orderQuantity) {
                throw new IllegalArgumentException("SOLD OUT 상품입니다.");
            }

            option.setQuantity(option.getQuantity() - orderQuantity);
            selectedSize = option.getSizeLabel();
        } else {
            if (product.getQuantity() < orderQuantity) {
                throw new IllegalArgumentException("SOLD OUT 상품입니다.");
            }
        }

        product.setQuantity(Math.max(product.getQuantity() - orderQuantity, 0));

        Order order = new Order();
        order.setBuyer(buyer);
        order.setProduct(product);
        order.setQuantity(orderQuantity);
        order.setSizeLabel(selectedSize);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("ORDERED");
        order.setTotalAmount(BigDecimal.valueOf(product.getPrice())
                .multiply(BigDecimal.valueOf(orderQuantity)));
        orderRepository.save(order);
    }


    // 1.3.6 판매자 주문 목록 조회
    public List<Order> getOrdersBySeller(Long sellerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("판매자를 찾을 수 없습니다."));
        return orderRepository.findByProduct_Seller(seller);
    }

    // 1.4.1 문의 답변 등록
    public void answerInquiry(Long inquiryId, String answer) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("문의를 찾을 수 없습니다."));
        boolean existedAnswer = inquiry.getAnswer() != null && !inquiry.getAnswer().trim().isEmpty();
        inquiry.setAnswer(answer);
        inquiry.setSellerName("SOS 운영팀");
        inquiry.setAnsweredDate(LocalDateTime.now());
        inquiryRepository.save(inquiry);
        // 답변 등록/수정 후 문의 작성자에게 알림 전송.
        notificationService.notifyInquiryAnswered(inquiry, existedAnswer);
    }


    // 1.4.2 문의 답변 삭제
    public void deleteInquiryAnswer(Long inquiryId) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("문의를 찾을 수 없습니다."));
        inquiry.setAnswer(null);
        inquiryRepository.save(inquiry);
    }

    // 1.4.3 문의 답변 수정
    public void updateInquiryAnswer(Long inquiryId, String newAnswer) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("문의를 찾을 수 없습니다."));
        inquiry.setAnswer(newAnswer);
        inquiryRepository.save(inquiry);
        // 이 경로는 답변 수정이므로 updated=true로 처리.
        notificationService.notifyInquiryAnswered(inquiry, true);
    }

    // 1.5.1 키워드 관리
    public void manageKeyword(String keyword, boolean add) {
        if (add) {
            // 키워드 신규 등록
            Keyword newKeyword = new Keyword(keyword, ""); // 타입은 빈 문자열
            keywordRepository.save(newKeyword);
        } else {
            // 기존 키워드 삭제
            Optional<Keyword> keywordToDelete = keywordRepository.findByKeyword(keyword);
            if (keywordToDelete.isPresent()) {
                keywordRepository.delete(keywordToDelete.get());
            } else {
                throw new IllegalArgumentException("해당 키워드를 찾을 수 없습니다.");
            }
        }
    }


    // 1.6.1 사업자번호 기준 판매자 조회
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
            // 기존 데이터에 평문 비밀번호가 남아 있을 수 있음.
        }

        if (storedPassword.equals(rawPassword)) {
            seller.setPassword(passwordEncoder.encode(rawPassword));
            sellerRepository.save(seller);
            return true;
        }

        return false;
    }
}


