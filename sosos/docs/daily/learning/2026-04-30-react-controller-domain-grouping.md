# React 컨트롤러 도메인 그룹 리팩터링 (2026-04-30)

## 무엇
- 페이지 컴포넌트에서 `useXxxController()` 반환값을 한 줄에 많이 펼치는 구조를, **도메인별 그룹 객체**로 바꾼다.
- 대상 파일:
  - `frontend/src/pages/mypage/useMyPageController.js`
  - `frontend/src/pages/MyPagePage.jsx`
  - `frontend/src/pages/home/useHomePageController.js`
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/pages/seller-dashboard/useSellerDashboardController.js`
  - `frontend/src/pages/SellerDashboardPage.jsx`

## 왜
- 반환값이 30~50개로 늘어나면, 어떤 값이 어디 책임인지 빠르게 파악하기 어렵다.
- 유지보수 시 실수(잘못된 prop 전달, 이름 충돌, 불필요 재렌더 원인 추적 실패)가 늘어난다.
- 그룹으로 묶으면 "주문 관련, 리뷰 관련, UI 관련"처럼 읽는 즉시 맥락이 보인다.

## 언제
- 훅 반환값이 많아져 페이지 최상단 destructuring이 길어질 때
- 페이지가 섹션 컴포넌트로 나뉘어 있고, 섹션마다 필요한 데이터 범위가 다를 때
- 신규 기능이 자주 추가되어 상태/핸들러가 계속 늘어나는 시점

## 어떻게
1. 반환 구조를 도메인 단위로 나눈다.
   - 예: `auth`, `orders`, `reviews`, `account`, `ui`, `actions`
2. 페이지 컴포넌트는 그룹 단위로 받는다.
   - 기존: 긴 평면 구조
   - 변경: `const { auth, orders, ... } = useMyPageController()`
3. 섹션 컴포넌트 전달 값도 그룹 기준으로 읽기 쉽게 정리한다.
4. 리팩터링 후 린트/빌드/백엔드 컴파일 및 스모크 호출로 정상 동작을 검증한다.

## 쉬운 용어 설명
- 도메인: 기능 묶음(예: 주문, 리뷰, 계정)
- 컨트롤러 훅: 페이지에서 필요한 상태/행동을 모아주는 훅
- 그룹 객체: 관련 값들을 하나의 객체로 묶은 구조

## 완료 기준(Definition of Done)
- 세 페이지(Home/MyPage/SellerDashboard)에서 평면 destructuring 제거
- 컨트롤러 반환값이 도메인 그룹 형태로 변경
- `npm run lint`, `npm run build`, `mvn -q -DskipTests compile` 통과
- 주요 경로 스모크 응답 정상(홈/마이페이지/판매자 대시보드/API)
