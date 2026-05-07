# 소규모 운영용 슈퍼관리자 전용 접근 구조

## 무엇
- 일반 사용자 로그인(`/auth`)과 관리자 로그인(`/admin/login`)을 분리합니다.
- 관리자 기능 화면은 `/admin/dashboard`에서만 접근 가능하게 합니다.
- 현재 프로젝트는 소규모 테스트 기준이므로 관리자 권한은 `슈퍼관리자 1종`만 사용합니다.

## 왜
- 사용자 로그인과 관리자 로그인을 분리하면 운영 실수가 줄어듭니다.
- 관리자 페이지 URL을 고정하면 권한 검증 흐름이 단순해집니다.
- 소규모 환경에서는 복잡한 다중 관리자 권한보다 단일 권한이 유지/테스트에 유리합니다.

## 언제
- 요청 반영 일시: 2026-03-03
- 적용 범위: React 라우팅/인증 UI

## 어떻게
- `frontend/src/components/RequireAdmin.jsx` 추가
  - 로그인 여부 + 사용자 타입(`seller`)을 검사하는 관리자 전용 가드
  - 미로그인 시 `/admin/login`으로 이동
- `frontend/src/pages/AdminLoginPage.jsx` 추가
  - 관리자 전용 로그인 폼
  - 일반 사용자로 로그인되면 관리자 접근 차단
- `frontend/src/App.jsx` 수정
  - `/admin/login`, `/admin/dashboard` 라우트 추가
  - 기존 `/seller/dashboard`는 `/admin/dashboard`로 리다이렉트
- `frontend/src/pages/AuthPage.jsx` 수정
  - 판매자 로그인 성공 시 이동 경로를 `/admin/dashboard`로 변경
- `frontend/src/pages/SellerDashboardPage.jsx` 수정
  - 화면 문구를 슈퍼관리자 기준으로 정리

## 쉬운 용어
- 가드(Guard): 특정 권한이 없으면 화면 접근을 막는 장치
- 리다이렉트: 다른 주소로 자동 이동시키는 처리
- 슈퍼관리자: 모든 관리자 기능에 접근 가능한 단일 최고 권한

## 완료 기준(Definition of Done)
- `/admin/login`에서만 관리자 로그인이 가능하다.
- `/admin/dashboard`는 슈퍼관리자(`seller`)만 접근된다.
- 기존 판매자 로그인 후 이동 경로가 관리자 대시보드로 연결된다.
