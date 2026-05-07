# SOS 리뉴얼 (Style of Simplicity Renewal)

## 프로젝트 일시중단 안내 (중요)
- 사유: 정보처리기사 실기 준비
- 중단 기간: 2026-04-01 ~ 2026-04-18
- 재개 예정일: 2026-04-19
- 상세 공지: [PROJECT-PAUSE-NOTICE.md](./PROJECT-PAUSE-NOTICE.md)

## 최종 목표
기존 Spring Boot + Thymeleaf 기반 쇼핑몰을 React 프론트 + REST API 구조로 전환하고, AWS 배포 가능한 운영 상태까지 정리합니다.  
결제는 테스트 키 기반으로 UI/주문 흐름 검증까지를 범위로 합니다.

## 리뉴얼 우선순위
1. 운영 기본선 정리  
   - 비밀번호 해시, 환경변수 분리, dev/prod 분리, Actuator 노출 최소화
2. API 경계 정리  
   - `/api/v1/*` JSON API 분리, 공통 응답 형식(`success/data/message`) 적용
3. 주문/재고 무결성 보강  
   - 트랜잭션 적용, 동시성 제어, 상태/수량 일관성 확보
4. 프론트 전환  
   - React + Vite + MUI 기반으로 핵심 화면 전환
5. 배포/운영 마무리  
   - Docker 기반 배포 준비, AWS(EC2/RDS/S3) 적용

## 진행 현황
### 1순위 (완료)
- 백엔드 운영 기본선 정리: 완료 (2026-02-15)
- API 경계 정리: 완료 (2026-02-19)
- 주문/재고 무결성 보강: 완료 (2026-02-22)

### 2순위 (진행 중)
- `frontend/` 초기 구성 완료 (React + Vite + MUI + Axios)
- 핵심 화면 마이그레이션 진행 중
  - 완료: 메인, 상품상세, 장바구니, 로그인/회원가입, 판매자 대시보드
  - 완료: 고객센터(`/support`) MVP (문의 작성/조회/삭제, 관리자 답변 연동)
  - 완료: 마이페이지(`/mypage`) MVP + 계정 보안 API 연동
  - 완료: 알림(`/notifications`) DB 연동 1차
  - 완료: 리뷰/찜/최근 본 상품 연동 1차
- 홈 탐색 탭 동적 관리, 카테고리 필터/정렬 반영 완료
- 이미지/파일 저장 전략(local/S3 분리) 구현 완료, 운영 리허설 대기
  - 완료: `dev(local)` / `prod(S3)` 분기 업로드/조회
  - 완료: S3 모드 스모크 테스트 코드 반영
  - 대기: 실제 AWS 자격증명 기반 최종 검증 (EC2 + IAM Role)

### 3순위 (예정)
- 배포 준비 정리 (Dockerfile, CORS, 도메인)
- AWS 배포 (EC2, RDS, S3, 필요 시 CloudFront)
- 통합 테스트/운영 점검

## 기술 스택
- Backend: Java 21, Spring Boot 3.3.5, Spring Data JPA, MySQL 8.0
- Frontend: React 19, Vite 7, MUI 7, Axios
- Infra: AWS EC2, RDS, S3, Docker
