# 2026-04-30 홈/마이페이지 대형 컴포넌트 분해 학습

## 무엇
- `frontend/src/pages/HomePage.jsx`, `frontend/src/pages/MyPagePage.jsx`를 기능별 파일로 분해한다.
- 기준:
  - 페이지/섹션 컴포넌트 파일은 250줄 이내 유지
  - 단일 함수는 100줄 이내 유지

## 왜
- 700줄~1200줄짜리 단일 페이지는 수정 범위 파악이 느리고 회귀 위험이 커진다.
- 기능별 폴더 구조(`home`, `mypage`)를 잡아야 다음 작업자가 파일 위치를 바로 찾을 수 있다.

## 언제
- 하나의 페이지 파일이 250줄을 넘기거나,
- 데이터 로딩 + 상태 계산 + UI 렌더 + 폼 제출이 한 파일에 몰릴 때 즉시 분해한다.

## 어떻게
1. 공용 상수/순수 함수 분리 (`utils`, `constants`)
2. 페이지 상태/이벤트를 커스텀 훅으로 이동 (`useHomePageController`, `useMyPageController`)
3. 섹션별 UI 컴포넌트 분리 (`components/home/*`, `components/mypage/*`)
4. 원본 페이지는 라우트 진입점(조립자) 역할만 남긴다.

## 오늘 대상 파일 경로
- 기존:
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/pages/MyPagePage.jsx`
- 신규:
  - `frontend/src/pages/home/*`
  - `frontend/src/pages/mypage/*`
  - `frontend/src/components/home/*`
  - `frontend/src/components/mypage/*`

## 의사결정 1줄
- 홈/마이페이지를 기능 폴더 단위로 재구성해 "파일 위치를 한눈에 찾는 구조"를 우선 확보한다.

## 완료 기준 (Definition of Done)
- Home/MyPage 진입 페이지가 각각 250줄 이내로 축소된다.
- 기존 사용자 기능(조회/검색/찜/리뷰/주소/계정)이 동작한다.
- 프론트 린트/빌드, 백엔드 컴파일, 서버 실행 확인이 통과한다.
