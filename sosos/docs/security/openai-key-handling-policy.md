# Gemini API 키 보관 정책

## 목적
- AI 추천 기능의 Gemini API 키가 코드/클라이언트/로그에 노출되지 않도록 운영 기준을 고정한다.

## 필수 원칙
1. 프론트엔드 코드에 Gemini 키를 넣지 않는다.
2. `application-*.properties`에 실제 키를 하드코딩하지 않는다.
3. 키는 서버 환경변수(`GEMINI_API_KEY`)로만 주입한다.
4. 키 값 전체를 로그로 출력하지 않는다.
5. 키 유출 의심 시 즉시 폐기(rotate) 후 재발급한다.

## 현재 적용 상태
- 백엔드 설정 키
  - `app.ai.gemini.api-key=${GEMINI_API_KEY...}`
- 챗봇 호출 경로
  - 프론트 -> 백엔드(`/api/v1/ai/stylist/chat`) -> Gemini
  - Gemini 키 전달 방식: `x-goog-api-key` 헤더
- 결과
  - 브라우저/네트워크 탭에서 Gemini 키 직접 노출 없음

## 로컬 실행 체크
1. 로컬 `.env`에 `GEMINI_API_KEY`를 설정한다.
2. 서버 기동 후 챗봇 요청 시 정상 응답을 확인한다.
3. 서버 로그에 키 값이 출력되지 않는지 확인한다.
