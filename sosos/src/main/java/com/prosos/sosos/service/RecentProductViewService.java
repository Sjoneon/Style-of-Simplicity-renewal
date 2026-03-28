package com.prosos.sosos.service;

import com.prosos.sosos.dto.RecentProductViewDto;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.model.RecentProductView;
import com.prosos.sosos.model.User;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.RecentProductViewRepository;
import com.prosos.sosos.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RecentProductViewService {

    private final RecentProductViewRepository recentProductViewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public RecentProductViewService(
            RecentProductViewRepository recentProductViewRepository,
            UserRepository userRepository,
            ProductRepository productRepository
    ) {
        this.recentProductViewRepository = recentProductViewRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<RecentProductViewDto> getMyRecentProducts(Long userId) {
        // 마이페이지 노출 범위 기준 최근 본 20건 조회
        return recentProductViewRepository.findTop20ByUserIdOrderByViewedAtDesc(userId)
                .stream()
                .map(RecentProductViewDto::new)
                .toList();
    }

    @Transactional
    public void recordView(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        RecentProductView recentProductView = recentProductViewRepository
                .findByUserIdAndProductId(userId, productId)
                .orElseGet(() -> {
                    // 사용자-상품 조합 미존재 시 신규 레코드 생성
                    RecentProductView created = new RecentProductView();
                    created.setUser(user);
                    created.setProduct(product);
                    return created;
                });

        // 기존 레코드 조회 시각만 갱신, 최근순 정렬 유지
        recentProductView.setViewedAt(LocalDateTime.now());
        recentProductViewRepository.save(recentProductView);
    }
}
