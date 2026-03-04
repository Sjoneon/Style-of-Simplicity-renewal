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
    private final PasswordEncoder passwordEncoder;
    private final Path uploadRootPath;
    private final Path descriptionUploadPath;
    private static final Set<String> EXCLUDED_RANKING_STATUSES = Set.of("CANCELLED", "RETURNED");

    @Autowired
    public SellerService(SellerRepository sellerRepository, ProductRepository productRepository,
                         ProductOptionRepository productOptionRepository,
                         OrderRepository orderRepository, InquiryRepository inquiryRepository,
                         KeywordRepository keywordRepository, PasswordEncoder passwordEncoder,
                         @Value("${app.upload.base-dir:uploads}") String uploadBaseDir) {
        this.sellerRepository = sellerRepository;
        this.productRepository = productRepository;
        this.productOptionRepository = productOptionRepository;
        this.orderRepository = orderRepository;
        this.inquiryRepository = inquiryRepository;
        this.keywordRepository = keywordRepository;
        this.passwordEncoder = passwordEncoder;
        String normalizedBaseDir = (uploadBaseDir == null || uploadBaseDir.isBlank()) ? "uploads" : uploadBaseDir;
        this.uploadRootPath = Paths.get(normalizedBaseDir).toAbsolutePath().normalize();
        this.descriptionUploadPath = this.uploadRootPath.resolve("description");
    }

    // 1.1.1 ???????關?쒎첎?嫄??怨몃룯??
    public Seller registerSeller(Seller seller) {
        if (seller.getPassword() == null || seller.getPassword().isBlank()) {
            throw new IllegalArgumentException("?????癲???????????諛몃마???????戮?Ĳ??");
        }
        seller.setPassword(passwordEncoder.encode(seller.getPassword()));
        return sellerRepository.save(seller);
    }

    // 1.1.2 ??????癲??嶺???(??????????뉖?????筌???轅붽틓????釉랁닑??????????癲??嶺???????ル늉????
    public boolean login(String businessNumber, String password) {
        Seller seller = sellerRepository.findByBusinessNumber(businessNumber);
        return verifyAndUpgradePassword(seller, password);
    }

    // 1.1.3 ?癲??嶺??????諛몃마??
    public void logout(Long sellerId) {
        // ?癲??嶺??????諛몃마???癲??嶺??誘⑦?? ???嚥싲갭큔?源?????????노늾????????轅붽틓????????嶺뚮Ĳ??????????JWT ????影?력?????嶺뚮Ĳ?????? ?????諛몃마?????????????????놁졄.
    }

    // 1.2.1 ?????됰슣類? ??關?쒎첎?嫄??怨몃룯??(?????饔낅떽?????? ???嚥싲갭큔?댁쉻彛??????
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
                .orElseThrow(() -> new IllegalArgumentException("???瑗???筌먲퐢沅??嶺뚢돦堉??????怨룸????덈펲."));
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
    
    
    

    // ???嚥싲갭큔?댁쉻彛???????饔낅떽?????????쇰뭽??
    
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
                throw new IllegalArgumentException("?ъ씠利?媛믪씠 鍮꾩뼱 ?덉뒿?덈떎.");
            }
            if (!dedupe.add(sizeLabel)) {
                throw new IllegalArgumentException("以묐났???ъ씠利덇? ?덉뒿?덈떎: " + sizeLabel);
            }

            int quantity = optionDto.getQuantity() == null ? 0 : optionDto.getQuantity();
            if (quantity < 0) {
                throw new IllegalArgumentException("?ъ씠利??ш퀬??0 ?댁긽?댁뼱???⑸땲??");
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
            throw new IllegalArgumentException("理쒖냼 1媛??댁긽???ъ씠利??듭뀡???꾩슂?⑸땲??");
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
    

    

    // ?????됰슣類? ????癰궽블뀯??(?????饔낅떽?????? ???嚥싲갭큔?댁쉻彛??????
    public ProductDto updateProduct(
            Long productId,
            ProductDto productDto,
            MultipartFile imageFile,
            MultipartFile descriptionImageFile,
            List<ProductOptionDto> optionDtos
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("?怨밸? ?類ｋ궖??筌≪뼚??????곷뮸??덈뼄."));

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
        return new ProductDto(updatedProduct);
    }
    
    


    // ?????紐껊괘????????紐꾩맽 ?????饔낅떽???? ????
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
            throw new RuntimeException("????노듋???????꿔꺂??? ????嚥?????怨몄뵒??醫딆쓧? ?熬곣뫖利든뜏類ｋ렱???????????딅젩.", e);
        }
    }



    // ?????饔낅떽???? ?????癲??嶺??誘⑦??(?? ?癲??嶺???怨???????????癲?????????????????꾨굴????????????)
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
            throw new RuntimeException("?????????꿔꺂??? ????嚥?????怨몄뵒??醫딆쓧? ?熬곣뫖利든뜏類ｋ렱???????????딅젩.", e);
        }
    }
    
    

    // 1.2.3 ?????됰슣類? ????
    public void deleteProduct(Long productId) {
        productRepository.deleteById(productId);
    }

    // 1.2.4 ?????ル뒇??????꿔꺂??씙?猷곗뫀????棺堉?뤃????
    public List<ProductDto> searchProductsByTitle(String title) {
        List<Product> products = productRepository.findByNameContaining(title);
        List<ProductDto> productDtos = products.stream().map(ProductDto::new).toList();
        attachSoldCount(productDtos);
        return productDtos;
    }

    // 1.2.5 ?????諛몃마???????됰슣類? ?饔낅떽????ш낄?뉔뇡?꾩땡沃섏쥓??????怨쀫뮡????
    public List<ProductDto> getAllProducts() {
        List<Product> products = productRepository.findAll();
        List<ProductDto> productDtos = products.stream().map(ProductDto::new).toList();
        attachSoldCount(productDtos);
        return productDtos;
    }

    // 1.2.6 ????노듋??????붺몭?????????????⑥ル츧癲??딅?鍮?
    public List<ProductDto> getProductsByCategory(String categoryName) {
        // ????노듋??????붺몭??????????????諛몃마?????????????????????棺堉?뤃????
        List<Product> products = productRepository.findByCategory(categoryName);
        List<ProductDto> productDtos = products.stream().map(ProductDto::new).toList();
        attachSoldCount(productDtos);
        return productDtos;
    }
    
    //1.2.7 ?????紐껊괘?????癰궽블뀮??ш퀚?????? ???怨쀫뮡????
    public ProductDto getProductById(Long id) {
        System.out.println("?????됰슣類? ???怨쀫뮡??????.. ID: " + id);
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("?????ID???????됰슣類??????怨쀫뮡?????? ????????????놁졄."));
        System.out.println("???怨쀫뮡??????????됰슣類?: " + product.getName());
        ProductDto productDto = new ProductDto(product);
        attachSoldCount(List.of(productDto));
        return productDto;
    }
    
    
    // 1.3.1 ?????節뗭젔???????⑹름?癲ル슢??늴우????轅붽틓???????????饔낅떽???壤굿?戮㏐광??
    @Transactional
    public void processOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID???????⑹름?癲ル슢??늴우??????怨쀫뮡?????? ????????????놁졄."));
        order.setStatus("PROCESSED");
        orderRepository.save(order);
    }

    // 1.3.2 ???????????곸궔???
    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID???????⑹름?癲ル슢??늴우??????怨쀫뮡?????? ????????????놁졄."));
        order.setStatus("CANCELLED");
        orderRepository.save(order);
    }

    // 1.3.3 ????썹땟戮녹?????뚮틯癲??????곸궔???
    @Transactional
    public void processReturn(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID???????⑹름?癲ル슢??늴우??????怨쀫뮡?????? ????????????놁졄."));
        order.setStatus("RETURNED");
        orderRepository.save(order);
    }

    // 1.3.4 ???????????곸궔???
    @Transactional
    public void processExchange(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID???????⑹름?癲ル슢??늴우??????怨쀫뮡?????? ????????????놁졄."));
        order.setStatus("EXCHANGED");
        orderRepository.save(order);
    }


    // 1.3.5 ?轅붽틓?節됰쑏筌믩끃異??????壤???轅붽틓??影?뽧걤??
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
                throw new IllegalArgumentException("사이즈를 선택해 주세요.");
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


    // 1.3.6 ??????????????⑹름?癲ル슢??늴우?????怨쀫뮡????
    public List<Order> getOrdersBySeller(Long sellerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("??????? ?饔낅떽???????????????깅즽????????놁졄."));
        return orderRepository.findByProduct_Seller(seller);
    }

    // 1.4.1 ???嶺??????? ??關?쒎첎?嫄??怨몃룯??
    public void answerInquiry(Long inquiryId, String answer) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID?????嶺???????ㅼ굣?? ???怨쀫뮡?????? ????????????놁졄."));
        inquiry.setAnswer(answer);
        inquiry.setSellerName("SOS ????ㅳ늾?온??");
        inquiry.setAnsweredDate(LocalDateTime.now());
        inquiryRepository.save(inquiry);
    }


    // 1.4.2 ???嶺??????? ????
    public void deleteInquiryAnswer(Long inquiryId) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID?????嶺???????ㅼ굣?? ???怨쀫뮡?????? ????????????놁졄."));
        inquiry.setAnswer(null);
        inquiryRepository.save(inquiry);
    }

    // 1.4.3 ???嶺??????? ????癰궽블뀯??
    public void updateInquiryAnswer(Long inquiryId, String newAnswer) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("?????ID?????嶺???????ㅼ굣?? ???怨쀫뮡?????? ????????????놁졄."));
        inquiry.setAnswer(newAnswer);
        inquiryRepository.save(inquiry);
    }

    // 1.5.1 ???嚥싲갭큔?댁쉻彛???????곸궔???
    public void manageKeyword(String keyword, boolean add) {
        if (add) {
            // ?????嚥싲갭큔?댁쉻彛?????熬곣뫖利?????????
            Keyword newKeyword = new Keyword(keyword, ""); // ?????????諛몃마?????????????????????嚥싲갭큔???
            keywordRepository.save(newKeyword);
        } else {
            // ???嚥싲갭큔?댁쉻彛??????
            Optional<Keyword> keywordToDelete = keywordRepository.findByKeyword(keyword);
            if (keywordToDelete.isPresent()) {
                keywordRepository.delete(keywordToDelete.get());
            } else {
                throw new IllegalArgumentException("????????嚥싲갭큔?댁쉻彛??? ???怨쀫뮡?????? ????????????놁졄.");
            }
        }
    }


    // 1.6.1 ??????????뉖?????筌???轅붽틓????釉띿쭋???????????怨쀫뮡????
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

