package com.prosos.sosos.service.security;

import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class SqlInputGuardService {

    // 눈에 보이지 않는 제어문자는 로그/쿼리 파싱을 교란할 수 있어 차단한다.
    private static final Pattern CONTROL_CHARS = Pattern.compile("[\\x00-\\x1F\\x7F]");

    // 국내/해외 실제 공격에서 자주 등장한 SQLi 페이로드 조각을 탐지한다.
    private static final Pattern SUSPICIOUS_SQL_PATTERN = Pattern.compile(
            "(?i)(?:'\\s*(?:or|and)\\s+'?\\d+'?\\s*=\\s*'?\\d+'?"
                    + "|union\\s+select"
                    + "|--"
                    + "|/\\*|\\*/"
                    + "|;\\s*(?:drop|insert|update|delete|alter|create|truncate)"
                    + "|sleep\\s*\\("
                    + "|benchmark\\s*\\("
                    + "|information_schema"
                    + "|xp_cmdshell)"
    );

    private static final Pattern CATEGORY_ALLOWED_PATTERN = Pattern.compile("^[\\p{L}\\p{N}\\s_-]{1,40}$");

    public String sanitizeSearchTerm(String input, String fieldName, int maxLength) {
        // null은 빈 문자열로 통일해 이후 단계에서 안전하게 처리한다.
        if (input == null) {
            return "";
        }

        String normalized = input.trim();
        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + " 길이가 너무 깁니다.");
        }

        if (CONTROL_CHARS.matcher(normalized).find()) {
            throw new IllegalArgumentException(fieldName + " 형식이 올바르지 않습니다.");
        }

        if (SUSPICIOUS_SQL_PATTERN.matcher(normalized).find()) {
            throw new IllegalArgumentException(fieldName + "에 허용되지 않은 문자열이 포함되어 있습니다.");
        }

        return normalized;
    }

    public String sanitizeCategory(String input) {
        // 카테고리는 공백/특수문자 남용을 줄이기 위해 허용 패턴을 강제한다.
        if (input == null) {
            throw new IllegalArgumentException("카테고리를 입력해 주세요.");
        }

        String normalized = input.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("카테고리를 입력해 주세요.");
        }

        if (!CATEGORY_ALLOWED_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("카테고리 형식이 올바르지 않습니다.");
        }

        if (SUSPICIOUS_SQL_PATTERN.matcher(normalized).find()) {
            throw new IllegalArgumentException("카테고리 형식이 올바르지 않습니다.");
        }

        return normalized;
    }

    public String escapeForLike(String input) {
        // LIKE 검색에서 특수문자가 패턴으로 해석되지 않도록 이스케이프한다.
        if (input == null || input.isEmpty()) {
            return "";
        }

        return input
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
    }
}
