# 2026-03-27 알림 정식 모델/API 구현 학습

## 무엇
기존 로컬 파생형 알림(`localStorage`)을 서버 저장형 알림으로 전환한다.

작업 대상 파일
- 백엔드
  - `sosos/src/main/java/com/prosos/sosos/model/Notification.java` (신규)
  - `sosos/src/main/java/com/prosos/sosos/repository/NotificationRepository.java` (신규)
  - `sosos/src/main/java/com/prosos/sosos/dto/NotificationDto.java` (신규)
  - `sosos/src/main/java/com/prosos/sosos/controller/api/v1/NotificationApiController.java` (신규)
  - `sosos/src/main/java/com/prosos/sosos/service/NotificationService.java` (신규)
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java` (주문/상품 트리거 연동)
  - `sosos/src/main/java/com/prosos/sosos/controller/InquiryController.java` (문의 답변 트리거 연동)
- 프론트
  - `frontend/src/services/notificationApi.js` (서버 API 기반으로 교체)
  - `frontend/src/pages/NotificationsPage.jsx` (읽음 상태 서버 반영)
- DB 스크립트
  - `sosos/db/migrations/2026-03-27-notification-schema.sql` (신규)

완료 기준(DoD)
- 일반 사용자 기준으로 알림 목록을 DB에서 조회할 수 있다.
- 알림 읽음 처리(개별/전체)가 서버에 저장된다.
- 아래 이벤트 발생 시 알림이 생성된다.
  - 주문 상태 변경
  - 문의 답변 등록/수정
  - 찜 상품 재입고(0개 -> 양수)
  - 찜 상품 가격 인하(할인)
- 프론트 린트/빌드, 백엔드 컴파일이 통과한다.

의사결정 1줄
- 알림은 사용자별 영속 저장(DB)으로 전환한다. 이유: 새로고침/기기 변경/재로그인 상황에서도 일관된 알림 이력을 유지해야 하기 때문이다.

## 왜
현재 알림은 브라우저 `localStorage` 기반 파생형이라 다음 문제가 있다.
- 기기/브라우저 변경 시 알림 이력이 사라짐
- 서버 기준 읽음 상태 동기화 불가
- 운영자가 이벤트를 발생시켜도 사용자별 신뢰 가능한 기록이 어려움

쇼핑몰 운영 단계로 가려면 알림도 주문/문의처럼 서버 데이터로 관리해야 한다.

## 언제
- 2026-03-27
- 핵심 화면 MVP(고객센터/마이페이지/알림 1차) 이후
- 로드맵의 "알림 데이터 모델/API 설계 확정" 착수 시점

## 어떻게
1. `Notification` 엔티티/리포지토리/DTO/API를 추가한다.
2. `SellerService` 주문 상태 변경 지점에 알림 생성 호출을 연결한다.
3. `InquiryController` 답변 등록/수정 지점에 알림 생성 호출을 연결한다.
4. `SellerService.updateProduct()`에서 기존 가격/재고 대비 변화 감지 후 찜 사용자 대상 알림을 생성한다.
5. 프론트 알림 페이지를 서버 API 기반으로 교체하고 읽음 처리 API를 사용한다.
6. 컴파일/린트/빌드 검증 후 문서를 업데이트한다.
