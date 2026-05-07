package com.prosos.sosos.service;

import com.prosos.sosos.dto.DiscoveryTabDto;
import com.prosos.sosos.model.DiscoveryTab;
import com.prosos.sosos.repository.DiscoveryTabRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
// 홈 탐색 탭의 기본값 보장, 순서 정규화, CRUD를 담당한다.
public class DiscoveryTabService {

    private final DiscoveryTabRepository discoveryTabRepository;

    public DiscoveryTabService(DiscoveryTabRepository discoveryTabRepository) {
        this.discoveryTabRepository = discoveryTabRepository;
    }

    @Transactional
    public List<DiscoveryTabDto> getActiveTabs() {
        ensureDefaultTabs();
        normalizeDisplayOrders();
        return discoveryTabRepository.findByActiveTrueOrderByDisplayOrderAscIdAsc()
                .stream()
                .map(DiscoveryTabDto::new)
                .toList();
    }

    @Transactional
    public List<DiscoveryTabDto> getManageTabs() {
        ensureDefaultTabs();
        normalizeDisplayOrders();
        return discoveryTabRepository.findAllByOrderByDisplayOrderAscIdAsc()
                .stream()
                .map(DiscoveryTabDto::new)
                .toList();
    }

    @Transactional
    public DiscoveryTabDto createTab(String label, Integer displayOrder, Boolean active) {
        ensureDefaultTabs();
        String normalizedLabel = normalizeLabel(label);

        DiscoveryTab tab = new DiscoveryTab();
        tab.setTabKey(generateUniqueKey(normalizedLabel));
        tab.setLabel(normalizedLabel);
        tab.setDisplayOrder(displayOrder == null ? nextDisplayOrder() : Math.max(displayOrder, 0));
        tab.setActive(active == null ? true : active);

        discoveryTabRepository.save(tab);
        normalizeDisplayOrders();
        return new DiscoveryTabDto(tab);
    }

    @Transactional
    public DiscoveryTabDto updateTab(Long tabId, String label, Integer displayOrder, Boolean active) {
        ensureDefaultTabs();
        DiscoveryTab tab = discoveryTabRepository.findById(tabId)
                .orElseThrow(() -> new IllegalArgumentException("탐색 탭 정보를 찾을 수 없습니다."));

        if (label != null) {
            tab.setLabel(normalizeLabel(label));
        }
        if (displayOrder != null) {
            tab.setDisplayOrder(Math.max(displayOrder, 0));
        }
        if (active != null) {
            tab.setActive(active);
        }

        discoveryTabRepository.save(tab);
        normalizeDisplayOrders();
        return new DiscoveryTabDto(tab);
    }

    @Transactional
    public void deleteTab(Long tabId) {
        ensureDefaultTabs();
        DiscoveryTab tab = discoveryTabRepository.findById(tabId)
                .orElseThrow(() -> new IllegalArgumentException("탐색 탭 정보를 찾을 수 없습니다."));

        long activeTabCount = discoveryTabRepository.findByActiveTrueOrderByDisplayOrderAscIdAsc().size();
        if (Boolean.TRUE.equals(tab.getActive()) && activeTabCount <= 1) {
            throw new IllegalArgumentException("최소 1개의 활성 탐색 탭은 유지해야 합니다.");
        }

        discoveryTabRepository.delete(tab);
        normalizeDisplayOrders();
    }

    private void ensureDefaultTabs() {
        // 최초 실행 시 탭이 비어 있으면 기본 탭 세트를 자동 생성한다.
        if (discoveryTabRepository.count() > 0) {
            return;
        }

        List<DiscoveryTab> defaults = new ArrayList<>();
        defaults.add(buildDefault("starter", "처음 시작", 0));
        defaults.add(buildDefault("gift", "선물", 1));
        defaults.add(buildDefault("new", "신상", 2));
        defaults.add(buildDefault("basic", "기본템", 3));
        defaults.add(buildDefault("work", "출근 룩", 4));
        discoveryTabRepository.saveAll(defaults);
    }

    private DiscoveryTab buildDefault(String tabKey, String label, int displayOrder) {
        DiscoveryTab tab = new DiscoveryTab();
        tab.setTabKey(tabKey);
        tab.setLabel(label);
        tab.setDisplayOrder(displayOrder);
        tab.setActive(true);
        return tab;
    }

    private int nextDisplayOrder() {
        return discoveryTabRepository.findAllByOrderByDisplayOrderAscIdAsc()
                .stream()
                .map(tab -> tab.getDisplayOrder() == null ? 0 : tab.getDisplayOrder())
                .max(Integer::compareTo)
                .orElse(-1) + 1;
    }

    private void normalizeDisplayOrders() {
        // 삭제/삽입 이후 순번 공백이 생기지 않도록 0부터 재정렬한다.
        List<DiscoveryTab> tabs = discoveryTabRepository.findAllByOrderByDisplayOrderAscIdAsc();
        boolean changed = false;
        int nextOrder = 0;

        for (DiscoveryTab tab : tabs) {
            Integer currentOrder = tab.getDisplayOrder();
            if (currentOrder == null || currentOrder != nextOrder) {
                tab.setDisplayOrder(nextOrder);
                changed = true;
            }
            nextOrder++;
        }

        if (changed) {
            discoveryTabRepository.saveAll(tabs);
        }
    }

    private String normalizeLabel(String label) {
        if (label == null || label.trim().isEmpty()) {
            throw new IllegalArgumentException("탭 이름을 입력해 주세요.");
        }
        return label.trim();
    }

    private String generateUniqueKey(String label) {
        // tabKey 충돌 시 숫자 접미사를 붙여 유니크 값을 만든다.
        String base = slugify(label);
        String candidate = base;
        int suffix = 2;
        while (discoveryTabRepository.existsByTabKey(candidate)) {
            candidate = base + "-" + suffix;
            suffix++;
        }
        return candidate;
    }

    private String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (normalized.isBlank()) {
            return "custom";
        }
        return normalized;
    }
}
