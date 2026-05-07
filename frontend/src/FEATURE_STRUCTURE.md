# 프론트 기능 폴더 맵

## 홈 화면
- `pages/HomePage.jsx`: 홈 화면 라우트 진입점(조립만 담당)
- `pages/home/homeConfig.js`: 홈 상수
- `pages/home/homeUtils.js`: 필터/정렬/탭 계산 순수 함수
- `pages/home/homeSearchStorage.js`: 검색어 로컬 저장소 처리
- `pages/home/useHomePageController.js`: 홈 상태/이벤트 컨트롤러
- `components/home/HomeHeroBanner.jsx`: 상단 배너 UI
- `components/home/HomeFilterTabs.jsx`: 탐색/카테고리 탭 UI
- `components/home/HomeSearchSummaryBar.jsx`: 검색 요약/정렬 UI
- `components/home/HomeSearchDialog.jsx`: 검색 다이얼로그 UI

## 마이페이지
- `pages/MyPagePage.jsx`: 마이페이지 라우트 진입점(조립만 담당)
- `pages/mypage/myPageConfig.js`: 마이페이지 상수/폼 기본값
- `pages/mypage/myPageUtils.js`: 날짜/가격/주소/정렬 유틸
- `pages/mypage/useMyPageController.js`: 마이페이지 상태/이벤트 컨트롤러
- `components/mypage/MyPageHeaderCard.jsx`: 상단 요약 카드
- `components/mypage/MyPageSectionCard.jsx`: 공통 접힘 섹션 래퍼
- `components/mypage/MyPageOrdersSection.jsx`: 주문 섹션
- `components/mypage/MyPageBenefitsSection.jsx`: 혜택 섹션
- `components/mypage/MyPageInterestSection.jsx`: 찜/최근 본 섹션
- `components/mypage/MyPageReviewsSection.jsx`: 리뷰/문의 섹션
- `components/mypage/MyPageShippingSection.jsx`: 배송지 섹션
- `components/mypage/MyPageAccountSection.jsx`: 계정 섹션

## 판매자 대시보드
- `pages/SellerDashboardPage.jsx`: 판매자 대시보드 라우트 진입점(조립만 담당)
- `pages/seller-dashboard/sellerDashboardUtils.js`: 파싱/정규화 유틸
- `pages/seller-dashboard/useSellerDashboardController.js`: 대시보드 상태/이벤트 컨트롤러
- `components/seller-dashboard/OverviewTabPanel.jsx`: 운영 요약 탭
- `components/seller-dashboard/HomeTabPanel.jsx`: 홈 관리 탭
- `components/seller-dashboard/ProductsTabPanel.jsx`: 상품 관리 탭
- `components/seller-dashboard/OrdersTabPanel.jsx`: 주문/배송 탭
- `components/seller-dashboard/InquiriesTabPanel.jsx`: Q&A 탭
- `components/seller-dashboard/ProductDialog.jsx`: 상품 등록/수정 다이얼로그

## 컨트롤러 반환 규칙
- 컨트롤러 훅은 평면 반환 대신 도메인 그룹으로 반환한다.
- 권장 그룹: `ui`, `data`, `metrics`, `filters/view`, `actions`
- 페이지는 그룹 단위로만 꺼내고, 섹션 컴포넌트에는 필요한 값만 전달한다.
