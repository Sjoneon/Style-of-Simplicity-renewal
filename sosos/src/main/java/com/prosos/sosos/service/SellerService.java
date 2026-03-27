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

import jakarta.servlet.http.HttpSession;

import com.prosos.sosos.repository.InquiryRepository;
import com.prosos.sosos.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

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
    private final Path uploadRootPath;
    private final Path descriptionUploadPath;
    private static final Set<String> EXCLUDED_RANKING_STATUSES = Set.of("CANCELLED", "RETURNED");

    @Autowired
    public SellerService(SellerRepository sellerRepository, ProductRepository productRepository,
                         ProductOptionRepository productOptionRepository,
                         OrderRepository orderRepository, InquiryRepository inquiryRepository,
                         KeywordRepository keywordRepository, NotificationService notificationService,
                         PasswordEncoder passwordEncoder,
                         @Value("${app.upload.base-dir:uploads}") String uploadBaseDir) {
        this.sellerRepository = sellerRepository;
        this.productRepository = productRepository;
        this.productOptionRepository = productOptionRepository;
        this.orderRepository = orderRepository;
        this.inquiryRepository = inquiryRepository;
        this.keywordRepository = keywordRepository;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
        String normalizedBaseDir = (uploadBaseDir == null || uploadBaseDir.isBlank()) ? "uploads" : uploadBaseDir;
        this.uploadRootPath = Paths.get(normalizedBaseDir).toAbsolutePath().normalize();
        this.descriptionUploadPath = this.uploadRootPath.resolve("description");
    }

    // 1.1.1 ??????????롮쾸?椰???⑤챶猷??
    public Seller registerSeller(Seller seller) {
        if (seller.getPassword() == null || seller.getPassword().isBlank()) {
            throw new IllegalArgumentException("?????????????????獄쏅챶留???????筌?캉??");
        }
        seller.setPassword(passwordEncoder.encode(seller.getPassword()));
        return sellerRepository.save(seller);
    }

    // 1.1.2 ?????????癲???(???????????뼿?????嶺???饔낅떽??????됰엨??????????????癲????????ル뒌????
    public boolean login(String businessNumber, String password) {
        Seller seller = sellerRepository.findByBusinessNumber(businessNumber);
        return verifyAndUpgradePassword(seller, password);
    }

    // 1.1.3 ????癲??????獄쏅챶留??
    public void logout(Long sellerId) {
        // ????癲??????獄쏅챶留??????癲??沃섃뫂??? ????μ떜媛?걫?繹먃??????????몃듋????????饔낅떽?????????癲ル슢캉??????????JWT ????壤굿??Β?????癲ル슢캉?????? ?????獄쏅챶留??????????????????곸죩.
    }

    // 1.2.1 ??????곗뒩筌? ?????롮쾸?椰???⑤챶猷??(?????耀붾굝??????? ????μ떜媛?걫??곸돸壤??????
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
                .orElseThrow(() -> new IllegalArgumentException("???????嶺뚮㉡?€쾮??癲ル슓??젆???????⑤８?????덊렡."));
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
    
    
    

    // ????μ떜媛?걫??곸돸壤???????耀붾굝???????????곕???
    
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
                throw new IllegalArgumentException("???좑쭩?揶쏅?????쑴堉???됰뮸??덈뼄.");
            }
            if (!dedupe.add(sizeLabel)) {
                throw new IllegalArgumentException("餓λ쵎??????좑쭩?? ??됰뮸??덈뼄: " + sizeLabel);
            }

            int quantity = optionDto.getQuantity() == null ? 0 : optionDto.getQuantity();
            if (quantity < 0) {
                throw new IllegalArgumentException("???좑쭩??????0 ??곴맒??곷선????몃빍??");
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
            throw new IllegalArgumentException("筌ㅼ뮇??1揶???곴맒?????좑쭩???????袁⑹뒄??몃빍??");
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
    

    

    // ??????곗뒩筌? ?????곌떽釉붾??(?????耀붾굝??????? ????μ떜媛?걫??곸돸壤??????
    public ProductDto updateProduct(
            Long productId,
            ProductDto productDto,
            MultipartFile imageFile,
            MultipartFile descriptionImageFile,
            List<ProductOptionDto> optionDtos
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("??⑤갭? ?筌먲퐢沅??嶺뚢돦堉??????怨룸????덈펲."));

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
    
    


    // ?????筌뤾퍓愿????????筌뤾쑴留??????耀붾굝????? ????
    public String saveDescriptionImage(MultipartFile descriptionImageFile) {
        try {
            Files.createDirectories(descriptionUploadPath);

            String originalName = descriptionImageFile.getOriginalFilename();
            String safeOriginalName = (originalName == null || originalName.isBlank()) ? "description-image" : originalName;
            String uniqueFileName = UUID.randomUUID() + "_" + safeOriginalName;
            Path targetPath = descriptionUploadPath.resolve(uniqueFileName).normalize();

            descriptionImageFile.transferTo(targetPath.toFile());
            return "/images/description/" + uniqueFileName;
        } catch (IOException e) {
            throw new RuntimeException("?????몃뱥???????轅붽틓??? ???????????⑤챷逾???ル봿?? ??ш끽維뽳쭩?좊쐪筌먲퐢?????????????낆젵.", e);
        }
    }



    // ?????耀붾굝????? ????????癲??沃섃뫂???(?? ????癲?????????????????????????????????袁④뎬????????????)
    private String saveImageFile(MultipartFile imageFile) {
        try {
            Files.createDirectories(uploadRootPath);

            String originalName = imageFile.getOriginalFilename();
            String safeOriginalName = (originalName == null || originalName.isBlank()) ? "product-image" : originalName;
            String uniqueFileName = UUID.randomUUID() + "_" + safeOriginalName;
            Path targetPath = uploadRootPath.resolve(uniqueFileName).normalize();

            imageFile.transferTo(targetPath.toFile());
            return "/images/" + uniqueFileName;
        } catch (IOException e) {
            throw new RuntimeException("?????????轅붽틓??? ???????????⑤챷逾???ル봿?? ??ш끽維뽳쭩?좊쐪筌먲퐢?????????????낆젵.", e);
        }
    }
    
    

    // 1.2.3 ??????곗뒩筌? ????
    public void deleteProduct(Long productId) {
        productRepository.deleteById(productId);
    }

    // 1.2.4 ??????ル뭸??????轅붽틓?????룰퀣維????汝뷴젆?琉????
    public List<ProductDto> searchProductsByTitle(String title) {
        List<Product> products = productRepository.findByNameContaining(title);
        List<ProductDto> productDtos = products.stream().map(ProductDto::new).toList();
        attachSoldCount(productDtos);
        return productDtos;
    }

    // 1.2.5 ?????獄쏅챶留????????곗뒩筌? ?耀붾굝?????????붾눀?袁⑸븸亦껋꼷伊???????⑥ル?????
    public List<ProductDto> getAllProducts() {
        List<Product> products = productRepository.findAll();
        List<ProductDto> productDtos = products.stream().map(ProductDto::new).toList();
        attachSoldCount(productDtos);
        return productDtos;
    }

    // 1.2.6 ?????몃뱥??????遺븍き??????????????Β?レ름???????
    public List<ProductDto> getProductsByCategory(String categoryName) {
        // ?????몃뱥??????遺븍き??????????????獄쏅챶留?????????????????????汝뷴젆?琉????
        List<Product> products = productRepository.findByCategory(categoryName);
        List<ProductDto> productDtos = products.stream().map(ProductDto::new).toList();
        attachSoldCount(productDtos);
        return productDtos;
    }
    
    //1.2.7 ?????筌뤾퍓愿??????곌떽釉붾?????????? ????⑥ル?????
    public ProductDto getProductById(Long id) {
        System.out.println("??????곗뒩筌? ????⑥ル???????.. ID: " + id);
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("?????ID????????곗뒩筌???????⑥ル??????? ?????????????곸죩."));
        System.out.println("????⑥ル????????????곗뒩筌?: " + product.getName());
        ProductDto productDto = new ProductDto(product);
        attachSoldCount(List.of(productDto));
        return productDto;
    }
    
    
    // 1.3.1 ?????影??젘????????밸쫫??꿔꺂????댁슦????饔낅떽????????????耀붾굝????鶯ㅺ동??筌믡룓愿??
    @Transactional
    public void processOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID????????밸쫫??꿔꺂????댁슦???????⑥ル??????? ?????????????곸죩."));
        String previousStatus = order.getStatus();
        order.setStatus("PROCESSED");
        orderRepository.save(order);
        // 상태 변경이 저장된 뒤 알림 전송.
        notificationService.notifyOrderStatusChanged(order, previousStatus);
    }

    // 1.3.2 ???????????怨멸텛???
    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID????????밸쫫??꿔꺂????댁슦???????⑥ル??????? ?????????????곸죩."));
        String previousStatus = order.getStatus();
        order.setStatus("CANCELLED");
        orderRepository.save(order);
        // 상태 변경이 저장된 뒤 알림 전송.
        notificationService.notifyOrderStatusChanged(order, previousStatus);
    }

    // 1.3.3 ?????밸븶筌믩끃???????떙???????怨멸텛???
    @Transactional
    public void processReturn(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID????????밸쫫??꿔꺂????댁슦???????⑥ル??????? ?????????????곸죩."));
        String previousStatus = order.getStatus();
        order.setStatus("RETURNED");
        orderRepository.save(order);
        // 상태 변경이 저장된 뒤 알림 전송.
        notificationService.notifyOrderStatusChanged(order, previousStatus);
    }

    // 1.3.4 ???????????怨멸텛???
    @Transactional
    public void processExchange(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID????????밸쫫??꿔꺂????댁슦???????⑥ル??????? ?????????????곸죩."));
        String previousStatus = order.getStatus();
        order.setStatus("EXCHANGED");
        orderRepository.save(order);
        // 상태 변경이 저장된 뒤 알림 전송.
        notificationService.notifyOrderStatusChanged(order, previousStatus);
    }


    // 1.3.5 ?饔낅떽??影?곗몡嶺뚮??껆빊??????鶯???饔낅떽???壤굿?戮㏐광??
    @Transactional
    public void processPurchase(Long productId, HttpSession session) {
        processPurchase(productId, null, session);
    }

    @Transactional
    public void processPurchase(Long productId, Long optionId, HttpSession session) {
        User buyer = (User) session.getAttribute("loggedInUser");
        if (buyer == null) {
            throw new IllegalStateException("?ъ슜??濡쒓렇?몄씠 ?꾩슂?⑸땲??");
        }

        int orderQuantity = 1;
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new IllegalArgumentException("?곹뭹??李얠쓣 ???놁뒿?덈떎."));

        String selectedSize = null;
        List<ProductOption> productOptions = productOptionRepository.findByProductIdOrderByDisplayOrderAscIdAsc(productId);
        boolean hasOptions = !productOptions.isEmpty();

        if (hasOptions) {
            if (optionId == null) {
                throw new IllegalArgumentException("?ъ씠利덈? ?좏깮??二쇱꽭??");
            }

            ProductOption option = productOptionRepository.findByIdForUpdate(optionId)
                    .orElseThrow(() -> new IllegalArgumentException("?좏깮???ъ씠利덈? 李얠쓣 ???놁뒿?덈떎."));

            if (!option.getProduct().getId().equals(productId)) {
                throw new IllegalArgumentException("?곹뭹怨??ъ씠利??뺣낫媛 ?쇱튂?섏? ?딆뒿?덈떎.");
            }

            if (option.getQuantity() < orderQuantity) {
                throw new IllegalArgumentException("SOLD OUT ?곹뭹?낅땲??");
            }

            option.setQuantity(option.getQuantity() - orderQuantity);
            selectedSize = option.getSizeLabel();
        } else {
            if (product.getQuantity() < orderQuantity) {
                throw new IllegalArgumentException("SOLD OUT ?곹뭹?낅땲??");
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


    // 1.3.6 ???????????????밸쫫??꿔꺂????댁슦??????⑥ル?????
    public List<Order> getOrdersBySeller(Long sellerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("??????? ?耀붾굝????????????????源낆┰?????????곸죩."));
        return orderRepository.findByProduct_Seller(seller);
    }

    // 1.4.1 ???癲??????? ?????롮쾸?椰???⑤챶猷??
    public void answerInquiry(Long inquiryId, String answer) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID?????癲????????쇨덫?? ????⑥ル??????? ?????????????곸죩."));
        boolean existedAnswer = inquiry.getAnswer() != null && !inquiry.getAnswer().trim().isEmpty();
        inquiry.setAnswer(answer);
        inquiry.setSellerName("SOS ?????노듋??㉱??");
        inquiry.setAnsweredDate(LocalDateTime.now());
        inquiryRepository.save(inquiry);
        // 답변 등록/수정 후 문의 작성자에게 알림 전송.
        notificationService.notifyInquiryAnswered(inquiry, existedAnswer);
    }


    // 1.4.2 ???癲??????? ????
    public void deleteInquiryAnswer(Long inquiryId) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID?????癲????????쇨덫?? ????⑥ル??????? ?????????????곸죩."));
        inquiry.setAnswer(null);
        inquiryRepository.save(inquiry);
    }

    // 1.4.3 ???癲??????? ?????곌떽釉붾??
    public void updateInquiryAnswer(Long inquiryId, String newAnswer) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID?????癲????????쇨덫?? ????⑥ル??????? ?????????????곸죩."));
        inquiry.setAnswer(newAnswer);
        inquiryRepository.save(inquiry);
        // 이 경로는 답변 수정이므로 updated=true로 처리.
        notificationService.notifyInquiryAnswered(inquiry, true);
    }

    // 1.5.1 ????μ떜媛?걫??곸돸壤???????怨멸텛???
    public void manageKeyword(String keyword, boolean add) {
        if (add) {
            // ??????μ떜媛?걫??곸돸壤??????ш끽維뽳쭩?????????
            Keyword newKeyword = new Keyword(keyword, ""); // ?????????獄쏅챶留??????????????????????μ떜媛?걫???
            keywordRepository.save(newKeyword);
        } else {
            // ????μ떜媛?걫??곸돸壤??????
            Optional<Keyword> keywordToDelete = keywordRepository.findByKeyword(keyword);
            if (keywordToDelete.isPresent()) {
                keywordRepository.delete(keywordToDelete.get());
            } else {
                throw new IllegalArgumentException("?????????μ떜媛?걫??곸돸壤??? ????⑥ル??????? ?????????????곸죩.");
            }
        }
    }


    // 1.6.1 ???????????뼿?????嶺???饔낅떽??????됰씮彛????????????⑥ル?????
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


