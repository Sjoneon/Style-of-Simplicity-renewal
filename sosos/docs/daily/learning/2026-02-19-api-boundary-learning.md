# 학습 설명 (구현 전) - 2026-02-19 API 경계 정리

## 무엇
- 기존 화면용(Thymeleaf) 흐름은 유지하고, JSON 전용 API를 `/api/v1/*`로 별도 추가한다.
- 상품/주문/사용자 핵심 엔드포인트를 API 전용 컨트롤러로 분리한다.
- API 응답 형식을 `success/data/message`로 통일한다.

## 왜
- 화면 반환과 JSON 반환이 한 컨트롤러에 섞이면 수정 시 회귀 원인을 찾기 어렵다.
- 클라이언트(React 등)에서 예외 처리를 단순화하려면 응답 모양이 일정해야 한다.
- 기존 URL을 지키면서 신규 URL을 추가해야 점진 전환이 가능하다.

## 언제
- 1순위의 두 번째 항목인 `API 경계 정리`를 완료하기 직전 단계에서 수행한다.
- 프론트엔드 전환(2순위) 전에 백엔드 인터페이스를 고정해야 할 때 수행한다.

## 어떻게
- 1단계: 공통 응답 DTO(`success/data/message`)를 먼저 만든다.
- 2단계: `/api/v1/products`, `/api/v1/orders`, `/api/v1/users` 컨트롤러를 신설한다.
- 3단계: 기존 서비스(`SellerService`, `UserService`)를 재사용해 비즈니스 로직 중복을 피한다.
- 4단계: 로그인 세션(`loggedInUser`, `userType`) 규칙을 그대로 사용해 호환성을 유지한다.
- 5단계: 빌드 검증 후 데일리 문서에 변경 근거를 남긴다.

## 쉬운 용어 설명
- API 경계: 화면 응답(HTML)과 데이터 응답(JSON)을 나누는 선.
- 공통 응답 포맷: 성공/실패와 실제 데이터를 같은 모양으로 보내는 규칙.
- 회귀: 수정 후 기존에 되던 기능이 깨지는 현상.

## 오늘 작업 대상 파일(예정)
- `sosos/src/main/java/com/prosos/sosos/dto/ApiResponse.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/dto/UserSessionDto.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/dto/UserLoginApiRequest.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/ProductApiController.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/OrderApiController.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/UserApiController.java` (신규)

## 완료 기준(DoD)
- `/api/v1/products`, `/api/v1/orders`, `/api/v1/users` 핵심 API가 `success/data/message` 형식으로 응답하고, 기존 Thymeleaf URL 동작을 깨지 않는다.
