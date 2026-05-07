# 초기 SOS 프로젝트 문제점 정리 (AWS 배포 목표 기준)

## 목표 맥락
최종 목표는 프론트엔드/백엔드를 분리하고 AWS에 배포 가능한 운영형 웹사이트를 여는 것이다.

## 치명 이슈 (Critical)
1. 보안 기본선이 운영 수준에 미달
- 로그인 로직에서 평문 비밀번호 비교를 사용한다.
  - `sosos/src/main/java/com/prosos/sosos/service/UserService.java:44`
  - `sosos/src/main/java/com/prosos/sosos/service/UserService.java:60`
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java:60`
- 판매자 로그인은 빈 비밀번호를 허용한다.
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java:60`
  - `sosos/src/main/java/com/prosos/sosos/controller/UserController.java:76`
- DB 접속정보가 소스 설정에 하드코딩되어 있다.
  - `sosos/src/main/resources/application.properties:1`
  - `sosos/src/main/resources/application.properties:2`
  - `sosos/src/main/resources/application.properties:3`
- Actuator가 `*`로 전면 노출되어 있고 보안 계층이 보이지 않는다.
  - `sosos/src/main/resources/application.properties:20`
- `pom.xml`에 Spring Security 의존성이 없다.

2. API와 서버 렌더링 MVC 경계가 섞여 있음
- `/api/*` 컨트롤러가 JSON API와 Thymeleaf 뷰 반환을 혼용한다.
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java:32`
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java:71`
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java:130`
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java:144`
  - `sosos/src/main/java/com/prosos/sosos/controller\OrderController.java:21`
  - `sosos/src/main/java/com/prosos/sosos/controller\OrderController.java:128`
- 응답 형식이 DTO/문자열/`Map.of("message", ...)`로 혼재되어 프로젝트 목표의 통일 포맷과 다르다.
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java:167`
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java:200`
  - `sosos/src/main/java/com/prosos/sosos/controller\OrderController.java:39`

3. 배포 이식성이 낮음
- 정적 리소스/이미지 업로드 경로가 특정 윈도우 사용자 경로에 하드코딩되어 있다.
  - `sosos/src/main/java/com/prosos/sosos/config/WebConfig.java:14`
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java:154`
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java:181`
- 상품 등록 후 리다이렉트 URL이 localhost로 고정되어 있다.
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java:60`

## 높음 이슈 (High)
1. 세션/권한 검증 일관성 부족
- 판매자 대시보드 엔드포인트는 인증 판매자 세션 검증이 없다.
  - `sosos/src/main/java/com/prosos/sosos/controller/SellerController.java:56`
- 세션 기반 검증이 컨트롤러 곳곳에 분산되어 중앙화된 권한 가드가 없다.
  - `sosos/src/main/java/com/prosos/sosos/controller/UserController.java:77`
  - `sosos/src/main/java/com/prosos/sosos/controller/UserController.java:92`

2. 주문/재고 처리 트랜잭션 부재
- 구매 로직에서 재고 차감과 주문 저장을 `@Transactional` 없이 처리해 동시성/부분 실패 리스크가 있다.
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java:217`
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java:220`
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java:296`
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java:300`

3. 데이터 모델 신뢰성 공백
- `Order.quantity` 필드가 존재하지만 구매 플로우에서 명시 설정이 없어 null/불일치 가능성이 있다.
  - `sosos/src/main/java/com/prosos/sosos/model/Order.java:24`
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java:220`
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java:300`

## 중간 이슈 (Medium)
1. 운영 설정 완성도 부족
- `spring.jpa.hibernate.ddl-auto=update`는 운영 마이그레이션에 위험하다.
  - `sosos/src/main/resources/application.properties:7`
- 뷰 prefix/suffix가 JSP 방식으로 설정되어 Thymeleaf 설정과 혼동 여지가 있다.
  - `sosos/src/main/resources/application.properties:22`
  - `sosos/src/main/resources/application.properties:23`

2. 레거시/미사용 로직 존재
- `userCartData` 메모리 장바구니와 DB 장바구니 흐름이 공존해 유지보수 비용이 증가한다.
  - `sosos/src/main/java/com/prosos/sosos/service/UserService.java:31`
  - `sosos/src/main/java/com/prosos/sosos/service/UserService.java:138`

3. 운영 로그/예외 처리 미흡
- 핵심 플로우에서 `System.out.println`, `printStackTrace()`를 사용한다.
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java:158`
  - `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java:246`
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java:243`

## 목표 아키텍처 대비 구조 공백
- `frontend/` 디렉터리가 아직 없다 (React + Vite 미착수).
- `docker/` 디렉터리, `Dockerfile`, 배포용 정의 파일이 없다.
- 현재 루트가 `sosos/`이며 목표인 `backend/` + `frontend/` 분리가 미적용 상태다.
- 테스트 소스 트리(`src/test`)가 없다.

## AWS 런칭 기준 권장 처리 순서
1. 보안 기본선: 비밀번호 해시, 엄격 로그인 검증, 환경변수 기반 시크릿, Actuator 최소 노출.
2. API 경계 정리: 기존 Thymeleaf는 유지하고 `/api/v1/*` JSON 전용 컨트롤러를 분리.
3. 환경 이식성 확보: 로컬 하드코딩 경로 제거, 환경별 저장소 전략(로컬/S3) 도입.
4. 무결성 보강: 주문/재고 처리 트랜잭션화, 수량 필드 명시 반영.
5. 프론트 전환 시작: `frontend/` 생성 후 핵심 화면부터 React 마이그레이션.
6. 배포 준비: 백엔드 Dockerize, 프론트 S3 배포, RDS 연결 및 프로파일 분리.
