# SOS 오늘 액션 보드 (개인 확인용)

## 전체 진행 확인
- 전체 우선순위/예상 기간: `docs/master-renewal-roadmap.md`

## 오늘 시작 전 3분 체크
- [x] 오늘 P1 1개 + P2 1개만 선택했는가
- [x] 오늘 ETA를 정했는가 (`YYYY-MM-DD HH:mm`)
- [x] 완료 기준(무엇을 하면 끝인지)을 1줄로 적었는가

## 진행 우선순위
### 1) 백엔드 실행 안정화 (환경변수 Fail Fast)
- [x] `DB_USERNAME`, `DB_PASSWORD` 누락 시 시작 단계 즉시 실패 처리
- [x] prod + s3 조합에서 `APP_STORAGE_S3_BUCKET` 누락 즉시 실패 처리
- [x] `.env` 자동 주입 코드는 제외(사용자 피드백 반영)
- 완료 기준: 필수값 누락 원인이 런타임 초기에 명확히 노출된다

### 2) 배포 준비 파일 정리
- [x] `sosos/Dockerfile` 추가
- [x] `sosos/.dockerignore` 추가
- [x] CORS 도메인 설정 외부화(`APP_CORS_ALLOWED_ORIGINS`)
- [x] 환경변수 표준안 문서화(`docs/deployment/env-standard.md`)
- [x] EC2 + IAM Role 리허설 절차 문서화(`docs/deployment/ec2-iam-role-rehearsal.md`)
- 완료 기준: 운영 전환 시 코드 수정 없이 환경변수만으로 실행 기준을 맞출 수 있다

### 3) S3 실자격증명 업로드 성공 검증 마무리
- [x] 실검증 자동화 테스트 추가(`S3CredentialSmokeTest`)
- [ ] 실제 버킷으로 업로드/조회/삭제 성공 로그 확보
- [ ] EC2 IAM Role 환경에서 동일 테스트 성공 로그 확보
- 완료 기준: 로컬/EC2에서 같은 스모크 테스트가 모두 성공한다

## 오늘 기록(15분)
- [x] 학습 문서 작성/피드백 반영
- [x] 일일 로그 작성 (`docs/daily/2026-04-27.md`)
- [x] 학습 문서 인덱스 업데이트 (`docs/daily/learning/README.md`)
- [x] 작업 요약 문서 최신화 (`docs/work-summary.md`)

## 다음 작업 예고
1. `RUN_S3_SMOKE_TEST=true` + 실버킷 값으로 로컬 스모크 테스트 성공 로그 확보
2. EC2 인스턴스에서 IAM Role 기반 스모크 테스트 재현
3. 운영 실제 도메인으로 `APP_CORS_ALLOWED_ORIGINS` 최종 확정

## 완료 메모 (추가)
- [x] 테스트 상품 대량 세팅 완료
  - `scripts/seed-test-products.ps1 -Count 20` 실행
  - 상품 수: 3 -> 23
