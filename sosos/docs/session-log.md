---
## [2026-02-24 18:00] - P2-4 프론트엔드 프로젝트 시작 완료

### 💻 최종 확정 코드/설정
- `frontend/` Vite React 프로젝트 생성
- 프론트 의존성 추가
  - `@mui/material`, `@emotion/react`, `@emotion/styled`, `axios`
- API 연동 코드 추가
  - `frontend/src/services/api.js` (Axios 인스턴스)
  - `frontend/src/services/productApi.js` (`GET /api/v1/products`)
  - `frontend/src/components/ProductList.jsx` (목록/로딩/에러 UI)
  - `frontend/src/App.jsx` (API 호출 및 상태 렌더링)
  - `frontend/src/main.jsx` (MUI ThemeProvider/CssBaseline)
  - `frontend/vite.config.js` (dev 포트 3000, `/api` 프록시)
- 백엔드 연동 설정 보강
  - `sosos/src/main/java/com/prosos/sosos/config/WebConfig.java`에 `/api/**` CORS 허용 Origin 추가

### 🔧 설치/버전 정보
- Node.js: `v24.13.0`
- npm: `11.6.2`
- 실행/검증 명령어
  - `cd frontend && npm install`
  - `cd frontend && npm run dev`
  - `cd frontend && npm run build`
  - `cd frontend && npm run lint`
  - `cd sosos && ./mvnw.cmd spring-boot:start`
  - `GET http://127.0.0.1:8085/api/v1/products` -> `200 OK`

### 📝 핵심 요약
프론트 시작 구성을 React+Vite+MUI+Axios로 고정하고, 백엔드 상품 API 1개 연동까지 확인해 P2-4 완료 기준을 충족했다.
---

## [2026-02-22 14:37] - P1-3 주문/재고 무결성 보강 완료

### 💻 최종 확정 코드/설정
- `sosos/src/main/java/com/prosos/sosos/repository/ProductRepository.java`에 `findByIdForUpdate`(PESSIMISTIC_WRITE) 추가
- `sosos/src/main/java/com/prosos/sosos/service/UserService.java`에 `@Transactional purchaseCart(User)` 추가, 장바구니→재고 차감→주문 저장→장바구니 삭제를 원자적으로 처리하도록 변경
- `sosos/src/main/java/com/prosos/sosos/service/UserService.java`에서 장바구니 목록 정렬 전 리스트 복사 처리로 불변 리스트 `sort()` 예외 가능성 제거
- `sosos/src/main/java/com/prosos/sosos/service/SellerService.java`의 주문 상태 변경/즉시구매 메서드에 트랜잭션 적용, 즉시구매 시 `Order.quantity=1`, `ORDERED`, `totalAmount` 저장 일관화
- `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java` 구매 엔드포인트를 서비스 호출(`userService.purchaseCart`)로 단순화
- `sosos/src/main/java/com/prosos/sosos/dto/OrderDto.java` 수량 매핑을 `order.getQuantity()` 기준으로 수정
- 검증 테스트 추가
- `sosos/src/test/java/com/prosos/sosos/service/UserServicePurchaseCartTest.java`
- `sosos/src/test/java/com/prosos/sosos/service/SellerServicePurchaseTest.java`
- `sosos/src/test/java/com/prosos/sosos/dto/OrderDtoMappingTest.java`

### 🔧 설치/버전 정보
- 추가 설치 없음
- 검증 명령어
- `./mvnw.cmd clean compile`
- `./mvnw.cmd test` (총 6개 테스트 통과)
- `./mvnw.cmd spring-boot:start`
- `./mvnw.cmd spring-boot:stop`
- 실기동 검증 결과
- 즉시구매 성공, 장바구니 구매 성공
- 주문 수 `0 -> 2`, 재고 `5 -> 3`, 신규 주문 `quantity` 모두 `1`

### 📝 핵심 요약
주문/재고 처리 경로를 트랜잭션+락 기반으로 통일하고 주문 수량 저장/조회 기준을 고정해 데이터 불일치 리스크를 제거했다.
---
## [2026-02-19 23:13] - P1-2 API 경계 정리 및 보안 푸시 방지 설정

### 💻 최종 확정 코드/설정
- `/api/v1/*` JSON 전용 컨트롤러 추가
  - `sosos/src/main/java/com/prosos/sosos/controller/api/v1/ProductApiController.java`
  - `sosos/src/main/java/com/prosos/sosos/controller/api/v1/OrderApiController.java`
  - `sosos/src/main/java/com/prosos/sosos/controller/api/v1/UserApiController.java`
- 공통 응답 포맷 DTO 추가: `sosos/src/main/java/com/prosos/sosos/dto/ApiResponse.java` (`success/data/message`)
- 로그인 세션 응답용 DTO 추가
  - `sosos/src/main/java/com/prosos/sosos/dto/UserSessionDto.java`
  - `sosos/src/main/java/com/prosos/sosos/dto/UserLoginApiRequest.java`
- dev DB 설정에서 기본 계정/비밀번호 하드코딩 제거
  - `sosos/src/main/resources/application-dev.properties`
  - `spring.datasource.username=${DB_USERNAME}`
  - `spring.datasource.password=${DB_PASSWORD}`
- Git 푸시 시 시크릿/로컬 설정 제외 규칙 추가
  - `.gitignore`
  - `sosos/.gitignore`

### 🔧 설치/버전 정보
- 빌드/검증 명령어
  - `./mvnw.cmd clean package -DskipTests`
  - `./mvnw.cmd test` (현재 테스트 코드 없음)
  - `./mvnw.cmd spring-boot:start`, `./mvnw.cmd spring-boot:stop`
- 실행 환경 변수(검증 시)
  - `SPRING_PROFILES_ACTIVE=dev`
  - `DB_URL=jdbc:mysql://127.0.0.1:3306/SOS_db`
  - `DB_USERNAME` / `DB_PASSWORD`

### 📝 핵심 요약
기존 Thymeleaf는 유지한 채 `/api/v1` API 경계를 분리하고 응답 형식을 통일했으며, GitHub 푸시 시 민감정보가 올라가지 않도록 설정을 고정했다.
---
## [2026-02-13 01:57] - 인코딩 표시 이슈 수정

### 💻 최종 확정 코드/설정
- 내부 작업 기준 문서를 UTF-8 with BOM으로 저장해 Windows 콘솔 환경에서 한글 깨짐 가능성을 낮춤
- PowerShell 출력 확인 시 UTF-8 인코딩으로 정상 표시 검증

### 🔧 설치/버전 정보
- 별도 설치 없음
- 인코딩 점검 환경: Windows PowerShell (기본 코드페이지 949)

### 📝 핵심 요약
콘솔 코드페이지(CP949)와 UTF-8 파일 간 표시 차이로 발생한 사소한 한글 깨짐 이슈를 파일 인코딩 정리로 해결.
---
