# 상품 등록 실패 수정: 업로드 절대경로 제거 + 오류 메시지 정리

## 무엇
- 상품 이미지 저장 경로를 사용자 PC 고정 절대경로에서 프로젝트 기준 경로로 변경했다.
- 정적 이미지 리소스 매핑(`/images/**`)도 새 업로드 경로 기준으로 맞췄다.
- 상품 등록 API 오류 메시지를 정상 한글로 정리했다.

## 왜
- 기존 경로(`C:/Users/Roneon/...`)는 현재 개발 환경에서 권한 거부가 발생해 상품 등록이 실패했다.
- 절대경로 하드코딩은 다른 PC/서버에서 동일 오류를 반복하게 만든다.
- 오류 문구가 깨져서 원인 파악이 어려웠다.

## 언제
- 요청 반영 일시: 2026-03-03
- 반영 범위: 백엔드 상품 업로드/리소스 설정

## 어떻게
- `SellerService`
  - `app.upload.base-dir` 설정값을 주입받아 업로드 루트 경로를 결정
  - 대표 이미지: `uploads/`
  - 상세 이미지: `uploads/description/`
  - 디렉터리 없으면 `Files.createDirectories`로 생성
- `WebConfig`
  - `/images/**`를 `app.upload.base-dir`의 절대 경로 URI로 매핑
- `ProductApiController`
  - 상품 등록/수정 성공/실패 메시지 정리
  - 런타임 오류를 `500 + 메시지`로 응답
- 설정 파일
  - `application-dev.properties`, `application-prod.properties`에 `app.upload.base-dir` 추가

## 쉬운 용어
- 절대경로: 특정 PC의 고정 폴더 주소
- 상대(설정) 경로: 환경에 따라 바꿀 수 있는 경로
- 리소스 매핑: URL(`/images/...`)을 실제 파일 폴더와 연결하는 설정

## 완료 기준(Definition of Done)
- 상품 등록 시 이미지 저장 경로 권한 오류가 재발하지 않는다.
- 등록 실패 시 메시지가 깨지지 않고 원인을 읽을 수 있다.
