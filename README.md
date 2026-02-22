# SOS 리뉴얼 (Style of Simplicity Renewal)

## 한 줄 목표
기존 Spring Boot + Thymeleaf 기반 쇼핑몰을 React 프론트 + REST API 구조로 전환하고, AWS 배포까지 가능한 상태까지를 목표로 함.
단, 결제의 경우는 실 결제 전 단계까지 진행하는것으로 제한

## 리뉴얼 핵심 우선순위
1. 운영 기본선 확보: 비밀번호 해시, 환경변수 분리, dev/prod 분리, Actuator 최소 노출
2. API 경계 정리: `/api/v1/*` JSON API 분리, 공통 응답 포맷(`success/data/message`) 적용
3. 주문/재고 무결성: 트랜잭션 적용, 재고 동시성 제어, 수량 저장 일관성 확보
4. 프론트 전환: React + Vite + MUI로 핵심 화면 이전
5. 배포/운영: Docker 기반 배포 준비 후 AWS(EC2/RDS/S3) 적용

## 진행 현황
### 1순위 (완료)
- 백엔드 운영 기본선 정리: 완료 (2026-02-15)
- API 경계 정리: 완료 (2026-02-19)
- 주문/재고 무결성 보강: 완료 (2026-02-22)

### 2순위 (예정)
- `frontend/` 초기 구성 (React + Vite + MUI + Axios)
- 메인/상세/장바구니/로그인/판매자 대시보드 마이그레이션
- 이미지/파일 저장 전략 정리 (local/S3 분리)

### 3순위 (예정)
- 배포 설정 정리 (Dockerfile, CORS, 도메인)
- AWS 배포 (EC2, RDS, S3, 필요 시 CloudFront)
- 통합 테스트/운영 점검

## 기술 스택
- Backend: Java 17, Spring Boot 3.3.5, Spring Data JPA, MySQL 8.0
- Frontend(전환 목표): React 18, Vite, MUI, Axios
- Infra(배포 목표): AWS EC2, RDS, S3, Docker

## 실행 방법 (백엔드)
```bash
cd sosos
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Windows PowerShell:
```powershell
cd sosos
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

## 참고 문서
- 전체 로드맵: `sosos/docs/master-renewal-roadmap.md`
- P1 작업 요약: `sosos/docs/work-summary.md`
