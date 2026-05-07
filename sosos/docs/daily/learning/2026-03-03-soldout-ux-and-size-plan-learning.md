# 2026-03-03 SOLD OUT UX 정리 + 사이즈 확장 계획 학습 노트

## 무엇
- 상품 카드에서 `재고 있음` 뱃지를 제거한다.
- 재고가 0인 상품은 `SOLD OUT`으로 명확히 표기한다.
- 상품 상세 페이지에서 품절 상품에 대해 `장바구니 담기`/`바로 주문` 버튼을 눌렀을 때 `SOLD OUT` 안내를 띄운다.
- 서버에서도 품절 상태를 다시 검증해 품절 주문/담기를 막는다.

## 왜
- `재고 있음`은 대부분 상품에서 반복되어 정보 가치가 낮다.
- 품절은 사용자가 꼭 알아야 하는 예외 상황이므로 강조 표시가 필요하다.
- 프론트에서만 막으면 우회 호출(API 직접 호출)로 주문이 들어갈 수 있어 서버 검증이 필요하다.

## 언제
- 핵심 화면 마이그레이션(로드맵 5번) UX 다듬기 단계에서 즉시 적용한다.
- 완료 기준(DoD):
  - 리스트 카드에서 `재고 있음` 문구가 사라진다.
  - 품절 상품 카드에만 `SOLD OUT` 표시가 보인다.
  - 상세에서 품절 상태로 액션 클릭 시 `SOLD OUT` 안내가 뜬다.
  - 서버 API도 품절 시 실패 응답을 준다.

## 어떻게
1. 프론트 리스트 카드 변경
- `ProductList.jsx`에서 재고 칩을 조건부 렌더링:
  - 재고 있음: 미표시
  - 재고 없음: `SOLD OUT`

2. 프론트 상세 액션 변경
- `ProductDetailPage.jsx`에서 버튼을 품절이라고 비활성화하지 않고 클릭 가능 상태로 둔다.
- 클릭 시 즉시 재고 확인 후 `SOLD OUT` 메시지를 표시한다.

3. 백엔드 재고 검증 강화
- `UserService.addToCart`에서 재고 부족/품절 검사 추가
- `SellerService.processPurchase`와 `UserService.purchaseCart`의 품절 메시지 명확화

4. 사이즈(옵션) 확장 계획
- 현재 구조는 단일 재고(one-stock) 모델이라 사이즈 선택이 없다.
- 다음 단계에서 `상품옵션(사이즈별 재고)` 테이블을 도입해야 한다.
  - 판매자: 사이즈별 재고 등록
  - 사용자: 상세에서 사이즈 선택 후 장바구니/주문
  - 주문: 어떤 사이즈를 샀는지 기록

## 쉬운 용어 설명
- one-stock 모델: 상품마다 재고 숫자 1개만 관리하는 방식
- 옵션 모델: 같은 상품을 사이즈(S/M/L 등)별로 따로 재고 관리하는 방식
- 서버 검증: 화면이 아니라 API 서버에서 최종 규칙을 다시 확인하는 것

## 오늘 작업 대상 파일(예정)
- `frontend/src/components/ProductList.jsx`
- `frontend/src/pages/ProductDetailPage.jsx`
- `sosos/src/main/java/com/prosos/sosos/service/UserService.java`
- `sosos/src/main/java/com/prosos/sosos/service/SellerService.java`
- `sosos/docs/daily/2026-03-03.md`
