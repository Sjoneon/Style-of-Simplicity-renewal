package com.prosos.sosos.controller.api.v1;

import com.prosos.sosos.dto.AiStylistChatRequest;
import com.prosos.sosos.dto.AiStylistChatResponse;
import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.service.AiStylistService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/ai/stylist")
public class AiStylistApiController {

    private static final String SESSION_REPEAT_BASE = "aiStylistRepeatBase";
    private static final String SESSION_REPEAT_COUNT = "aiStylistRepeatCount";
    private static final int FRUSTRATED_REPEAT_THRESHOLD = 4;

    // 사용자가 답답함을 표현하는 반복 입력을 완충하기 위한 감지 키워드다.
    private static final Set<String> FRUSTRATED_TONE_TERMS = Set.of(
            "답답", "왜", "왜 또", "아니", "그러니까", "진짜", "도대체", "몇번", "몇 번", "또 안", "왜 안", "제발"
    );

    private static final Set<String> SIMILARITY_STOPWORDS = Set.of(
            "추천", "추천해", "추천해줘", "해줘", "해", "좀", "또", "왜", "아니", "진짜", "그러니까", "제발"
    );

    private final AiStylistService aiStylistService;

    public AiStylistApiController(AiStylistService aiStylistService) {
        this.aiStylistService = aiStylistService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiStylistChatResponse>> chat(
            @RequestBody AiStylistChatRequest request,
            HttpSession session
    ) {
        if (!hasAuthenticatedSession(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure("로그인이 필요합니다."));
        }

        String userMessage = request == null ? null : request.getMessage();
        List<AiStylistChatRequest.HistoryItem> history = request == null
                ? Collections.emptyList()
                : request.getHistory();
        AiStylistChatResponse repeatEscalation = detectFrustratedRepeatEscalation(userMessage, session);
        if (repeatEscalation != null) {
            return ResponseEntity.ok(ApiResponse.success(repeatEscalation, "AI 스타일 추천 안내 응답"));
        }

        try {
            AiStylistChatResponse response = aiStylistService.chat(userMessage, history);
            return ResponseEntity.ok(ApiResponse.success(response, "AI 스타일 추천 응답 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("AI 추천 처리 중 오류가 발생했습니다."));
        }
    }

    private boolean hasAuthenticatedSession(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        return loggedInUser != null;
    }

    private AiStylistChatResponse detectFrustratedRepeatEscalation(String userMessage, HttpSession session) {
        String normalized = normalizeForRepeat(userMessage);
        if (normalized.isBlank()) {
            resetRepeatState(session);
            return null;
        }

        if (!containsFrustratedTone(normalized)) {
            resetRepeatState(session);
            return null;
        }

        String previousBase = getStringAttribute(session, SESSION_REPEAT_BASE);
        int nextCount;
        if (!previousBase.isBlank() && isSimilarQuestion(previousBase, normalized)) {
            nextCount = getIntAttribute(session, SESSION_REPEAT_COUNT) + 1;
        } else {
            nextCount = 1;
            previousBase = normalized;
        }

        session.setAttribute(SESSION_REPEAT_BASE, previousBase);
        session.setAttribute(SESSION_REPEAT_COUNT, nextCount);

        if (nextCount < FRUSTRATED_REPEAT_THRESHOLD) {
            return null;
        }

        // 한 번 안내한 뒤 카운트를 초기화해 같은 문장 무한 반복 응답을 막는다.
        resetRepeatState(session);
        return new AiStylistChatResponse(
                """
                죄송합니다. 같은 요청을 반복해서 받는 상황에 대해 아직 대응이 미흡합니다.
                현재는 품목(예: 반팔/반바지/셔츠), 계절(봄/여름), 예산, 상황(출근/하객)처럼 조건을 짧게 나눠 입력해 주시면
                그 범위 안에서 추천해드릴 수 있습니다.
                """.trim(),
                true,
                List.of()
        );
    }

    private String normalizeForRepeat(String message) {
        if (message == null) {
            return "";
        }
        return message.toLowerCase(Locale.ROOT)
                .replaceAll("[^0-9a-z가-힣\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private boolean containsFrustratedTone(String normalizedMessage) {
        return FRUSTRATED_TONE_TERMS.stream().anyMatch(normalizedMessage::contains);
    }

    private boolean isSimilarQuestion(String base, String current) {
        if (base.equals(current)) {
            return true;
        }
        if (base.contains(current) || current.contains(base)) {
            return true;
        }

        Set<String> baseTokens = tokenizeForSimilarity(base);
        Set<String> currentTokens = tokenizeForSimilarity(current);
        if (baseTokens.isEmpty() || currentTokens.isEmpty()) {
            return false;
        }

        int shared = 0;
        for (String token : baseTokens) {
            if (currentTokens.contains(token)) {
                shared++;
            }
        }

        int baseSize = baseTokens.size();
        int currentSize = currentTokens.size();
        double overlapRatio = (double) shared / (double) Math.min(baseSize, currentSize);
        return overlapRatio >= 0.7;
    }

    private Set<String> tokenizeForSimilarity(String message) {
        return Arrays.stream(message.split(" "))
                .map(String::trim)
                .filter(token -> token.length() >= 2)
                .filter(token -> !FRUSTRATED_TONE_TERMS.contains(token))
                .filter(token -> !SIMILARITY_STOPWORDS.contains(token))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String getStringAttribute(HttpSession session, String key) {
        Object value = session.getAttribute(key);
        return value instanceof String str ? str : "";
    }

    private int getIntAttribute(HttpSession session, String key) {
        Object value = session.getAttribute(key);
        if (value instanceof Integer i) {
            return i;
        }
        return 0;
    }

    private void resetRepeatState(HttpSession session) {
        session.removeAttribute(SESSION_REPEAT_BASE);
        session.removeAttribute(SESSION_REPEAT_COUNT);
    }
}
