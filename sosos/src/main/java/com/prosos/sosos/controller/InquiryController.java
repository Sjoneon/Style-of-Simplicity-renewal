package com.prosos.sosos.controller;

import com.prosos.sosos.dto.InquiryCreateRequest;
import com.prosos.sosos.dto.InquiryDto;
import com.prosos.sosos.model.Inquiry;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.model.User;
import com.prosos.sosos.repository.InquiryRepository;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.UserRepository;
import com.prosos.sosos.service.NotificationService;
import com.prosos.sosos.service.storage.FileStorageService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {

    private static final String DEFAULT_CATEGORY = "SERVICE";
    private static final Set<String> ALLOWED_CATEGORIES = Set.of(
            "SHIPPING",
            "ORDER_PAYMENT",
            "CANCEL_EXCHANGE_REFUND",
            "ACCOUNT_INFO",
            "PRODUCT_CHECK",
            "SERVICE",
            "SITE_USAGE"
    );
    private static final long INQUIRY_IMAGE_MAX_SIZE_BYTES = 5L * 1024 * 1024;
    private static final int INQUIRY_IMAGE_MIN_WIDTH = 200;
    private static final int INQUIRY_IMAGE_MIN_HEIGHT = 200;
    private static final int INQUIRY_IMAGE_MAX_WIDTH = 6000;
    private static final int INQUIRY_IMAGE_MAX_HEIGHT = 6000;

    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;

    public InquiryController(
            InquiryRepository inquiryRepository,
            UserRepository userRepository,
            ProductRepository productRepository,
            NotificationService notificationService,
            FileStorageService fileStorageService
    ) {
        this.inquiryRepository = inquiryRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.notificationService = notificationService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<List<InquiryDto>> getInquiries(HttpSession session) {
        Seller seller = resolveLoggedInSeller(session);
        if (seller == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<InquiryDto> inquiries = inquiryRepository.findAll().stream()
                .filter(inquiry -> canSellerAccessInquiry(inquiry, seller.getId()))
                .map(this::toInquiryDto)
                .toList();

        return ResponseEntity.ok(inquiries);
    }

    @GetMapping("/user")
    public ResponseEntity<List<Inquiry>> getUserInquiries(HttpSession session) {
        User user = resolveLoggedInUser(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Inquiry> inquiries = inquiryRepository.findByUserId(user.getId());
        return ResponseEntity.ok(inquiries);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createInquiryAsJson(HttpSession session, @RequestBody InquiryCreateRequest request) {
        return createInquiryInternal(session, request, null);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createInquiryAsMultipart(
            HttpSession session,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "productId", required = false) Long productId,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "image", required = false) MultipartFile imageFile
    ) {
        InquiryCreateRequest request = new InquiryCreateRequest();
        request.setTitle(title);
        request.setContent(content);
        request.setProductId(productId);
        request.setCategory(category);
        return createInquiryInternal(session, request, imageFile);
    }

    private ResponseEntity<?> createInquiryInternal(HttpSession session, InquiryCreateRequest request, MultipartFile imageFile) {
        User user = resolveLoggedInUser(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String title = trimToEmpty(request.getTitle());
        String content = trimToEmpty(request.getContent());
        if (title.isBlank() || content.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "문의 제목과 내용을 입력해 주세요."));
        }

        Long productId = request.getProductId();
        if (productId != null && !productRepository.existsById(productId)) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "존재하지 않는 상품입니다. 상품 상세에서 다시 문의해 주세요."));
        }

        String category = normalizeCategory(request.getCategory());

        Inquiry inquiry = new Inquiry();
        inquiry.setUserId(user.getId());
        inquiry.setProductId(productId);
        inquiry.setCategory(category);
        inquiry.setTitle(title);
        inquiry.setContent(content);
        inquiry.setCreatedDate(LocalDateTime.now());

        if (imageFile != null && !imageFile.isEmpty()) {
            String imageValidationMessage = validateInquiryImage(imageFile);
            if (imageValidationMessage != null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", imageValidationMessage));
            }
            String imageUrl = fileStorageService.upload(imageFile, "inquiries", "inquiry-image");
            inquiry.setImageUrl(imageUrl);
        }

        inquiryRepository.save(inquiry);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{inquiryId}/answer")
    public ResponseEntity<Void> answerInquiry(@PathVariable Long inquiryId, @RequestBody String answer, HttpSession session) {
        Seller seller = resolveLoggedInSeller(session);
        if (seller == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Inquiry inquiry = findInquiryOrThrow(inquiryId);
        if (!canSellerAccessInquiry(inquiry, seller.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        boolean existedAnswer = inquiry.getAnswer() != null && !inquiry.getAnswer().trim().isEmpty();
        inquiry.setAnswer(answer);
        inquiry.setSellerName("SOS 운영자");
        inquiry.setAnsweredDate(LocalDateTime.now());
        inquiryRepository.save(inquiry);
        notificationService.notifyInquiryAnswered(inquiry, existedAnswer);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{inquiryId}")
    public ResponseEntity<Void> deleteInquiry(@PathVariable Long inquiryId, HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Inquiry inquiry = findInquiryOrThrow(inquiryId);

        if (loggedInUser instanceof Seller seller) {
            if (!canSellerAccessInquiry(inquiry, seller.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            inquiryRepository.deleteById(inquiryId);
            return ResponseEntity.noContent().build();
        }

        if (loggedInUser instanceof User user) {
            if (!inquiry.getUserId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            inquiryRepository.deleteById(inquiryId);
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PutMapping("/{inquiryId}/answer/update")
    public ResponseEntity<Void> updateInquiryAnswer(@PathVariable Long inquiryId, @RequestBody String newAnswer, HttpSession session) {
        Seller seller = resolveLoggedInSeller(session);
        if (seller == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Inquiry inquiry = findInquiryOrThrow(inquiryId);
        if (!canSellerAccessInquiry(inquiry, seller.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        inquiry.setAnswer(newAnswer);
        inquiry.setAnsweredDate(LocalDateTime.now());
        inquiryRepository.save(inquiry);
        notificationService.notifyInquiryAnswered(inquiry, true);
        return ResponseEntity.ok().build();
    }

    private InquiryDto toInquiryDto(Inquiry inquiry) {
        return new InquiryDto(
                inquiry.getId(),
                inquiry.getUserId(),
                inquiry.getProductId(),
                userRepository.findById(inquiry.getUserId())
                        .map(User::getName)
                        .orElse("Unknown"),
                normalizeCategory(inquiry.getCategory()),
                inquiry.getTitle(),
                inquiry.getContent(),
                inquiry.getImageUrl(),
                inquiry.getAnswer(),
                inquiry.getCreatedDate(),
                inquiry.getAnsweredDate()
        );
    }

    private Inquiry findInquiryOrThrow(Long inquiryId) {
        return inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("문의 ID를 찾을 수 없습니다."));
    }

    private Seller resolveLoggedInSeller(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof Seller seller) {
            return seller;
        }
        return null;
    }

    private User resolveLoggedInUser(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof User user) {
            return user;
        }
        return null;
    }

    private boolean canSellerAccessInquiry(Inquiry inquiry, Long sellerId) {
        if (inquiry.getProductId() == null) {
            return true;
        }
        return productRepository.findById(inquiry.getProductId())
                .map(Product::getSeller)
                .map(Seller::getId)
                .filter(ownerSellerId -> ownerSellerId.equals(sellerId))
                .isPresent();
    }

    private String validateInquiryImage(MultipartFile imageFile) {
        String contentType = trimToEmpty(imageFile.getContentType()).toLowerCase();
        if (!contentType.startsWith("image/")) {
            return "이미지 파일만 첨부할 수 있습니다.";
        }

        if (imageFile.getSize() > INQUIRY_IMAGE_MAX_SIZE_BYTES) {
            return "문의 이미지는 5MB 이하만 업로드할 수 있습니다.";
        }

        // 프론트 검증 우회 요청을 막기 위해 서버에서 해상도 범위를 다시 검사한다.
        try (InputStream inputStream = imageFile.getInputStream()) {
            BufferedImage bufferedImage = ImageIO.read(inputStream);
            if (bufferedImage == null) {
                return "이미지 형식을 읽을 수 없습니다. PNG/JPG/WEBP 파일로 다시 시도해 주세요.";
            }

            int width = bufferedImage.getWidth();
            int height = bufferedImage.getHeight();
            if (width < INQUIRY_IMAGE_MIN_WIDTH || height < INQUIRY_IMAGE_MIN_HEIGHT) {
                return "이미지 해상도는 최소 200x200px 이상이어야 합니다.";
            }
            if (width > INQUIRY_IMAGE_MAX_WIDTH || height > INQUIRY_IMAGE_MAX_HEIGHT) {
                return "이미지 해상도는 최대 6000x6000px 이하여야 합니다.";
            }
        } catch (IOException e) {
            return "이미지 파일 검증 중 오류가 발생했습니다. 다시 시도해 주세요.";
        }

        return null;
    }

    // 저장 코드는 영어로 통일하되, 입력 변형(한글/별칭)은 여기서 매핑한다.
    private String normalizeCategory(String rawCategory) {
        String normalized = trimToEmpty(rawCategory)
                .toUpperCase()
                .replace(" ", "")
                .replace("-", "")
                .replace("/", "_");

        if (normalized.equals("배송") || normalized.equals("SHIPPING")) {
            return "SHIPPING";
        }
        if (normalized.equals("주문결제") || normalized.equals("ORDER_PAYMENT") || normalized.equals("ORDERPAYMENT")) {
            return "ORDER_PAYMENT";
        }
        if (normalized.equals("취소교환환불") || normalized.equals("CANCEL_EXCHANGE_REFUND") || normalized.equals("CANCELEXCHANGEREFUND")) {
            return "CANCEL_EXCHANGE_REFUND";
        }
        if (normalized.equals("회원정보") || normalized.equals("ACCOUNT_INFO") || normalized.equals("ACCOUNTINFO") || normalized.equals("ACCOUNT")) {
            return "ACCOUNT_INFO";
        }
        if (normalized.equals("상품확인") || normalized.equals("PRODUCT_CHECK") || normalized.equals("PRODUCTCHECK")) {
            return "PRODUCT_CHECK";
        }
        if (normalized.equals("서비스") || normalized.equals("SERVICE")) {
            return "SERVICE";
        }
        if (normalized.equals("사용문의") || normalized.equals("사이트사용") || normalized.equals("SITE_USAGE") || normalized.equals("SITEUSAGE")) {
            return "SITE_USAGE";
        }

        return ALLOWED_CATEGORIES.contains(normalized) ? normalized : DEFAULT_CATEGORY;
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
