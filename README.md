# SOS 리뉴얼 프로젝트 (Style of Simplicity Renewal)

Spring Boot + Thymeleaf 기반 쇼핑몰을 **React + REST API 구조**로 전환하고,  
AWS(EC2/RDS/S3/CloudFront) 운영까지 마무리한 포트폴리오 프로젝트입니다.

## 프로젝트 목적
- 기존 서버 렌더링 구조를 SPA + API 구조로 전환
- 사용자/판매자 핵심 흐름을 실제 운영 환경 수준으로 정리
- 배포 후 장애를 복구/문서화하는 운영 역량까지 포함

## 운영 주소
- 서비스: 포트폴리오에 올려져 있으며 이곳에는 임시로 내렸습니다. 감사합니다.

## 핵심 기능
### 사용자
- 상품 목록/상세 조회, 검색/정렬
- 장바구니, 주문/결제 플로우(테스트 결제 연동 구조)
- 로그인/회원가입, 마이페이지(주소/비밀번호/최근 본 상품)
- 고객센터 문의 등록/조회
- AI 스타일 추천(대화형)

### 판매자
- 판매자 로그인/대시보드
- 상품 등록/수정/삭제
- 메인 배너 관리

### 운영/보안
- S3 저장 전략(local/s3 분기)
- Turnstile 연동 구조
- SQLi 방어 가드(`SqlInputGuardService`)
- CloudFront + WAF 운영 장애 복구 기준 정리

## 기술 스택
- Backend: Java 21, Spring Boot 3.3.5, Spring Data JPA, MySQL 8
- Frontend: React 19, Vite 7, MUI 7, Axios
- Infra: AWS EC2, RDS, S3, CloudFront, WAF

## 저장소 구조
```text
.
├─ frontend/                  # React 앱
├─ sosos/                     # Spring Boot 앱
│  ├─ src/
│  ├─ docs/                   # 문서(올리지 않음.)
│  └─ pom.xml
├─ scripts/                   # 점검/보조 스크립트
└─ README.md
```

## 현재 상태
- 2026-05-11 기준 1차 마감
- 핵심 사용자/판매자/운영 플로우 정상 동작
- AI 추천 기능의 경우 지속적인 업데이트가 필요한 상태(추천 시스템의 정리가 필요)

## 라이선스
- 별도 LICENSE 파일 정책을 따릅니다. (없다면 추후 명시 예정)

### 본 프로젝트는 1인 개발로 저작권은 해당 계정의 주인에게 있음을 사전 공지 드립니다.
