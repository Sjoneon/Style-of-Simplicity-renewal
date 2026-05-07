# 2026-04-25 AI 스타일 챗봇(의류 추천 전용) 학습

## 무엇
- 웹 우측 하단에 원형 `AI` 버튼을 추가하고, 클릭 시 소형 채팅창을 연다.
- 채팅 입력을 서버 `의류 추천 전용 API`로 전송한다.
- 서버는 판매자 등록 키워드/상품 정보를 활용해 추천 후보를 만들고, Gemini 응답을 결합해 답변한다.

## 왜
- 사용자가 메뉴 탐색 없이 자연어로 원하는 스타일을 요청할 수 있다.
- 판매자가 등록한 키워드를 추천 품질에 직접 반영할 수 있다.
- 의류 외 질문/부적절 요청은 서버에서 선차단해 토큰 소모와 운영 리스크를 줄일 수 있다.

## 언제
- 적용일: 2026-04-25
- 범위: 프론트 챗봇 UI + 백엔드 추천 API + Gemini 키 보관 환경변수

## 어떻게
1. 프론트
- `AppLayout`에 고정 위치 챗봇 위젯 추가
- 버튼 크기 `1.3cm x 1.3cm`, 원형, 텍스트 `AI`
- 채팅 메시지 전송 API 모듈 추가

2. 백엔드
- `/api/v1/ai/stylist/chat` 엔드포인트 추가
- 입력 길이 제한, 의류 도메인 여부 검사, 부적절 표현 차단
- 판매자 등록 키워드 기반 상품 후보 추출
- Gemini 호출(키 존재 시) 후 추천 답변 구성

3. 보안/운영
- Gemini API 키는 백엔드 환경변수(`GEMINI_API_KEY`)만 사용
- 프론트에는 키를 전달하지 않음
- Gemini 호출 시 키는 `x-goog-api-key` 헤더로 전송
- 키 미설정 시에도 서버에서 안전한 안내/로컬 추천 응답 반환

## 작업 대상 파일
- `frontend/src/components/AppLayout.jsx`
- `frontend/src/components/AiStylistWidget.jsx` (신규)
- `frontend/src/services/aiStylistApi.js` (신규)
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/AiStylistApiController.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/service/AiStylistService.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/dto/AiStylistChatRequest.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/dto/AiStylistChatResponse.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/repository/ProductRepository.java`
- `sosos/src/main/resources/application-dev.properties`
- `sosos/src/main/resources/application-prod.properties`
- `sosos/.env.example` (신규)

## 완료 기준
- 사용자가 챗봇에 의류 스타일 요청 시 추천 답변/상품 후보를 확인할 수 있다.
- 의류 외 요청/부적절 요청은 고정 안내 문구로 즉시 차단된다.
- Gemini 키는 프론트에 노출되지 않고 백엔드 환경변수로만 동작한다.
