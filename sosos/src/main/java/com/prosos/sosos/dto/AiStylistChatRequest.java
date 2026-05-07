package com.prosos.sosos.dto;

import java.util.ArrayList;
import java.util.List;

public class AiStylistChatRequest {

    // 사용자가 챗봇에 입력한 원문 요청
    private String message;
    // 최근 대화 문맥(최신순이 아닌, 화면에 보이는 순서)
    private List<HistoryItem> history = new ArrayList<>();

    public AiStylistChatRequest() {
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<HistoryItem> getHistory() {
        return history;
    }

    public void setHistory(List<HistoryItem> history) {
        this.history = history == null ? new ArrayList<>() : history;
    }

    public static class HistoryItem {
        private String role;
        private String text;

        public HistoryItem() {
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }
}
