# 토스 테스트 키 결제 연동 (주문서 -> 결제 승인) (2026-04-30)

## 무엇
- 결제 흐름을 `바로 주문/장바구니 주문 -> 주문서 -> 토스 결제창 -> 서버 승인 -> 주문 생성`으로 구성한다.
- 키는 코드에 하드코딩하지 않고 환경변수로만 관리한다.
- 적용 파일:
  - `frontend/src/pages/CheckoutPage.jsx`
  - `frontend/src/pages/CheckoutTossSuccessPage.jsx`
  - `frontend/src/pages/CheckoutTossFailPage.jsx`
  - `frontend/src/utils/tossPaymentsSdk.js`
  - `frontend/src/services/paymentApi.js`
  - `sosos/src/main/java/com/prosos/sosos/controller/api/v1/PaymentApiController.java`
  - `sosos/src/main/java/com/prosos/sosos/service/TossPaymentService.java`

## 왜
- 테스트 키로 결제 UX는 검증하면서 실제 청구는 막아야 한다.
- 시크릿 키는 서버에서만 사용해야 결제 보안이 유지된다.
- 주문서 화면(배송지/요청사항/결제수단)을 먼저 거치는 것이 실제 쇼핑몰 사용자 흐름과 맞다.

## 언제
- 포트폴리오/리허설 단계에서 결제 흐름을 실제처럼 시연해야 할 때
- 실운영 결제 전, 결제 승인/실패 케이스를 먼저 검증할 때

## 어떻게
1. 프론트에서 토스 SDK로 결제창을 연다. (`VITE_TOSS_CLIENT_KEY`)
2. 성공 URL에서 `paymentKey/orderId/amount`를 수신한다.
3. 백엔드 승인 API(`/api/v1/payments/toss/confirm`)가 `TOSS_SECRET_KEY`로 토스 승인 API를 호출한다.
4. 승인 성공 후 기존 주문 API(`purchaseProduct`/`purchaseCart`)를 호출한다.
5. 실패 URL에서는 오류를 보여주고 주문서로 복귀시킨다.

## 쉬운 용어 설명
- 클라이언트 키: 결제창을 띄울 때 프론트에서 쓰는 공개 키
- 시크릿 키: 결제 승인 요청 때 서버에서만 쓰는 비공개 키
- 승인 API(confirm): 결제 완료를 서버가 최종 확인하는 단계

## 완료 기준(Definition of Done)
- 결제 버튼 클릭 시 주문서에서 토스 결제창으로 이동한다.
- 성공 URL에서 서버 승인 후 주문이 생성된다.
- 시크릿 키가 프론트 코드/저장소에 노출되지 않는다.
- 프론트 린트/빌드, 백엔드 컴파일, 한글 깨짐 점검이 통과한다.
