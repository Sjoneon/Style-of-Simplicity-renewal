# 판매자 대시보드 좌측 메뉴와 매출 보기 학습 (2026-06-16)

## 무엇
- 판매자 대시보드의 상단 탭을 좌측 메뉴로 바꾸고, 홈 관리와 Q&A는 하위 메뉴가 열리는 드롭다운 구조로 정리한다.
- 운영 요약과 매출 화면에서 일 매출, 월 매출, 연 매출을 숫자와 막대 그래프로 확인할 수 있게 만든다.
- 상품 관리는 카테고리 필터, 정렬, 50개 단위 페이지 이동으로 나누어 본다.

## 왜
- 상단 탭이 많아지면 메뉴가 한 줄에 몰려 운영자가 현재 위치를 파악하기 어렵다.
- 매출은 누적 숫자만 보면 흐름을 보기 어렵기 때문에 기간별 막대 그래프가 있으면 변화가 바로 보인다.
- 상품이 많아질수록 한 화면 스크롤은 느리고 불편하므로 카테고리, 정렬, 페이지를 나눠야 관리 속도가 올라간다.

## 언제
- 판매자가 상품 수, 주문 수, 문의 수가 늘어난 뒤에도 같은 대시보드에서 빠르게 운영 상태를 확인해야 할 때 필요하다.
- 홈 배너, 홈 탐색 탭, Q&A 답변 상태처럼 성격이 다른 관리 화면을 하나의 메뉴 안에서 나누고 싶을 때 적용한다.

## 어떻게
1. `SellerDashboardPage`에서 상단 `Tabs`를 제거하고 좌측 사이드 메뉴 상태를 추가한다.
2. 홈 관리는 `homeBanner`, `homeDiscovery` 하위 화면으로 나누고, Q&A는 `answered`, `pending` 하위 화면으로 나눈다.
3. 주문 데이터의 `orderDate`, `totalAmount`, `status`를 이용해 매출 집계를 만든다.
4. 상품 목록은 `category`, `createdDate/id`, `price` 기준으로 필터와 정렬을 적용한 뒤 50개씩 잘라서 보여준다.
5. 소비자 화면과 연결되는 홈 배너, 홈 탐색 탭, 상품, 주문, 문의 API 호출은 기존 함수를 유지하고 화면 표시 계층만 바꾼다.

## 쉬운 용어
- 드롭다운 메뉴: 큰 메뉴를 눌렀을 때 아래에 작은 메뉴가 펼쳐지는 구조다.
- 페이지네이션: 긴 목록을 1페이지, 2페이지처럼 끊어서 보는 방식이다.
- 정렬: 최근 등록 순, 가격 높은 순처럼 목록의 표시 순서를 바꾸는 기능이다.
- 집계: 여러 주문 금액을 더해서 일 매출, 월 매출처럼 하나의 숫자로 계산하는 일이다.
- 막대 그래프: 숫자의 크기를 막대 길이로 보여줘서 비교를 쉽게 해주는 그림이다.

## 오늘 작업 대상 파일
- `frontend/src/pages/SellerDashboardPage.jsx`
- `frontend/src/pages/seller-dashboard/useSellerDashboardController.js`
- `frontend/src/pages/seller-dashboard/sellerDashboardUtils.js`
- `frontend/src/components/seller-dashboard/OverviewTabPanel.jsx`
- `frontend/src/components/seller-dashboard/HomeTabPanel.jsx`
- `frontend/src/components/seller-dashboard/ProductsTabPanel.jsx`
- `frontend/src/components/seller-dashboard/InquiriesTabPanel.jsx`
- `frontend/src/components/seller-dashboard/SellerDashboardSideNav.jsx`
- `frontend/src/components/seller-dashboard/SalesChartPanel.jsx`
- `frontend/src/components/seller-dashboard/SalesTabPanel.jsx`
- `frontend/src/components/AppLayout.jsx`
- `frontend/src/services/inquiryApi.js`
- `frontend/eslint.config.js`
- `sosos/src/main/java/com/prosos/sosos/controller/InquiryController.java`
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/ProductApiController.java`
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/OrderApiController.java`
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/MainBannerApiController.java`
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/DiscoveryTabApiController.java`
- `sosos/docs/daily/2026-05-28.md`
- `sosos/docs/daily/2026-06-16.md`

## 완료 기준
- 판매자 대시보드 좌측 메뉴, 홈/Q&A 드롭다운, 상품 필터/정렬/페이지, 기간별 매출 그래프가 동작하고 프론트 빌드와 한글 깨짐 검사를 통과한다.
