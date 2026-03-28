package com.prosos.sosos.service;

import com.prosos.sosos.dto.MainBannerDto;
import com.prosos.sosos.model.MainBanner;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.repository.MainBannerRepository;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.SellerRepository;
import com.prosos.sosos.service.storage.FileStorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;

@Service
public class MainBannerService {

    private final MainBannerRepository mainBannerRepository;
    private final SellerRepository sellerRepository;
    private final ProductRepository productRepository;
    private final FileStorageService fileStorageService;

    public MainBannerService(
            MainBannerRepository mainBannerRepository,
            SellerRepository sellerRepository,
            ProductRepository productRepository,
            FileStorageService fileStorageService
    ) {
        this.mainBannerRepository = mainBannerRepository;
        this.sellerRepository = sellerRepository;
        this.productRepository = productRepository;
        this.fileStorageService = fileStorageService;
    }

    public List<MainBannerDto> getActiveBanners() {
        return mainBannerRepository.findByActiveTrueOrderByDisplayOrderAscIdDesc()
                .stream()
                .map(MainBannerDto::new)
                .toList();
    }

    public List<MainBannerDto> getBannersBySeller(Long sellerId) {
        return mainBannerRepository.findBySeller_IdOrderByDisplayOrderAscIdDesc(sellerId)
                .stream()
                .map(MainBannerDto::new)
                .toList();
    }

    @Transactional
    public MainBannerDto createBanner(
            Long sellerId,
            String title,
            String subtitle,
            Long targetProductId,
            Integer displayOrder,
            MultipartFile imageFile
    ) {
        if (imageFile == null || imageFile.isEmpty()) {
            throw new IllegalArgumentException("배너 이미지를 선택해 주세요.");
        }

        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("판매자 정보를 찾을 수 없습니다."));

        if (targetProductId != null && !productRepository.existsById(targetProductId)) {
            throw new IllegalArgumentException("연결할 상품을 찾을 수 없습니다.");
        }

        MainBanner banner = new MainBanner();
        banner.setSeller(seller);
        banner.setTitle(trimToNull(title));
        banner.setSubtitle(trimToNull(subtitle));
        banner.setTargetProductId(targetProductId);
        banner.setDisplayOrder(displayOrder == null ? 0 : Math.max(displayOrder, 0));
        banner.setActive(true);
        banner.setImageUrl(saveBannerImageFile(imageFile));

        MainBanner savedBanner = mainBannerRepository.save(banner);
        return new MainBannerDto(savedBanner);
    }

    @Transactional
    public void deleteBanner(Long bannerId, Long sellerId) {
        MainBanner banner = mainBannerRepository.findById(bannerId)
                .orElseThrow(() -> new IllegalArgumentException("배너를 찾을 수 없습니다."));

        if (!Objects.equals(banner.getSeller().getId(), sellerId)) {
            throw new IllegalArgumentException("본인이 등록한 배너만 삭제할 수 있습니다.");
        }

        mainBannerRepository.delete(banner);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String saveBannerImageFile(MultipartFile imageFile) {
        return fileStorageService.upload(imageFile, "banners", "main-banner");
    }
}
