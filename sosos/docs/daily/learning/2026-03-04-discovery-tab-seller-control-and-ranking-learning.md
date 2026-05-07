# 2026-03-04 학습 메모 - 탐색 탭 판매자 제어 + 랭킹 판매횟수 정렬

## 무엇
- 홈 탐색 탭 `처음 시작 / 선물 / 신상 / 기본템 / 출근 룩` 노출 여부를 판매자가 직접 설정/해제할 수 있게 만든다.
- 홈 `랭킹` 탭은 재고 기준이 아니라 실제 판매 횟수 기준으로 정렬되게 바꾼다.
- 대상 파일:
  - `sosos/src/main/java/com/prosos/sosos/model/Product.java`
  - `sosos/src/main/java/com/prosos/sosos/dto/ProductDto.java`
  - `sosos/src/main/java/com/prosos/sosos/repository/OrderRepository.java`
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java`
  - `frontend/src/pages/SellerDashboardPage.jsx`
  - `frontend/src/services/productApi.js`
  - `frontend/src/pages/HomePage.jsx`
- 완료 기준(Definition of Done):
  - 판매자가 상품 등록/수정에서 5개 탐색 탭 노출을 제어할 수 있다.
  - 체크 해제 시 해당 탭에서 상품이 내려간다.
  - 랭킹 탭이 `판매횟수 높은 순`으로 노출된다.

## 왜
- 기존 탐색 탭은 프론트 하드코딩 조건이라 시간이 지나도 `신상` 탭에서 자동으로 내려가지 않는다.
- 운영자가 상품 노출을 직접 관리해야 현실적인 운영이 가능하다.
- 랭킹은 사용자에게 “실제 많이 팔린 상품” 신뢰를 주어야 한다.

## 언제
- 신상 기간이 지나 탭에서 제외하고 싶을 때.
- 특정 상품을 선물/출근 룩 큐레이션에서 빼고 싶을 때.
- 랭킹을 재고량이 아니라 판매 성과 기준으로 보여주고 싶을 때.

## 어떻게
1. `Product`에 탐색 탭 노출 플래그 5개(`Boolean`)를 추가한다.
2. `ProductDto`로 해당 값을 주고받고, 판매횟수(`soldCount`) 필드도 추가한다.
3. `OrderRepository`에서 상품별 판매 수량 합계를 집계한다(취소/반품 제외).
4. `SellerService.getAllProducts`에서 집계 결과를 DTO에 합쳐서 내려준다.
5. 판매자 대시보드 등록/수정 폼에 체크박스를 추가해 저장/수정 API로 전달한다.
6. 홈 탐색 탭은 “설정값 우선 + 값이 없으면 기존 규칙 fallback”으로 필터링한다.
7. 홈 랭킹 정렬은 `soldCount DESC`로 변경한다.

## 쉬운 용어 설명
- `fallback`: 새 데이터가 없을 때 임시로 기존 규칙을 쓰는 보완 방식.
- `판매횟수 집계`: 주문 데이터에서 상품별 판매 수량을 합산해 숫자로 만드는 작업.
