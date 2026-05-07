package com.prosos.sosos.controller.api.v1;

import com.prosos.sosos.dto.AiStylistChatRequest;
import com.prosos.sosos.dto.AiStylistChatResponse;
import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.service.AiStylistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiStylistApiControllerTest {

    private AiStylistService aiStylistService;
    private AiStylistApiController controller;
    private MockHttpSession session;

    @BeforeEach
    void setUp() {
        aiStylistService = mock(AiStylistService.class);
        controller = new AiStylistApiController(aiStylistService);
        session = new MockHttpSession();
        session.setAttribute("loggedInUser", "test-user");

        when(aiStylistService.chat(anyString(), anyList()))
                .thenReturn(new AiStylistChatResponse("기본 추천 응답", false, List.of()));
    }

    @Test
    void shouldReturnApologyGuideWhenFrustratedSimilarQuestionRepeatsFourTimes() {
        chat("아니 반팔 추천해줘");
        chat("그러니까 반팔 추천해줘");
        chat("왜 또 안돼 반팔 추천해줘");
        ResponseEntity<ApiResponse<AiStylistChatResponse>> fourth = chat("진짜 답답한데 반팔 추천해줘");

        ApiResponse<AiStylistChatResponse> body = fourth.getBody();
        assertNotNull(body);
        assertTrue(body.isSuccess());
        assertNotNull(body.getData());
        assertTrue(body.getData().isBlocked());
        assertTrue(body.getData().getReply().contains("죄송"));
        assertTrue(body.getData().getReply().contains("미흡"));
        assertTrue(body.getData().getReply().contains("현재는"));

        verify(aiStylistService, times(3)).chat(anyString(), anyList());
    }

    @Test
    void shouldNotTriggerEscalationForNeutralRepeatedQuestion() {
        chat("반팔 추천해줘");
        chat("반팔 추천해줘");
        chat("반팔 추천해줘");
        ResponseEntity<ApiResponse<AiStylistChatResponse>> fourth = chat("반팔 추천해줘");

        ApiResponse<AiStylistChatResponse> body = fourth.getBody();
        assertNotNull(body);
        assertTrue(body.isSuccess());
        assertNotNull(body.getData());
        assertFalse(body.getData().isBlocked());
        assertTrue(body.getData().getReply().contains("기본 추천 응답"));

        verify(aiStylistService, times(4)).chat(anyString(), anyList());
    }

    private ResponseEntity<ApiResponse<AiStylistChatResponse>> chat(String message) {
        AiStylistChatRequest request = new AiStylistChatRequest();
        request.setMessage(message);
        return controller.chat(request, session);
    }
}
