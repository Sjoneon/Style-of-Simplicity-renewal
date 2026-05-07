package com.prosos.sosos.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prosos.sosos.dto.AiStylistChatRequest;
import com.prosos.sosos.dto.AiStylistChatResponse;
import com.prosos.sosos.model.Keyword;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiStylistServiceTest {

    private ProductRepository productRepository;
    private AiStylistService aiStylistService;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        aiStylistService = new AiStylistService(productRepository, new ObjectMapper());
        ReflectionTestUtils.setField(aiStylistService, "geminiApiKey", "");
        ReflectionTestUtils.setField(aiStylistService, "maxInputLength", 180);
        ReflectionTestUtils.setField(aiStylistService, "maxCandidates", 5);
    }

    @Test
    void shouldExcludeBagAndShoesWhenUserRequestsOnlyClothing() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(1L, "Street Bag 19", "TOP", 76000),
                createProduct(2L, "Calm Loafer 18", "SHOES", 73000),
                createProduct(3L, "Spring Soft Shirt", "TOP", 69000),
                createProduct(4L, "Daily Wide Pants", "BOTTOM", 79000)
        ));

        AiStylistChatResponse response = aiStylistService.chat("여름 상의와 바지 추천해줘");

        assertFalse(response.getRecommendedProducts().isEmpty());
        assertTrue(response.getRecommendedProducts().stream()
                .allMatch(item -> List.of("TOP", "BOTTOM", "OUTER").contains(item.getCategory())));
    }

    @Test
    void shouldRecommendTopAndBottomWhenUserAsksSummerTopBottom() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(10L, "쿨 코튼 반팔 티셔츠", "TOP", 39000, "여름에 시원한 반팔"),
                createProduct(11L, "린넨 밴딩 쇼츠", "BOTTOM", 42000, "여름 반바지"),
                createProduct(12L, "미니 토트백", "BAG", 65000, "데일리 가방")
        ));

        AiStylistChatResponse response = aiStylistService.chat("여름 상하의 추천해줘");

        Set<String> categories = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getCategory)
                .collect(java.util.stream.Collectors.toSet());

        assertFalse(response.isBlocked());
        assertTrue(categories.contains("TOP"));
        assertTrue(categories.contains("BOTTOM"));
        assertFalse(categories.contains("BAG"));
    }

    @Test
    void shouldRecognizeShortSleeveAsFashionIntent() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(20L, "베이직 반팔 티셔츠", "TOP", 29000),
                createProduct(21L, "와이드 슬랙스", "BOTTOM", 59000)
        ));

        AiStylistChatResponse response = aiStylistService.chat("반팔 추천해봐");

        assertFalse(response.isBlocked());
        assertFalse(response.getRecommendedProducts().isEmpty());
        assertTrue(response.getRecommendedProducts().stream().allMatch(item -> "TOP".equals(item.getCategory())));
    }

    @Test
    void shouldPreferShortSleeveWhenUserRequestsGenericTshirt() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(30L, "베이직 긴팔 티셔츠", "TOP", 33000, "간절기 기본템"),
                createProduct(31L, "컴포트 반팔 티셔츠", "TOP", 29000, "여름용")
        ));

        AiStylistChatResponse response = aiStylistService.chat("티셔츠 추천해줘");

        assertFalse(response.getRecommendedProducts().isEmpty());
        assertEquals("컴포트 반팔 티셔츠", response.getRecommendedProducts().get(0).getProductName());
    }

    @Test
    void shouldPreferShortSleeveShirtOverTshirtWhenUserRequestsShortSleeveShirt() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(40L, "화이트 반팔 셔츠", "TOP", 49000, "여름 셔츠"),
                createProduct(41L, "화이트 반팔 티셔츠", "TOP", 29000, "기본 반팔")
        ));

        AiStylistChatResponse response = aiStylistService.chat("반팔 셔츠 추천해줘");

        assertFalse(response.getRecommendedProducts().isEmpty());
        assertEquals("화이트 반팔 셔츠", response.getRecommendedProducts().get(0).getProductName());
    }

    @Test
    void shouldAllowBagOnlyIntent() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(50L, "Urban Cross Bag", "TOP", 89000),
                createProduct(51L, "Daily Sneakers", "SHOES", 99000),
                createProduct(52L, "Spring Shirt", "TOP", 65000)
        ));

        AiStylistChatResponse response = aiStylistService.chat("가방만 추천해줘");

        assertFalse(response.getRecommendedProducts().isEmpty());
        assertTrue(response.getRecommendedProducts().stream().allMatch(item -> "BAG".equals(item.getCategory())));
    }

    @Test
    void shouldBlockExternalShoppingRequest() {
        AiStylistChatResponse response = aiStylistService.chat("무신사에서 찾아봐");

        assertTrue(response.isBlocked());
        assertTrue(response.getRecommendedProducts().isEmpty());
        assertTrue(response.getReply().contains("외부 쇼핑몰"));
    }

    @Test
    void shouldBlockHarmfulContextRequest() {
        AiStylistChatResponse response = aiStylistService.chat("노예를 밖에 끌고 가려는데 옷 추천해봐");

        assertTrue(response.isBlocked());
        assertTrue(response.getRecommendedProducts().isEmpty());
        assertTrue(response.getReply().contains("혐오/폭력"));
    }

    @Test
    void shouldNotRepeatNeedMoreDetailsWhenEnoughInfoGiven() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(60L, "Spring Basic Shirt", "TOP", 59000),
                createProduct(61L, "Spring Slacks", "BOTTOM", 79000)
        ));

        AiStylistChatResponse response = aiStylistService.chat(
                "색상은 봄 느낌이고 계절은 봄, 키 180cm 몸무게 78kg 예산은 30만원이야. 상하의 추천해줘"
        );

        assertFalse(response.getReply().contains("원하는 색상, 핏, 계절, 예산을 더 알려주시면"));
    }

    @Test
    void shouldIncludeAllRequestedMixedCategoriesWhenAvailable() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(70L, "코튼 티셔츠", "TOP", 29000, "기본 반팔"),
                createProduct(71L, "나일론 바람막이", "OUTER", 89000, "여름 아우터"),
                createProduct(72L, "러닝 스니커즈", "SHOES", 99000, "경량 신발"),
                createProduct(73L, "토트백", "BAG", 69000, "데일리 가방")
        ));

        AiStylistChatResponse response = aiStylistService.chat("아우터 + 신발 조합 추천해줘");

        Set<String> categories = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getCategory)
                .collect(java.util.stream.Collectors.toSet());

        assertTrue(categories.contains("OUTER"));
        assertTrue(categories.contains("SHOES"));
    }

    @Test
    void shouldRespectExclusionPhraseForCategory() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(80L, "쿨 반팔 티셔츠", "TOP", 31000, "여름 상의"),
                createProduct(81L, "린넨 밴딩 쇼츠", "BOTTOM", 39000, "여름 하의"),
                createProduct(82L, "데일리 로퍼", "SHOES", 79000, "가죽 로퍼")
        ));

        AiStylistChatResponse response = aiStylistService.chat("여름 상하의 추천해줘, 신발은 빼고");

        Set<String> categories = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getCategory)
                .collect(java.util.stream.Collectors.toSet());

        assertTrue(categories.contains("TOP"));
        assertTrue(categories.contains("BOTTOM"));
        assertFalse(categories.contains("SHOES"));
    }

    @Test
    void shouldUseHistoryContextForFollowUpRequest() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(90L, "아이스 코튼 반팔 티셔츠", "TOP", 35000, "여름 상의"),
                createProduct(91L, "린넨 와이드 팬츠", "BOTTOM", 45000, "여름 하의"),
                createProduct(92L, "캔버스 토트백", "BAG", 39000, "데일리 가방")
        ));

        List<AiStylistChatRequest.HistoryItem> history = List.of(
                createHistoryItem("user", "여름 하의 추천해줘"),
                createHistoryItem("assistant", "하의 위주로 먼저 추천드릴게요.")
        );
        AiStylistChatResponse response = aiStylistService.chat("상의도 같이 추천해줘", history);

        Set<String> categories = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getCategory)
                .collect(java.util.stream.Collectors.toSet());

        assertFalse(response.isBlocked());
        assertTrue(categories.contains("TOP"));
        assertTrue(categories.contains("BOTTOM"));
        assertFalse(categories.contains("BAG"));
    }

    @Test
    void shouldKeepOuterAndShoesWhenUserUsesParticleForm() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(100L, "Windbreaker Jacket Black", "OUTER", 99000, "daily outer"),
                createProduct(101L, "Urban Sneakers White", "SHOES", 89000, "lightweight shoes"),
                createProduct(102L, "Canvas Tote Bag", "BAG", 49000, "daily bag")
        ));

        AiStylistChatResponse response = aiStylistService.chat("아우터랑 신발 같이 추천해줘");

        Set<String> categories = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getCategory)
                .collect(java.util.stream.Collectors.toSet());

        assertFalse(response.isBlocked());
        assertTrue(categories.contains("OUTER"));
        assertTrue(categories.contains("SHOES"));
    }

    @Test
    void shouldReturnRecommendationsForColorFocusedRequest() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(110L, "City Coat Black", "OUTER", 129000, "black outer for daily"),
                createProduct(111L, "Classic Pants Beige", "BOTTOM", 69000, "beige basic pants"),
                createProduct(112L, "Basic T-Shirt White", "TOP", 39000, "white tee")
        ));

        AiStylistChatResponse response = aiStylistService.chat("블랙 컬러 위주로 추천");

        assertFalse(response.isBlocked());
        assertFalse(response.getRecommendedProducts().isEmpty());
    }

    @Test
    void shouldReturnRecommendationsForBroadClothingRequest() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(120L, "Everyday Knit", "TOP", 59000, "daily basic"),
                createProduct(121L, "Wide Slacks", "BOTTOM", 79000, "office look"),
                createProduct(122L, "Classic Coat", "OUTER", 139000, "fall outer")
        ));

        AiStylistChatResponse response = aiStylistService.chat("의류만 추천해줘");

        assertFalse(response.isBlocked());
        assertFalse(response.getRecommendedProducts().isEmpty());
    }

    @Test
    void shouldUnderstandWindbreakerAndSneakerTerms() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(130L, "Nylon Windbreaker", "OUTER", 99000, "windbreaker jacket"),
                createProduct(131L, "Runner Sneakers", "SHOES", 89000, "running shoes"),
                createProduct(132L, "Denim Pants", "BOTTOM", 59000, "blue denim")
        ));

        AiStylistChatResponse outerResponse = aiStylistService.chat("바람막이 추천");
        AiStylistChatResponse shoesResponse = aiStylistService.chat("운동화 추천");

        assertFalse(outerResponse.isBlocked());
        assertFalse(outerResponse.getRecommendedProducts().isEmpty());
        assertTrue(outerResponse.getRecommendedProducts().stream()
                .anyMatch(item -> "OUTER".equals(item.getCategory())));

        assertFalse(shoesResponse.isBlocked());
        assertFalse(shoesResponse.getRecommendedProducts().isEmpty());
        assertTrue(shoesResponse.getRecommendedProducts().stream()
                .anyMatch(item -> "SHOES".equals(item.getCategory())));
    }

    @Test
    void shouldKeepRequestedOuterCategoryEvenWhenTopScoresAreShoes() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(200L, "City Trench Coat", "OUTER", 139000, "classic outer"),
                createProduct(301L, "Sneakers 01", "SHOES", 79000, "daily shoes"),
                createProduct(302L, "Sneakers 02", "SHOES", 81000, "daily shoes"),
                createProduct(303L, "Sneakers 03", "SHOES", 83000, "daily shoes"),
                createProduct(304L, "Sneakers 04", "SHOES", 85000, "daily shoes"),
                createProduct(305L, "Sneakers 05", "SHOES", 87000, "daily shoes"),
                createProduct(306L, "Sneakers 06", "SHOES", 89000, "daily shoes")
        ));

        AiStylistChatResponse response = aiStylistService.chat("아우터 + 신발 조합 추천해줘");

        Set<String> categories = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getCategory)
                .collect(java.util.stream.Collectors.toSet());

        assertTrue(categories.contains("OUTER"));
        assertTrue(categories.contains("SHOES"));
    }

    @Test
    void shouldAvoidAccessoryOnlyLoopAfterAccComplaint() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(401L, "Night Out Shirt", "TOP", 69000, "데이트 코디 상의"),
                createProduct(402L, "Slim Black Slacks", "BOTTOM", 79000, "깔끔한 하의"),
                createProduct(403L, "Twist Silver Ring", "BAG_ACC", 31000, "acc 포인트"),
                createProduct(404L, "Silver Pendant Necklace", "BAG_ACC", 47000, "acc 포인트")
        ));

        List<AiStylistChatRequest.HistoryItem> history = List.of(
                createHistoryItem("user", "나 오늘 술 마시러 갈건데 멋진 옷들로 코디 해줘"),
                createHistoryItem("assistant", "요청하신 스타일 기준으로 추천드려요."),
                createHistoryItem("user", "코디를 해달라니까 왜 acc만 추천해")
        );

        AiStylistChatResponse response = aiStylistService.chat("아니 술마시러가는 복장 추천하라고", history);

        Set<String> categories = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getCategory)
                .collect(java.util.stream.Collectors.toSet());

        assertFalse(response.isBlocked());
        assertTrue(categories.contains("TOP") || categories.contains("BOTTOM") || categories.contains("OUTER"));
        assertFalse(categories.contains("ACC"));
    }

    @Test
    void shouldDefaultToTopBottomForGenericOutfitRequest() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(411L, "Smoke Club Shirt", "TOP", 41000, "밤 코디 상의"),
                createProduct(412L, "Classic Wide Denim Pants", "BOTTOM", 65000, "와이드 팬츠"),
                createProduct(413L, "Twist Silver Ring", "BAG_ACC", 31000, "acc 포인트")
        ));

        AiStylistChatResponse response = aiStylistService.chat("술 마시러 갈 때 멋진 옷 코디 추천해줘");

        Set<String> categories = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getCategory)
                .collect(java.util.stream.Collectors.toSet());

        assertFalse(response.isBlocked());
        assertTrue(categories.contains("TOP"));
        assertTrue(categories.contains("BOTTOM"));
        assertFalse(categories.contains("ACC"));
    }

    @Test
    void shouldIgnoreAccessoryHistoryOnFreshTopBottomRequest() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(421L, "Smoke Club Shirt", "TOP", 41000, "밤 코디 상의"),
                createProduct(422L, "Classic Wide Denim Pants", "BOTTOM", 65000, "와이드 팬츠"),
                createProduct(423L, "Twist Silver Ring", "BAG_ACC", 31000, "acc 포인트")
        ));

        List<AiStylistChatRequest.HistoryItem> history = List.of(
                createHistoryItem("user", "이거에 어울리는 악세서리도 달라고"),
                createHistoryItem("assistant", "악세서리도 함께 보여드릴게요."),
                createHistoryItem("user", "악세 추천해줘")
        );

        AiStylistChatResponse response = aiStylistService.chat("상, 하의 술 마시러갈때 멋지게 입을 옷 추천해", history);

        Set<String> categories = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getCategory)
                .collect(java.util.stream.Collectors.toSet());

        assertFalse(response.isBlocked());
        assertTrue(categories.contains("TOP"));
        assertTrue(categories.contains("BOTTOM"));
        assertFalse(categories.contains("ACC"));
    }

    @Test
    void shouldReturnResetMessageForResetCommand() {
        AiStylistChatResponse response = aiStylistService.chat("자 초기화");

        assertFalse(response.isBlocked());
        assertTrue(response.getRecommendedProducts().isEmpty());
        assertTrue(response.getReply().contains("초기화"));
    }

    @Test
    void shouldUseHistoryForBudgetRefinementMessage() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(431L, "아이스 코튼 반팔 티셔츠", "TOP", 35000, "여름 상의"),
                createProduct(432L, "린넨 와이드 팬츠", "BOTTOM", 45000, "여름 하의"),
                createProduct(433L, "데일리 토트백", "BAG", 39000, "가방")
        ));

        List<AiStylistChatRequest.HistoryItem> history = List.of(
                createHistoryItem("user", "여름 상하의 추천해줘"),
                createHistoryItem("assistant", "상하의 기준으로 추천드릴게요.")
        );

        AiStylistChatResponse response = aiStylistService.chat("20만원 이하로 맞춰줘", history);

        Set<String> categories = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getCategory)
                .collect(java.util.stream.Collectors.toSet());

        assertFalse(response.isBlocked());
        assertTrue(categories.contains("TOP"));
        assertTrue(categories.contains("BOTTOM"));
        assertFalse(categories.contains("BAG"));
    }

    @Test
    void shouldPreferLatestSeasonWhenUserOverridesSeasonInFollowUp() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(461L, "Black Waffle Henley Half Tee", "TOP", 47000, "데일리 상의"),
                createProduct(462L, "Vintage Denim Shorts", "BOTTOM", 49000, "여름 반바지"),
                createProduct(463L, "Warm Fleece Slacks", "BOTTOM", 69000, "겨울 기모 팬츠"),
                createProduct(464L, "Cashmere Balmacaan Coat Black", "OUTER", 199000, "겨울 코트")
        ));

        List<AiStylistChatRequest.HistoryItem> history = List.of(
                createHistoryItem("user", "일상룩으로 상하의 추천해 계절은 여름"),
                createHistoryItem("assistant", "여름 기준으로 추천드릴게요.")
        );

        AiStylistChatResponse response = aiStylistService.chat("아 미안 계절 겨울이다.", history);

        Set<String> names = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getProductName)
                .collect(java.util.stream.Collectors.toSet());

        assertFalse(response.isBlocked());
        assertTrue(names.contains("Warm Fleece Slacks"));
        assertFalse(names.contains("Vintage Denim Shorts"));
    }

    @Test
    void shouldKeepBagWhenFollowUpAddsShoes() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(441L, "Dark Gray Mini Shoulder Bag", "BAG_ACC", 67000, "bag item"),
                createProduct(442L, "Vintage White Sneakers", "SHOES", 91000, "shoes item"),
                createProduct(443L, "Basic Shirt", "TOP", 39000, "top item")
        ));

        List<AiStylistChatRequest.HistoryItem> history = List.of(
                createHistoryItem("user", "가방 추천해줘"),
                createHistoryItem("assistant", "가방 기준으로 먼저 추천드릴게요.")
        );

        AiStylistChatResponse response = aiStylistService.chat("신발도 같이 보여줘", history);

        Set<String> categories = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getCategory)
                .collect(java.util.stream.Collectors.toSet());

        assertFalse(response.isBlocked());
        assertTrue(categories.contains("BAG"));
        assertTrue(categories.contains("SHOES"));
    }

    @Test
    void shouldTreatClothingOnlyPhraseAsClothingOnlyIntent() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(451L, "Basic Shirt", "TOP", 39000, "상의"),
                createProduct(452L, "Twist Silver Ring", "BAG_ACC", 31000, "acc")
        ));

        AiStylistChatResponse response = aiStylistService.chat("가방은 말고 의류만 추천해줘");
        Set<String> categories = response.getRecommendedProducts().stream()
                .map(AiStylistChatResponse.RecommendedProduct::getCategory)
                .collect(java.util.stream.Collectors.toSet());

        assertFalse(response.isBlocked());
        assertFalse(categories.contains("ACC"));
    }

    @Test
    void shouldClassifyBagProductsFromBagAccBucketAsBag() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProduct(501L, "Dark Gray Mini Shoulder Bag", "BAG_ACC", 67000, "bag acc item"),
                createProduct(502L, "Twist Silver Ring", "BAG_ACC", 31000, "acc item"),
                createProduct(503L, "Slim Fit Shirt", "TOP", 59000, "top item")
        ));

        AiStylistChatResponse response = aiStylistService.chat("가방만 추천해줘");

        assertFalse(response.isBlocked());
        assertFalse(response.getRecommendedProducts().isEmpty());
        assertTrue(response.getRecommendedProducts().stream()
                .allMatch(item -> "BAG".equals(item.getCategory())));
    }

    @Test
    void shouldTreatHipAsPrimaryStyleKeywordFamily() {
        when(productRepository.findAllInStockWithKeywords()).thenReturn(List.of(
                createProductWithKeywords(601L, "Street Logo Tee", "TOP", 43000, "daily tee", List.of("스트릿", "트렌디")),
                createProductWithKeywords(602L, "Formal Office Shirt", "TOP", 53000, "office shirt", List.of("포멀", "클래식"))
        ));

        AiStylistChatResponse response = aiStylistService.chat("힙한 상의 추천해줘");

        assertFalse(response.isBlocked());
        assertFalse(response.getRecommendedProducts().isEmpty());
        assertEquals("Street Logo Tee", response.getRecommendedProducts().get(0).getProductName());
    }

    private Product createProduct(Long id, String name, String category, double price) {
        return createProduct(id, name, category, price, name + " description");
    }

    private Product createProduct(Long id, String name, String category, double price, String description) {
        Product product = new Product();
        product.setId(id);
        product.setName(name);
        product.setCategory(category);
        product.setPrice(price);
        product.setQuantity(10);
        product.setDescription(description);
        product.setImageUrl("/images/test.png");
        product.setProductKeywords(new ArrayList<>());
        return product;
    }

    private Product createProductWithKeywords(
            Long id,
            String name,
            String category,
            double price,
            String description,
            List<String> keywords
    ) {
        Product product = createProduct(id, name, category, price, description);
        List<Keyword.ProductKeyword> productKeywords = new ArrayList<>();
        for (String keywordText : keywords) {
            Keyword keyword = new Keyword(keywordText, "manual");
            productKeywords.add(new Keyword.ProductKeyword(product, keyword));
        }
        product.setProductKeywords(productKeywords);
        return product;
    }

    private AiStylistChatRequest.HistoryItem createHistoryItem(String role, String text) {
        AiStylistChatRequest.HistoryItem item = new AiStylistChatRequest.HistoryItem();
        item.setRole(role);
        item.setText(text);
        return item;
    }
}
