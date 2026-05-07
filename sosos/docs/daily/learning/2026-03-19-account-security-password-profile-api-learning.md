# 2026-03-19 계정 보안 API(비밀번호/프로필) 선구현 학습

## 무엇
- 마이페이지의 보안 민감 기능을 위해 백엔드 API를 먼저 만든다.
- 대상: 비밀번호 변경, 회원정보 수정, 배송지 수정

### 오늘 작업 대상 파일 경로
- `sosos/src/main/java/com/prosos/sosos/dto/UserPasswordChangeRequest.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/dto/UserProfileUpdateRequest.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/dto/UserAddressUpdateRequest.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/service/UserService.java`
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/UserApiController.java`
- `frontend/src/services/userApi.js`
- `sosos/docs/security/account-security-policy.md` (신규)

### 완료 기준(DoD)
- 로그인 사용자 기준으로 비밀번호 변경 API가 동작하고, 성공 시 세션이 무효화된다.
- 회원정보/배송지 수정 API가 동작하고 세션 사용자 정보가 최신 상태로 갱신된다.
- 프론트 서비스에 신규 API 호출 함수가 추가된다.

## 왜
- 프론트 화면만 먼저 만들면 실제 보안 검증 없이 민감 기능이 노출된다.
- 비밀번호 변경은 현재 비밀번호 검증/해시/세션 처리가 같이 들어가야 안전하다.

## 언제
- 마이페이지 UX를 기능 연동 단계로 올리기 전에 백엔드 계약(API)부터 고정할 때 적용한다.

## 어떻게
1. 보안 정책 문서(비밀번호 규칙/세션 처리) 먼저 작성
2. 요청 DTO 추가
3. `UserService`에 비밀번호 변경/프로필 수정/배송지 수정 로직 추가
4. `UserApiController`에 `/me/password`, `/me/profile`, `/me/address` 엔드포인트 추가
5. 프론트 `userApi.js`에 호출 함수 추가
6. 린트/빌드/컴파일 검증

## 쉬운 용어 설명
- 세션 무효화: 기존 로그인 상태를 끊어서 다시 로그인하게 만드는 처리
- 계약(API contract): 프론트와 백엔드가 약속하는 요청/응답 구조
