# 2026-03-27 MyPage 리뷰 실연동 + 알림 배지 실시간 반영 학습

## 무엇
- 마이페이지 `리뷰/문의 내역` 섹션의 `리뷰 작성/조회 기능 연동 준비중` 상태를 실제 API 연동 상태로 바꾼다.
- 알림 페이지/상단 네비게이션에서 알림 집계값(`summary`)을 기반으로 읽지 않은 알림 수를 배지로 표시하고 주기적으로 갱신한다.

## 왜
- `준비중` 상태가 남아 있으면 핵심 화면 이관 완료 기준(화면 5번 항목)이 불명확해진다.
- 알림은 시점이 중요한 기능이므로 수동 새로고침만으로는 사용자 경험이 끊긴다.

## 언제
- 2순위 핵심 화면 마이그레이션을 실질 완료로 마감할 때.
- 주문/문의/재입고/할인 알림을 실제 사용자가 확인하는 단계에서.

## 어떻게
1. 백엔드 리뷰 모델 최소 구현
- `product_reviews` 테이블 추가 (마이그레이션 + seed 반영)
- 엔티티/리포지토리/서비스/DTO/API 추가
- 규칙: 로그인 사용자 본인 주문에 대해서만 리뷰 작성 가능, 주문당 1개 리뷰 제한

2. 프론트 마이페이지 리뷰 연동
- 리뷰 조회/작성 API 서비스 추가
- 마이페이지에서 `내 리뷰` 목록 렌더링
- 작성 가능한 주문 선택 + 평점 + 내용 입력 후 저장

3. 알림 배지 실시간 반영
- 상단 `알림` 메뉴에 unread 배지 표시
- API 요약값 연결 + 주기적 폴링(예: 30초)
- 알림 페이지에서도 요약값 자동 재조회로 숫자 동기화

## 쉬운 용어 설명
- 배지(Badge): 메뉴 옆에 붙는 작은 숫자 표시(예: `3`)
- 집계값(Summary): 알림 데이터를 종류별/전체로 미리 계산한 숫자 묶음
- 폴링(Polling): 일정 시간마다 서버에 다시 물어보는 방식

## 대상 파일
- `sosos/src/main/java/com/prosos/sosos/model/*`
- `sosos/src/main/java/com/prosos/sosos/repository/*`
- `sosos/src/main/java/com/prosos/sosos/service/*`
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/*`
- `sosos/src/main/java/com/prosos/sosos/dto/*`
- `sosos/db/migrations/*`
- `sosos/db/seed/mydb.sql`
- `frontend/src/services/*`
- `frontend/src/pages/MyPagePage.jsx`
- `frontend/src/pages/NotificationsPage.jsx`
- `frontend/src/components/AppLayout.jsx`

## 완료 기준 (Definition of Done)
- 사용자 계정에서 마이페이지 리뷰 작성/조회가 API와 DB에 실제 저장/조회된다.
- 상단 알림 메뉴 배지가 unread 개수를 표시하고, 알림 읽음 처리 시 즉시 반영된다.
- 백엔드 컴파일 + 프론트 린트/빌드 + API 시나리오 테스트가 모두 통과한다.

## 의사결정 1줄
- 이번 리뷰 실연동은 `주문 기반 작성`으로 제한해 데이터 무결성(구매 이력 없는 리뷰 방지)을 먼저 확보한다.
