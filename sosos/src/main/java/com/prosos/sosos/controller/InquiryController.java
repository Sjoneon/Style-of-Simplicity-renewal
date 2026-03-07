package com.prosos.sosos.controller;

import com.prosos.sosos.dto.InquiryDto;
import com.prosos.sosos.model.Inquiry;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.model.User;
import com.prosos.sosos.repository.InquiryRepository;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {

    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public InquiryController(
            InquiryRepository inquiryRepository,
            UserRepository userRepository,
            ProductRepository productRepository
    ) {
        this.inquiryRepository = inquiryRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public ResponseEntity<List<InquiryDto>> getInquiries() {
        List<InquiryDto> inquiries = inquiryRepository.findAll().stream()
                .map(inquiry -> new InquiryDto(
                        inquiry.getId(),
                        inquiry.getUserId(),
                        userRepository.findById(inquiry.getUserId())
                                .map(User::getName)
                                .orElse("Unknown"),
                        inquiry.getTitle(),
                        inquiry.getContent(),
                        inquiry.getAnswer(),
                        inquiry.getCreatedDate(),
                        inquiry.getAnsweredDate()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(inquiries);
    }

    @GetMapping("/user")
    public ResponseEntity<List<Inquiry>> getUserInquiries(HttpSession session) {
        User user = (User) session.getAttribute("loggedInUser");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Inquiry> inquiries = inquiryRepository.findByUserId(user.getId());
        return ResponseEntity.ok(inquiries);
    }

    @PostMapping
    public ResponseEntity<?> createInquiry(HttpSession session, @RequestBody Inquiry inquiry) {
        User user = (User) session.getAttribute("loggedInUser");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long productId = inquiry.getProductId();
        if (productId != null && !productRepository.existsById(productId)) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "존재하지 않는 상품입니다. 상품 상세에서 다시 문의해 주세요."));
        }

        inquiry.setUserId(user.getId());
        inquiry.setCreatedDate(LocalDateTime.now());
        inquiryRepository.save(inquiry);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{inquiryId}/answer")
    public ResponseEntity<Void> answerInquiry(@PathVariable Long inquiryId, @RequestBody String answer, HttpSession session) {
        Seller seller = (Seller) session.getAttribute("loggedInUser");
        if (seller == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("문의 ID를 찾을 수 없습니다."));

        inquiry.setAnswer(answer);
        inquiry.setSellerName("SOS 운영팀");
        inquiry.setAnsweredDate(LocalDateTime.now());
        inquiryRepository.save(inquiry);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{inquiryId}")
    public ResponseEntity<Void> deleteInquiry(@PathVariable Long inquiryId, HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("문의 ID를 찾을 수 없습니다."));

        if (loggedInUser instanceof Seller) {
            inquiryRepository.deleteById(inquiryId);
            return ResponseEntity.noContent().build();
        }

        if (loggedInUser instanceof User) {
            User user = (User) loggedInUser;
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
        Seller seller = (Seller) session.getAttribute("loggedInUser");
        if (seller == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("문의 ID를 찾을 수 없습니다."));

        inquiry.setAnswer(newAnswer);
        inquiry.setAnsweredDate(LocalDateTime.now());
        inquiryRepository.save(inquiry);
        return ResponseEntity.ok().build();
    }
}
