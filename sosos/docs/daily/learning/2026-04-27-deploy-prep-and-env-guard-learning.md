# 2026-04-27 학습 메모 - 배포 준비 + .env 자동 주입

## 무엇
- 작업 목표:
  - 백엔드 실행 시 필수 DB 환경변수 누락을 시작 단계에서 즉시 감지
  - `DB_USERNAME`, `DB_PASSWORD` 누락 시 원인을 바로 알 수 있게 실행 초기에 실패 처리
  - S3 실자격증명 업로드 검증 절차 마무리
  - 배포 준비 파일(`Dockerfile`, CORS/도메인 설정, 환경변수 표준안) 정리

## 피드백 반영
- 기존 설명의 수정점:
  - 초안에 `.env 자동 주입 코드`를 포함했지만, 사용자 피드백으로 해당 접근은 제외했다.
- 최종 반영 기준:
  - `.env 자동 주입`은 하지 않는다.
  - 대신 백엔드 시작 시 필수 환경변수 누락을 명확한 메시지로 즉시 실패 처리한다.

## 왜
- 현재 문제:
  - DB 계정 값이 비어 있을 때 애플리케이션이 애매한 에러로 실패할 수 있음
  - CORS 허용 도메인이 코드에 하드코딩되어 배포 시 변경이 번거로움
  - 배포용 실행 규칙(환경변수 목록, Docker 실행 방식)이 문서로 고정되어 있지 않음
- 기대 효과:
  - 신규 개발자도 `run` 한 번으로 로컬 실행 가능
  - 운영 전환 시 도메인/환경변수를 코드 수정 없이 교체 가능
  - S3 연동 검증 상태를 로그/문서로 재현 가능

## 언제
- 적용 시점:
  - 로컬 개발 실행 직전
  - EC2 배포 준비 전
  - S3 파일 저장 전략 최종 마감 전

## 어떻게
- 쉬운 용어 설명:
  - `Fail Fast`: 필수값이 없으면 나중에 큰 장애가 나기 전에 시작 단계에서 즉시 멈추는 방식
  - `IAM Role`: EC2 서버가 AWS 리소스에 접근할 때 쓰는 서버용 권한 카드
- 구현 순서:
  1. 필수 DB 환경변수 누락 감지(명확한 메시지로 실행 중단)
  2. CORS 허용 도메인을 환경변수로 외부화
  3. 백엔드 `Dockerfile` 및 배포용 무시 파일 추가
  4. 환경변수 표준 문서/예시 파일 업데이트
  5. S3 실자격증명 업로드 검증 명령 실행 및 결과 기록

## 오늘 작업 대상 파일 경로
- `sosos/src/main/resources/application.properties`
- `sosos/src/main/resources/application-dev.properties`
- `sosos/src/main/resources/application-prod.properties`
- `sosos/src/main/java/com/prosos/sosos/config/WebConfig.java`
- `sosos/src/main/java/com/prosos/sosos/SososApplication.java`
- `sosos/.env.example`
- `sosos/src/test/java/com/prosos/sosos/service/storage/S3CredentialSmokeTest.java` (신규)
- `sosos/Dockerfile` (신규)
- `sosos/.dockerignore` (신규)
- `sosos/docs/deployment/env-standard.md` (신규)
- `sosos/docs/deployment/ec2-iam-role-rehearsal.md` (신규)
- `sosos/docs/daily/2026-04-27.md` (신규)
- `sosos/docs/work-summary.md`
- `sosos/docs/daily/today-action-board.md`

## 완료 기준(Definition of Done)
- `sosos` 백엔드를 실행할 때 DB 필수값 누락은 즉시 명확히 실패하고, 배포 준비 문서와 Docker 실행 기준 및 EC2/IAM Role 리허설 절차가 최신 상태로 정리된다.
