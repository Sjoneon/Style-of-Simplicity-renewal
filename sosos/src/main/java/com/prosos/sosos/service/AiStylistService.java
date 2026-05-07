package com.prosos.sosos.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.prosos.sosos.dto.AiStylistChatRequest;
import com.prosos.sosos.dto.AiStylistChatResponse;
import com.prosos.sosos.model.Keyword;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AiStylistService {

    private static final Set<String> BLOCKED_TERMS = Set.of("porn", "nude", "nsfw");
    private static final Set<String> HARMFUL_TERMS = Set.of(
            "slave", "violence", "hate",
            "노예", "혐오", "폭력", "강간", "고문"
    );
    private static final Set<String> EXTERNAL_TERMS = Set.of(
            "무신사", "29cm", "지그재그", "에이블리", "쿠팡", "http://", "https://"
    );
    private static final Set<String> RESET_TERMS = Set.of("초기화", "챗초기화", "리셋", "reset");

    private static final Set<String> OUTFIT_TERMS = Set.of(
            "코디", "룩", "스타일", "옷", "복장", "아웃핏", "outfit", "style", "look",
            "\u8084\ubdbe\ubd52", "\u7337\u003f", "\u003f\u317d\u003f\u003f\u003f", "\u003f\uacf9\ube2f\u003f\u003f"
    );
    private static final Set<String> TOP_HINTS = Set.of(
            "상의", "티", "티셔츠", "셔츠", "반팔", "긴팔", "맨투맨", "니트", "top", "shirt", "tee",
            "\u003f\uacf8\uc4fd", "\u003f\ubdbf\ud229", "\u003f\uacd7\ub01b\uf9e5\u003f", "\u8adb\uc111\ub64f", "\u6e72\ub304\ub64f"
    );
    private static final Set<String> BOTTOM_HINTS = Set.of(
            "하의", "바지", "반바지", "긴바지", "슬랙스", "데님", "청바지", "shorts", "pants", "jeans", "bottom",
            "\u003f\uc10f\uc4fd", "\u8adb\ubdbf\u003f", "\u8adb\uc10e\uceee\uf9de\u0080", "\u6e72\ub300\uceee\uf9de\u0080", "\u003f\u044a\ud229", "\u003f\u0449\uc613\u003f\u003f"
    );
    private static final Set<String> OUTER_HINTS = Set.of(
            "외투", "아우터", "자켓", "코트", "패딩", "후드집업", "바람막이", "outer", "jacket", "coat",
            "\u003f\uafa9\uc2a6\u003f\u003f", "\u8adb\ubdbe\uc5fa\uf9cd\ub431\uc520", "\u003f\uba85\ub2fe", "\u003f\uba2f\ud3c6", "\u8084\ubdc0\ub4c3"
    );
    private static final Set<String> SHOES_HINTS = Set.of(
            "신발", "스니커즈", "로퍼", "부츠", "운동화", "shoe", "sneaker", "loafer", "boots",
            "\u003f\uc88a\ucefb", "\u003f\u317b\ub572\u800c\u317c\ucaf0", "\u6fe1\uc497\ub741", "\u907a\u0080\uf9e5\u003f", "\u003f\ub300\ub8de\u003f\u003f"
    );
    private static final Set<String> BAG_HINTS = Set.of(
            "가방", "백", "토트", "숄더", "크로스백", "백팩", "bag", "tote", "backpack", "shoulder bag",
            "\u5a9b\u0080\u8adb\u003f", "\u8adb\u003f", "\u003f\uc88f\ub4c3", "\u8adb\uae4a\ub665"
    );
    private static final Set<String> ACC_HINTS = Set.of(
            "악세", "액세", "액세서리", "악세서리", "반지", "목걸이", "귀걸이", "팔찌", "acc", "accessory",
            "\u003f\u226a\uaf6d\u003f\uc495\u2501", "\u003f\ub086\uaf6d\u003f\uc495\u2501"
    );

    private static final Set<String> CLOTHING_ONLY_TERMS = Set.of("의류만", "옷만", "\u003f\uc10e\uca9f\uf9cd\u003f", "\u003f\ub8f8\ucb54");
    private static final Set<String> NEGATIVE_TERMS = Set.of("빼고", "말고", "제외", "빼줘", "제외해", "제외하고", "\u936e\uc1e8\ud02c", "\uf9cd\uba2d\ud02c", "\u003f\uc496\uc1c5");
    private static final Set<String> MERGE_TERMS = Set.of("같이", "도", "추가", "+", "함께", "\u5a9b\uc208\uc520");
    private static final Set<String> REFINEMENT_TERMS = Set.of(
            "예산", "만원", "이하", "맞춰", "색", "컬러", "핏", "체형", "키", "몸무게", "계절", "봄", "여름", "가을", "겨울",
            "\u003f\ub349\uad9b", "\uf9cd\ub6af\uc35d", "\u003f\ub304\ube2f", "\uf9cd\uc68e\ub5a0", "\uf9e3\ub304\uc08e", "\u003f\uc88e\ubd6a", "\u6028\uafa9\uc805"
    );

    private static final Set<String> COLOR_TERMS = Set.of(
            "블랙", "화이트", "네이비", "그레이", "베이지", "카키", "브라운",
            "black", "white", "navy", "gray", "grey", "beige", "khaki", "brown",
            "\u91c9\ubdbe\uc613"
    );
    private static final Set<String> SEASON_TERMS = Set.of(
            "봄", "여름", "가을", "겨울", "spring", "summer", "autumn", "fall", "winter", "ss", "fw", "f/w",
            "\u904a\u003f", "\u003f\u0449\ucaeb", "\u5a9b\u0080\u003f\u003f", "\u5bc3\u2465\uc2b1"
    );

    private static final Set<String> EXCLUDED_PRODUCT_NAME_TERMS = Set.of(
            "스모크 상품", "smoke product", "debug product"
    );
    private static final Set<String> EXCLUDED_PRODUCT_DESC_TERMS = Set.of(
            "debug", "테스트 업로드", "가격 조정 테스트"
    );
    private static final Set<String> NON_CLOTHING_CATEGORIES = Set.of("SHOES", "BAG", "ACC");

    private static final Map<String, Set<String>> SEASON_SIGNALS = Map.of(
            "봄", Set.of("봄", "spring", "간절기", "\u904a\u003f"),
            "여름", Set.of("여름", "summer", "반팔", "반바지", "린넨", "시원", "\u003f\u0449\ucaeb"),
            "가을", Set.of("가을", "autumn", "fall", "간절기", "fw", "f/w", "\u5a9b\u0080\u003f\u003f"),
            "겨울", Set.of("겨울", "winter", "기모", "코트", "패딩", "플리스", "따뜻", "\u5bc3\u2465\uc2b1")
    );

    private static final Map<String, Set<String>> STYLE_KEYWORD_GROUPS = Map.of(
            "HIP", Set.of("힙", "힙한", "트렌디", "스트릿", "감각적인", "유니크", "개성있는", "핫한", "요즘느낌", "요즘 느낌", "mz스타일", "m/z", "스타일리시", "인싸템"),
            "CHIC", Set.of("시크", "시크한", "모던", "모던한", "도시적인", "미니멀", "세련된", "쿨한", "고급스러운"),
            "CASUAL", Set.of("편안한", "편한", "데일리", "베이직", "꾸안꾸", "내추럴", "심플한", "라이트한", "캐주얼"),
            "UNIQUE", Set.of("독특한", "실험적인", "아방가르드", "포인트있는", "포인트 있는", "그래픽한", "감성적인"),
            "FORMAL", Set.of("깔끔한", "단정한", "클래식", "포멀", "포멀한", "비즈니스", "단아한"),
            "LOVELY", Set.of("귀여운", "러블리", "소녀감성", "아기자기", "부드러운", "파스텔톤", "파스텔")
    );

    private static final Map<String, String> STYLE_GROUP_LABELS = Map.of(
            "HIP", "힙/스트릿",
            "CHIC", "시크/도회적",
            "CASUAL", "캐주얼/데일리",
            "UNIQUE", "유니크/포인트",
            "FORMAL", "포멀/깔끔",
            "LOVELY", "러블리"
    );

    private final ProductRepository productRepository;
    @SuppressWarnings("unused")
    private final ObjectMapper objectMapper;

    @Value("${app.ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.ai.gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${app.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String geminiBaseUrl;

    @Value("${app.ai.max-input-length:180}")
    private int maxInputLength;

    @Value("${app.ai.max-candidates:5}")
    private int maxCandidates;

    @Value("${app.ai.free-tier.remote-enabled:false}")
    private boolean remoteEnabled;

    @Value("${app.ai.free-tier.cooldown-seconds:45}")
    private int remoteCooldownSeconds;

    @Value("${app.ai.llm-explanation.enabled:true}")
    private boolean llmExplanationEnabled;

    @Value("${app.ai.llm-explanation.max-output-tokens:180}")
    private int llmExplanationMaxOutputTokens;

    private volatile Instant remoteCooldownUntil = Instant.EPOCH;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public AiStylistService(ProductRepository productRepository, ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public AiStylistChatResponse chat(String rawMessage) {
        return chat(rawMessage, List.of());
    }

    @Transactional(readOnly = true)
    public AiStylistChatResponse chat(String rawMessage, List<AiStylistChatRequest.HistoryItem> history) {
        String message = normalize(rawMessage);
        if (message.isBlank()) {
            throw new IllegalArgumentException("추천받고 싶은 스타일을 입력해 주세요.");
        }
        if (message.length() > maxInputLength) {
            return new AiStylistChatResponse("요청이 너무 깁니다. 180자 이내로 줄여 주세요.", true, List.of());
        }

        String latest = lower(message);
        if (isResetCommand(latest)) {
            return new AiStylistChatResponse("대화를 초기화했어요. 원하는 스타일을 다시 알려주세요.", false, List.of());
        }
        if (containsAny(latest, BLOCKED_TERMS) || containsAny(latest, HARMFUL_TERMS)) {
            return new AiStylistChatResponse("혐오/폭력 또는 유해한 맥락은 도와드릴 수 없어요.", true, List.of());
        }
        if (containsAny(latest, EXTERNAL_TERMS)) {
            return new AiStylistChatResponse("외부 쇼핑몰 검색은 지원하지 않아요. 등록된 상품 기준으로 추천해드릴게요.", true, List.of());
        }

        String historyText = lower(buildHistoryContext(history));
        Intent latestIntent = parseIntent(latest);
        Intent historyIntent = parseIntent(historyText);
        Set<String> latestSeasonFromHistory = extractLatestSeasonFromHistory(history);
        Intent mergedIntent = mergeIntent(latest, historyText, latestIntent, historyIntent, latestSeasonFromHistory);

        List<ScoredProduct> scoredProducts = scoreCandidates(latest, historyText, mergedIntent);
        if (scoredProducts.isEmpty()) {
            if (looksLikeFashionRequest(latest, historyText)) {
                return new AiStylistChatResponse(
                        "조건에 맞는 상품을 찾지 못했어요. 색상/핏/예산을 조금만 바꿔서 다시 요청해 주세요.",
                        false,
                        List.of()
                );
            }
            return new AiStylistChatResponse(
                    "이 챗봇은 의류 코디 추천만 지원합니다. 예: \"봄 출근룩 추천\", \"반팔+반바지 추천\"",
                    true,
                    List.of()
            );
        }

        List<ScoredProduct> selected = selectWithCategoryCoverage(scoredProducts, mergedIntent.requestedCategories());
        List<AiStylistChatResponse.RecommendedProduct> recommended = selected.stream()
                .limit(Math.max(1, maxCandidates))
                .map(item -> new AiStylistChatResponse.RecommendedProduct(
                        item.product().getId(),
                        item.product().getName(),
                        item.category(),
                        item.product().getPrice(),
                        item.product().getImageUrl(),
                        item.reason()
                ))
                .toList();

        return new AiStylistChatResponse(
                buildReply(recommended, mergedIntent, latest, historyText),
                false,
                recommended
        );
    }

    private Intent mergeIntent(
            String latestText,
            String historyText,
            Intent latest,
            Intent history,
            Set<String> latestSeasonFromHistory
    ) {
        LinkedHashSet<String> requested = new LinkedHashSet<>();
        if (!latest.requestedCategories().isEmpty()) {
            requested.addAll(latest.requestedCategories());
            if (latest.allowMergeWithHistory()) {
                requested.addAll(history.requestedCategories());
            }
        } else if (latest.refinementOnly() && !history.requestedCategories().isEmpty()) {
            requested.addAll(history.requestedCategories());
        } else if (latest.outfitRequested()) {
            requested.add("TOP");
            requested.add("BOTTOM");
            if (containsAny(latestText, Set.of("추워", "따뜻", "겨울", "가을", "밤"))) {
                requested.add("OUTER");
            }
        } else if (!history.requestedCategories().isEmpty()) {
            requested.addAll(history.requestedCategories());
        }

        LinkedHashSet<String> excluded = new LinkedHashSet<>();
        excluded.addAll(history.excludedCategories());
        excluded.addAll(latest.excludedCategories());

        boolean clothingOnly = latest.clothingOnly() || (latest.refinementOnly() && history.clothingOnly());
        if (clothingOnly) {
            excluded.addAll(NON_CLOTHING_CATEGORIES);
            if (requested.isEmpty()) {
                requested.add("TOP");
                requested.add("BOTTOM");
                requested.add("OUTER");
            }
        }

        // "acc만 추천" 불만 이력 뒤에 코디 요청이 오면 액세서리 우선순위를 강제로 낮춘다.
        if (isAccessoryComplaint(historyText) && !latest.explicitAccessoryRequested()) {
            excluded.add("ACC");
        }

        LinkedHashSet<String> seasons = new LinkedHashSet<>();
        boolean latestHasSeason = !latest.requestedSeasons().isEmpty();
        if (latestHasSeason) {
            seasons.addAll(latest.requestedSeasons());
        } else if (latestSeasonFromHistory != null && !latestSeasonFromHistory.isEmpty()) {
            seasons.addAll(latestSeasonFromHistory);
        } else {
            seasons.addAll(history.requestedSeasons());
        }

        LinkedHashSet<String> colorTerms = new LinkedHashSet<>();
        if (!latest.colorTerms().isEmpty()) {
            colorTerms.addAll(latest.colorTerms());
        } else if (latest.refinementOnly()) {
            colorTerms.addAll(history.colorTerms());
        }

        LinkedHashSet<String> styleFamilies = new LinkedHashSet<>();
        if (!latest.requestedStyleFamilies().isEmpty()) {
            styleFamilies.addAll(latest.requestedStyleFamilies());
        } else if (latest.refinementOnly() && !history.requestedStyleFamilies().isEmpty()) {
            styleFamilies.addAll(history.requestedStyleFamilies());
        }

        boolean outfitRequested = latest.outfitRequested() || history.outfitRequested();
        if (requested.isEmpty() && outfitRequested) {
            requested.add("TOP");
            requested.add("BOTTOM");
        }

        return new Intent(
                requested,
                excluded,
                clothingOnly,
                outfitRequested,
                latest.explicitAccessoryRequested(),
                latest.allowMergeWithHistory(),
                latest.refinementOnly(),
                seasons,
                colorTerms,
                styleFamilies,
                latestHasSeason
        );
    }

    private Intent parseIntent(String text) {
        String normalized = normalize(text);
        String lowered = lower(normalized);

        LinkedHashSet<String> requested = new LinkedHashSet<>();
        if (containsAny(lowered, TOP_HINTS)) requested.add("TOP");
        if (containsAny(lowered, BOTTOM_HINTS)) requested.add("BOTTOM");
        if (containsAny(lowered, OUTER_HINTS)) requested.add("OUTER");
        if (containsAny(lowered, SHOES_HINTS)) requested.add("SHOES");
        if (containsAny(lowered, BAG_HINTS)) requested.add("BAG");
        if (containsAny(lowered, ACC_HINTS)) requested.add("ACC");

        boolean outfitRequested = containsAny(lowered, OUTFIT_TERMS) || lowered.contains("상하의") || lowered.contains("\u003f\uacf9\ube2f\u003f\u003f");
        if (outfitRequested) {
            if (requested.isEmpty()) {
                requested.add("TOP");
                requested.add("BOTTOM");
            } else if (requested.contains("TOP") && !requested.contains("BOTTOM")) {
                requested.add("BOTTOM");
            } else if (!requested.contains("TOP") && requested.contains("BOTTOM")) {
                requested.add("TOP");
            }
        }

        boolean clothingOnly = containsAny(lowered, CLOTHING_ONLY_TERMS);
        boolean explicitAccessoryRequested = requested.contains("ACC");

        LinkedHashSet<String> excluded = parseExcludedCategories(lowered);
        // "신발은 빼고" 같은 문장은 요청이 아니라 제외 의도이므로,
        // 제외 카테고리는 requested에서 제거해 이전 코디 문맥을 이어받을 수 있게 한다.
        requested.removeAll(excluded);

        boolean refinementOnly = !requested.isEmpty()
                ? false
                : containsAny(lowered, REFINEMENT_TERMS)
                || lowered.matches(".*\\d+.*")
                || !excluded.isEmpty();

        boolean allowMergeWithHistory = containsAny(lowered, MERGE_TERMS) || !excluded.isEmpty();
        LinkedHashSet<String> seasons = new LinkedHashSet<>(extractRequestedSeasons(lowered));
        LinkedHashSet<String> colors = new LinkedHashSet<>();
        for (String color : COLOR_TERMS) {
            if (lowered.contains(color)) {
                colors.add(color);
            }
        }
        LinkedHashSet<String> styleFamilies = new LinkedHashSet<>(extractRequestedStyleFamilies(lowered));

        return new Intent(
                requested,
                excluded,
                clothingOnly,
                outfitRequested,
                explicitAccessoryRequested,
                allowMergeWithHistory,
                refinementOnly,
                seasons,
                colors,
                styleFamilies,
                !seasons.isEmpty()
        );
    }

    private LinkedHashSet<String> parseExcludedCategories(String text) {
        LinkedHashSet<String> excluded = new LinkedHashSet<>();
        String[] segments = text.split("[,\\n.]");
        for (String segment : segments) {
            String part = normalize(segment);
            if (!containsAny(part, NEGATIVE_TERMS)) {
                continue;
            }
            if (containsAny(part, SHOES_HINTS)) excluded.add("SHOES");
            if (containsAny(part, BAG_HINTS)) excluded.add("BAG");
            if (containsAny(part, ACC_HINTS)) excluded.add("ACC");
            if (containsAny(part, OUTER_HINTS)) excluded.add("OUTER");
            if (containsAny(part, TOP_HINTS)) excluded.add("TOP");
            if (containsAny(part, BOTTOM_HINTS)) excluded.add("BOTTOM");
        }
        return excluded;
    }

    private List<ScoredProduct> scoreCandidates(String latestText, String historyText, Intent intent) {
        List<Product> products = productRepository.findAllInStockWithKeywords();
        if (products == null || products.isEmpty()) {
            return List.of();
        }

        String tokenSource = latestText + " " + (intent.refinementOnly() ? historyText : "");
        Set<String> tokens = splitTerms(tokenSource);
        Set<String> primaryStyleTerms = expandStyleTerms(intent.requestedStyleFamilies());

        List<ScoredProduct> scored = new ArrayList<>();
        for (Product product : products) {
            if (product == null || product.getQuantity() <= 0 || isExcludedProduct(product)) {
                continue;
            }

            String normalizedCategory = normalizeCategory(product.getCategory());
            String effectiveCategory = resolveEffectiveCategory(product, normalizedCategory);

            if (intent.excludedCategories().contains(effectiveCategory)) {
                continue;
            }
            if (intent.clothingOnly() && NON_CLOTHING_CATEGORIES.contains(effectiveCategory)) {
                continue;
            }
            if (!intent.requestedCategories().isEmpty() && !intent.requestedCategories().contains(effectiveCategory)) {
                continue;
            }

            String searchable = buildSearchableText(product, effectiveCategory);
            SeasonScore seasonScore = evaluateSeason(intent.requestedSeasons(), searchable);
            if (intent.latestHasSeason() && seasonScore.conflict()) {
                continue;
            }

            int score = 0;
            LinkedHashSet<String> reasons = new LinkedHashSet<>();
            boolean primaryStyleMatched = primaryStyleTerms.isEmpty() || containsAny(searchable, primaryStyleTerms);

            int tokenMatches = countTokenMatches(searchable, tokens);
            if (tokenMatches > 0) {
                score += Math.min(10, tokenMatches * 2);
                reasons.add("키워드 매칭");
            }

            if (!primaryStyleTerms.isEmpty() && primaryStyleMatched) {
                score += 8;
                reasons.add("스타일 키워드 매칭");
            }

            if (intent.requestedCategories().contains(effectiveCategory)) {
                score += 10;
                reasons.add("요청 카테고리 우선");
            }

            if (intent.outfitRequested() && Set.of("TOP", "BOTTOM").contains(effectiveCategory)) {
                score += 2;
            }

            score += scoreShortSleevePreference(latestText, searchable);

            int colorScore = scoreColor(intent.colorTerms(), searchable);
            if (colorScore > 0) {
                score += colorScore;
                reasons.add("색상 매칭");
            }

            if (seasonScore.score() != 0) {
                score += seasonScore.score();
                if (seasonScore.matchedSeason() != null) {
                    reasons.add("계절 매칭: " + seasonScore.matchedSeason());
                }
            }

            if (score <= 0) {
                score = 1;
                reasons.add("기본 패션 추천");
            }

            scored.add(new ScoredProduct(
                    product,
                    effectiveCategory,
                    score,
                    reasons.stream().findFirst().orElse("기본 패션 추천"),
                    primaryStyleMatched
            ));
        }

        List<ScoredProduct> prioritized = scored;
        if (!primaryStyleTerms.isEmpty()) {
            List<ScoredProduct> styleMatched = scored.stream()
                    .filter(ScoredProduct::primaryStyleMatched)
                    .toList();
            if (!styleMatched.isEmpty()) {
                prioritized = styleMatched;
            }
        }

        return prioritized.stream()
                .sorted(Comparator.comparingInt(ScoredProduct::score).reversed()
                        .thenComparing(item -> item.product().getId(), Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    private List<ScoredProduct> selectWithCategoryCoverage(List<ScoredProduct> scored, Set<String> requestedCategories) {
        int limit = Math.max(1, maxCandidates);
        if (scored.isEmpty()) {
            return List.of();
        }
        if (requestedCategories == null || requestedCategories.isEmpty()) {
            return scored.stream().limit(limit).toList();
        }

        LinkedHashMap<Long, ScoredProduct> selected = new LinkedHashMap<>();
        for (String category : requestedCategories) {
            for (ScoredProduct candidate : scored) {
                if (!category.equals(candidate.category())) {
                    continue;
                }
                selected.putIfAbsent(candidate.product().getId(), candidate);
                break;
            }
        }

        for (ScoredProduct candidate : scored) {
            if (selected.size() >= limit) {
                break;
            }
            selected.putIfAbsent(candidate.product().getId(), candidate);
        }

        return new ArrayList<>(selected.values());
    }

    private SeasonScore evaluateSeason(Set<String> requestedSeasons, String searchable) {
        if (requestedSeasons == null || requestedSeasons.isEmpty()) {
            return new SeasonScore(0, false, null);
        }

        int score = 0;
        String matchedSeason = null;
        boolean conflict = false;

        for (String requestedSeason : requestedSeasons) {
            Set<String> seasonSignals = SEASON_SIGNALS.getOrDefault(requestedSeason, Set.of());
            if (containsAny(searchable, seasonSignals)) {
                score += 6;
                matchedSeason = requestedSeason;
            }
        }

        for (Map.Entry<String, Set<String>> entry : SEASON_SIGNALS.entrySet()) {
            if (requestedSeasons.contains(entry.getKey())) {
                continue;
            }
            if (containsAny(searchable, entry.getValue())) {
                conflict = true;
                score -= 7;
            }
        }

        return new SeasonScore(score, conflict, matchedSeason);
    }

    private int scoreShortSleevePreference(String latestText, String searchable) {
        int score = 0;
        if (latestText.contains("반팔 셔츠") || latestText.contains("반팔셔츠")) {
            if (searchable.contains("셔츠") || searchable.contains("shirt")) {
                score += 8;
            }
            if (searchable.contains("티셔츠") || searchable.contains("tee")) {
                score -= 2;
            }
        }
        if (latestText.contains("티셔츠") && !latestText.contains("셔츠")) {
            if (searchable.contains("반팔") || searchable.contains("short sleeve") || searchable.contains("half tee")) {
                score += 5;
            }
            if (searchable.contains("긴팔") || searchable.contains("long sleeve")) {
                score -= 4;
            }
        }
        if (latestText.contains("반팔") && (searchable.contains("반팔") || searchable.contains("short sleeve"))) {
            score += 4;
        }
        if (latestText.contains("긴팔") && (searchable.contains("긴팔") || searchable.contains("long sleeve"))) {
            score += 4;
        }
        return score;
    }

    private int scoreColor(Set<String> colorTerms, String searchable) {
        if (colorTerms == null || colorTerms.isEmpty()) {
            return 0;
        }
        int score = 0;
        for (String color : colorTerms) {
            if (searchable.contains(color)) {
                score += 4;
            }
        }
        return score;
    }

    private int countTokenMatches(String searchable, Set<String> tokens) {
        int matches = 0;
        for (String token : tokens) {
            if (searchable.contains(token)) {
                matches++;
            }
        }
        return matches;
    }

    private String buildSearchableText(Product product, String effectiveCategory) {
        return lower(product.getName())
                + " "
                + lower(product.getDescription())
                + " "
                + lower(joinKeywords(product))
                + " "
                + lower(effectiveCategory);
    }

    private boolean isExcludedProduct(Product product) {
        String name = lower(product.getName());
        String description = lower(product.getDescription());
        return containsAny(name, EXCLUDED_PRODUCT_NAME_TERMS)
                || containsAny(description, EXCLUDED_PRODUCT_DESC_TERMS);
    }

    private String resolveEffectiveCategory(Product product, String normalizedCategory) {
        String searchable = lower(product.getName()) + " " + lower(product.getDescription()) + " " + lower(joinKeywords(product));
        if (containsAny(searchable, BAG_HINTS)) return "BAG";
        if (containsAny(searchable, SHOES_HINTS)) return "SHOES";
        if (containsAny(searchable, ACC_HINTS)) return "ACC";
        if ("BAG_ACC".equals(normalizedCategory)) return "ACC";
        return normalizedCategory;
    }

    private String normalizeCategory(String category) {
        if (category == null) return "";
        String normalized = category.trim().toUpperCase(Locale.ROOT);
        if ("TOPS".equals(normalized)) return "TOP";
        if ("BOTTOMS".equals(normalized)) return "BOTTOM";
        if ("ACCESSORY".equals(normalized) || "ACCESSORIES".equals(normalized)) return "ACC";
        return normalized;
    }

    private String joinKeywords(Product product) {
        if (product.getProductKeywords() == null) return "";
        return product.getProductKeywords().stream()
                .map(Keyword.ProductKeyword::getKeyword)
                .filter(keyword -> keyword != null && keyword.getKeyword() != null)
                .map(keyword -> keyword.getKeyword().trim())
                .filter(keyword -> !keyword.isBlank())
                .collect(Collectors.joining(" "));
    }

    private String buildHistoryContext(List<AiStylistChatRequest.HistoryItem> history) {
        if (history == null || history.isEmpty()) {
            return "";
        }
        LinkedHashSet<String> texts = new LinkedHashSet<>();
        for (AiStylistChatRequest.HistoryItem item : history) {
            if (item == null) continue;
            if (!"user".equalsIgnoreCase(normalize(item.getRole()))) continue;
            String text = normalize(item.getText());
            if (text.isBlank()) continue;
            texts.add(text);
        }
        return String.join(" ", texts);
    }

    private Set<String> splitTerms(String text) {
        if (text == null || text.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(text.split("[^0-9a-zA-Z가-힣]+"))
                .map(String::trim)
                .map(this::lower)
                .filter(token -> token.length() >= 2)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Set<String> extractRequestedSeasons(String text) {
        LinkedHashSet<String> seasons = new LinkedHashSet<>();
        for (Map.Entry<String, Set<String>> entry : SEASON_SIGNALS.entrySet()) {
            String season = entry.getKey();
            if (text.contains(season) || containsAny(text, entry.getValue())) {
                seasons.add(season);
            }
        }
        return seasons;
    }

    private Set<String> extractRequestedStyleFamilies(String text) {
        LinkedHashSet<String> families = new LinkedHashSet<>();
        for (Map.Entry<String, Set<String>> entry : STYLE_KEYWORD_GROUPS.entrySet()) {
            if (containsAny(text, entry.getValue())) {
                families.add(entry.getKey());
            }
        }
        return families;
    }

    private Set<String> expandStyleTerms(Set<String> styleFamilies) {
        if (styleFamilies == null || styleFamilies.isEmpty()) {
            return Set.of();
        }
        LinkedHashSet<String> terms = new LinkedHashSet<>();
        for (String family : styleFamilies) {
            terms.addAll(STYLE_KEYWORD_GROUPS.getOrDefault(family, Set.of()));
        }
        return terms;
    }

    private Set<String> extractLatestSeasonFromHistory(List<AiStylistChatRequest.HistoryItem> history) {
        if (history == null || history.isEmpty()) {
            return Set.of();
        }
        for (int i = history.size() - 1; i >= 0; i--) {
            AiStylistChatRequest.HistoryItem item = history.get(i);
            if (item == null) {
                continue;
            }
            if (!"user".equalsIgnoreCase(normalize(item.getRole()))) {
                continue;
            }
            String text = lower(normalize(item.getText()));
            if (text.isBlank()) {
                continue;
            }
            Set<String> seasons = extractRequestedSeasons(text);
            if (!seasons.isEmpty()) {
                return seasons;
            }
        }
        return Set.of();
    }

    private boolean looksLikeFashionRequest(String latestText, String historyText) {
        String merged = latestText + " " + historyText;
        return containsAny(merged, OUTFIT_TERMS)
                || containsAny(merged, TOP_HINTS)
                || containsAny(merged, BOTTOM_HINTS)
                || containsAny(merged, OUTER_HINTS)
                || containsAny(merged, SHOES_HINTS)
                || containsAny(merged, BAG_HINTS)
                || containsAny(merged, ACC_HINTS)
                || containsAny(merged, SEASON_TERMS)
                || containsAny(merged, COLOR_TERMS)
                || merged.contains("의류")
                || merged.contains("상하의");
    }

    private boolean isAccessoryComplaint(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        return text.contains("acc만")
                || text.contains("악세만")
                || text.contains("액세만")
                || text.contains("액세서리만")
                || text.contains("악세서리만");
    }

    private boolean isResetCommand(String text) {
        String compact = text.replaceAll("\\s+", "");
        if (RESET_TERMS.contains(compact)) {
            return true;
        }
        return compact.contains("초기")
                || compact.contains("리셋")
                || compact.contains("\u73e5\ub347\ub9b0")
                || compact.contains("\uf9e2\uc02c\ud079\u6e72")
                || compact.contains("\u7531\u044a\ub011");
    }

    private String buildReply(
            List<AiStylistChatResponse.RecommendedProduct> recommended,
            Intent intent,
            String latestText,
            String historyText
    ) {
        if (recommended == null || recommended.isEmpty()) {
            return "조건에 맞는 상품을 찾지 못했어요. 다른 조건으로 다시 알려주세요.";
        }

        StringBuilder builder = new StringBuilder("요청하신 스타일 기준으로 아래 상품을 먼저 추천드려요.\n");
        int visibleCount = Math.min(3, recommended.size());
        for (int i = 0; i < visibleCount; i++) {
            AiStylistChatResponse.RecommendedProduct product = recommended.get(i);
            builder.append(i + 1)
                    .append(") ")
                    .append(product.getProductName())
                    .append(" (")
                    .append(product.getCategory())
                    .append(", ")
                    .append(formatPrice(product.getPrice()))
                    .append(")\n");
        }
        String explanation = buildSecondStageExplanation(recommended, intent, latestText, historyText);
        if (!explanation.isBlank()) {
            builder.append("\n코디 설명: ").append(explanation).append("\n");
        }
        builder.append("원하시면 같은 예산대의 대체 코디도 이어서 추천해드릴게요.");
        return builder.toString();
    }

    private String buildSecondStageExplanation(
            List<AiStylistChatResponse.RecommendedProduct> recommended,
            Intent intent,
            String latestText,
            String historyText
    ) {
        String llmText = tryGenerateLlmExplanation(recommended, intent, latestText, historyText);
        if (!llmText.isBlank()) {
            return llmText;
        }

        AiStylistChatResponse.RecommendedProduct top = pickByCategory(recommended, "TOP");
        AiStylistChatResponse.RecommendedProduct bottom = pickByCategory(recommended, "BOTTOM");
        AiStylistChatResponse.RecommendedProduct outer = pickByCategory(recommended, "OUTER");
        AiStylistChatResponse.RecommendedProduct accent = pickByCategory(recommended, "ACC");

        String styleLabel = intent.requestedStyleFamilies().stream()
                .map(key -> STYLE_GROUP_LABELS.getOrDefault(key, key))
                .collect(Collectors.joining(", "));
        if (styleLabel.isBlank()) {
            styleLabel = "요청하신 무드";
        }

        if (top != null && bottom != null && outer != null) {
            return String.format("%s 기준으로 %s + %s 조합에 %s를 더해 균형감 있게 맞췄어요.",
                    styleLabel, top.getProductName(), bottom.getProductName(), outer.getProductName());
        }
        if (top != null && bottom != null) {
            return String.format("%s 기준으로 %s와 %s를 중심으로 코디를 구성했어요.",
                    styleLabel, top.getProductName(), bottom.getProductName());
        }
        if (top != null && accent != null) {
            return String.format("%s 기준으로 %s에 %s를 포인트로 매치해봤어요.",
                    styleLabel, top.getProductName(), accent.getProductName());
        }
        AiStylistChatResponse.RecommendedProduct first = recommended.get(0);
        return String.format("%s 기준으로 %s부터 시작하면 자연스럽게 확장하기 좋아요.",
                styleLabel, first.getProductName());
    }

    private AiStylistChatResponse.RecommendedProduct pickByCategory(
            List<AiStylistChatResponse.RecommendedProduct> recommended,
            String category
    ) {
        if (recommended == null || recommended.isEmpty()) {
            return null;
        }
        for (AiStylistChatResponse.RecommendedProduct product : recommended) {
            if (category.equalsIgnoreCase(normalize(product.getCategory()))) {
                return product;
            }
        }
        return null;
    }

    private String tryGenerateLlmExplanation(
            List<AiStylistChatResponse.RecommendedProduct> recommended,
            Intent intent,
            String latestText,
            String historyText
    ) {
        if (!canUseRemoteLlmExplanation()) {
            return "";
        }

        try {
            String prompt = buildLlmPrompt(recommended, intent, latestText, historyText);

            Map<String, Object> payload = Map.of(
                    "contents", List.of(Map.of(
                            "role", "user",
                            "parts", List.of(Map.of("text", prompt))
                    )),
                    "generationConfig", Map.of(
                            "temperature", 0.5,
                            "maxOutputTokens", Math.max(80, llmExplanationMaxOutputTokens)
                    )
            );

            String requestBody = objectMapper.writeValueAsString(payload);
            String endpoint = String.format(
                    "%s/models/%s:generateContent?key=%s",
                    geminiBaseUrl,
                    geminiModel,
                    geminiApiKey
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(6))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            applyRemoteCooldown();

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return "";
            }

            String parsed = extractGeminiText(response.body());
            if (parsed.isBlank()) {
                return "";
            }
            String normalized = normalize(parsed);
            if (isUnsafeLlmText(normalized)) {
                return "";
            }
            return normalized;
        } catch (Exception ignored) {
            applyRemoteCooldown();
            return "";
        }
    }

    private boolean canUseRemoteLlmExplanation() {
        if (!remoteEnabled || !llmExplanationEnabled) {
            return false;
        }
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return false;
        }
        if (geminiModel == null || geminiModel.isBlank()) {
            return false;
        }
        if (geminiBaseUrl == null || geminiBaseUrl.isBlank()) {
            return false;
        }
        return Instant.now().isAfter(remoteCooldownUntil);
    }

    private String buildLlmPrompt(
            List<AiStylistChatResponse.RecommendedProduct> recommended,
            Intent intent,
            String latestText,
            String historyText
    ) {
        String styleLabels = intent.requestedStyleFamilies().stream()
                .map(key -> STYLE_GROUP_LABELS.getOrDefault(key, key))
                .collect(Collectors.joining(", "));
        if (styleLabels.isBlank()) {
            styleLabels = "일반 데일리";
        }

        String seasonText = intent.requestedSeasons().isEmpty()
                ? "미지정"
                : String.join(", ", intent.requestedSeasons());

        String productLines = recommended.stream()
                .limit(Math.max(1, maxCandidates))
                .map(item -> String.format("- %s | %s | %s | %s",
                        item.getProductName(),
                        item.getCategory(),
                        formatPrice(item.getPrice()),
                        item.getReason()))
                .collect(Collectors.joining("\n"));

        return """
                너는 한국 쇼핑몰 코디 도우미다.
                반드시 한국어로 2~3문장만 답한다.
                아래 추천 상품 목록 안에서만 코디 설명을 만든다.
                외부 쇼핑몰/브랜드/링크/비속어/혐오 표현은 절대 쓰지 않는다.

                [요청]
                - 최신 사용자 문장: %s
                - 참고 문맥: %s
                - 스타일 그룹: %s
                - 계절: %s

                [추천 상품 목록]
                %s

                [출력 규칙]
                - 문장 수: 2~3문장
                - 상의/하의 중심으로 설명하고, 있으면 아우터/신발/가방/악세 포인트를 간단히 추가
                - "~해보세요" 같은 안내 톤으로 자연스럽게 작성
                """.formatted(
                normalize(latestText),
                normalize(historyText),
                styleLabels,
                seasonText,
                productLines
        );
    }

    private String extractGeminiText(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "";
        }
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                return "";
            }
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                return "";
            }
            StringBuilder builder = new StringBuilder();
            for (JsonNode part : parts) {
                String text = normalize(part.path("text").asText(""));
                if (!text.isBlank()) {
                    if (builder.length() > 0) {
                        builder.append(' ');
                    }
                    builder.append(text);
                }
            }
            return builder.toString();
        } catch (Exception ignored) {
            return "";
        }
    }

    private boolean isUnsafeLlmText(String text) {
        String lowered = lower(text);
        return containsAny(lowered, BLOCKED_TERMS)
                || containsAny(lowered, HARMFUL_TERMS)
                || containsAny(lowered, EXTERNAL_TERMS);
    }

    private void applyRemoteCooldown() {
        remoteCooldownUntil = Instant.now().plusSeconds(Math.max(10, remoteCooldownSeconds));
    }

    private boolean containsAny(String text, Set<String> terms) {
        if (text == null || text.isBlank() || terms == null || terms.isEmpty()) {
            return false;
        }
        for (String term : terms) {
            if (text.contains(term)) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String text) {
        if (text == null) {
            return "";
        }
        return text.replaceAll("\\s+", " ").trim();
    }

    private String lower(String text) {
        if (text == null) {
            return "";
        }
        return text.toLowerCase(Locale.ROOT);
    }

    private String formatPrice(double price) {
        NumberFormat formatter = NumberFormat.getNumberInstance(Locale.KOREA);
        formatter.setMaximumFractionDigits(0);
        return formatter.format(price) + "원";
    }

    private record ScoredProduct(
            Product product,
            String category,
            int score,
            String reason,
            boolean primaryStyleMatched
    ) {
    }

    private record SeasonScore(int score, boolean conflict, String matchedSeason) {
    }

    private record Intent(
            Set<String> requestedCategories,
            Set<String> excludedCategories,
            boolean clothingOnly,
            boolean outfitRequested,
            boolean explicitAccessoryRequested,
            boolean allowMergeWithHistory,
            boolean refinementOnly,
            Set<String> requestedSeasons,
            Set<String> colorTerms,
            Set<String> requestedStyleFamilies,
            boolean latestHasSeason
    ) {
    }
}

