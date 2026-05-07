# 2026-03-19 배송지 저장 후 미반영 표시 이슈 학습

## 무엇
마이페이지 배송지 저장 후 화면에서 값이 사라져 보이는 문제를 수정한다.

작업 대상 파일
- `sosos/src/main/java/com/prosos/sosos/dto/UserSessionDto.java`

완료 기준(DoD)
- `PUT /api/v1/users/me/address` 성공 후 `GET /api/v1/users/me` 응답에 `address`가 포함된다.
- 프론트 `refreshSession()` 이후 배송지 입력 폼이 비어 보이지 않는다.

## 왜
저장은 DB에 정상 반영되는데, 세션 갱신 API(`/api/v1/users/me`) 응답 DTO에 `phone`, `address` 필드가 없어서 프론트 상태가 빈 값으로 덮였다.
즉 저장 실패가 아니라 "표시 데이터 누락" 문제였다.

## 언제
- 카카오 주소검색 기반 배송지 저장 UX 적용 직후
- 사용자 테스트에서 "저장 후 새로고침되고 안 저장된 것처럼 보임" 피드백이 들어온 시점

## 어떻게
1. `UserSessionDto`에 `phone`, `address` 필드를 추가한다.
2. `fromUser()`에서 사용자 `phone`, `address`를 DTO에 세팅한다.
3. 서버 재기동 후 API 시나리오(회원가입/로그인/배송지 저장/세션조회)로 응답 필드를 확인한다.
