# 2026-04-30 관리자 API 보안패치 학습 메모

## 무엇
- 목적: 소비자가 URL 경로를 추측하거나 API를 직접 호출해도 판매자 전용 데이터/기능에 접근하지 못하도록 관리자 API 권한 검증을 강화한다.
- 오늘 수정 대상 파일 경로:
  - `sosos/src/main/java/com/prosos/sosos/controller/api/v1/OrderApiController.java`
  - `sosos/src/main/java/com/prosos/sosos/controller/api/v1/ProductApiController.java`
  - `sosos/src/main/java/com/prosos/sosos/controller/InquiryController.java`
  - `sosos/src/main/java/com/prosos/sosos/controller/OrderController.java`
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java`
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java`
  - `frontend/src/services/orderApi.js`
  - `frontend/src/services/productApi.js`
  - `sosos/src/test/java/com/prosos/sosos/controller/api/v1/*` (신규 보안 회귀 테스트)

## 왜
- 프론트 라우팅 가드는 브라우저 화면 진입만 막고, API 직접 호출(예: `curl`)까지 막아주지 못한다.
- 서버에서 세션 사용자 타입(판매자/소비자)과 리소스 소유권(내 상품/내 주문)까지 검증해야 실제 보안이 완성된다.

## 언제
- 관리자 전용 기능(상품 등록/수정/삭제, 판매자 주문 처리, 전체 문의 조회)이 있는 시점부터 바로 적용한다.
- 배포 전에는 반드시 무권한 호출 차단(401/403) 테스트와 정상 기능 회귀 테스트를 같이 실행한다.

## 어떻게
1. 컨트롤러에서 `HttpSession` 기반 판매자 로그인 여부를 먼저 검증한다.
2. 클라이언트 파라미터의 `sellerId`를 신뢰하지 않고, 세션의 판매자 ID를 서버가 강제로 사용한다.
3. 서비스에서 주문/상품이 해당 판매자 소유인지 추가 검증한다.
4. 보안 회귀 테스트를 추가해서:
   - 비로그인/소비자 계정이 판매자 API를 호출하면 차단되는지,
   - 판매자 정상 시나리오는 계속 동작하는지 확인한다.

## 완료 기준(Definition of Done)
- 관리자 API 무권한 호출이 401/403으로 차단되고, 판매자 정상 기능(주문 조회/상품 등록·수정·삭제/문의 관리)이 회귀 없이 동작한다.
