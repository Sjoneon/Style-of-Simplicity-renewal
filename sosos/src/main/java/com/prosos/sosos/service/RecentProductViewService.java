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
        // 마이페이지 노출 범위만 고려해 최근 20건으로 제한한다.
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
                    // 같은 사용자-상품 조합이 없을 때만 새 레코드를 만든다.
                    RecentProductView created = new RecentProductView();
                    created.setUser(user);
                    created.setProduct(product);
                    return created;
                });

        // 기존 레코드가 있으면 조회 시각만 갱신해 "최근순" 정렬을 유지한다.
        recentProductView.setViewedAt(LocalDateTime.now());
        recentProductViewRepository.save(recentProductView);
    }
}
