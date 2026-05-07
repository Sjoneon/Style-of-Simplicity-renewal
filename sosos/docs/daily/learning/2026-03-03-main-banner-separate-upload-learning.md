# 2026-03-03 메인 광고 배너 분리 업로드 학습 노트

## 무엇
- 홈 상단 광고 배너를 상품 대표이미지 재사용 방식에서 분리한다.
- 슈퍼관리자(판매자)가 대시보드에서 배너 이미지를 별도로 업로드/삭제할 수 있게 만든다.
- 홈 화면은 배너 전용 API를 조회해서 캐러셀로 노출한다.

## 왜
- 지금 구조는 "상품 이미지가 있으면 배너에 노출"이라 운영 의도가 반영되지 않는다.
- 배너는 보통 이벤트/추천/기획전처럼 상품 목록과 다른 기준으로 관리해야 한다.
- 판매자가 직접 배너를 바꾸면 홈 첫 화면 메시지를 빠르게 운영할 수 있다.

## 언제
- 로드맵 5번(핵심 화면 마이그레이션) 진행 중, 홈 UX와 슈퍼관리자 운영 기능을 함께 보강하는 단계에서 적용한다.
- 완료 기준(DoD):
  - 슈퍼관리자 대시보드에서 배너 이미지 업로드 가능
  - 업로드한 배너가 홈 메인 캐러셀에 노출
  - 배너 클릭 시 연결된 상품 상세로 이동(연결 상품이 있을 때)
  - 슈퍼관리자 대시보드에서 배너 삭제 가능

## 어떻게
1. 백엔드에 배너 전용 모델을 추가한다.
- `MainBanner` 엔티티 + `MainBannerDto` + `MainBannerRepository`
- 배너 이미지 저장 경로는 기존 업로드 루트 아래 `banners/` 하위 폴더를 사용

2. 배너 전용 API를 추가한다.
- 공개 조회: `GET /api/v1/banners`
- 관리자 조회: `GET /api/v1/banners/manage`
- 관리자 업로드: `POST /api/v1/banners` (multipart/form-data)
- 관리자 삭제: `DELETE /api/v1/banners/{id}`

3. 프론트 API 모듈을 추가한다.
- `frontend/src/services/bannerApi.js`에서 배너 조회/업로드/삭제 함수 제공

4. 홈 화면을 배너 API 기반으로 바꾼다.
- `HomePage.jsx`에서 `bannerProducts` 대신 `banners` 상태 사용
- 캐러셀 순환/이전/다음/클릭 이동 로직은 유지하되 데이터 소스만 변경

5. 슈퍼관리자 대시보드에 배너 관리 섹션을 추가한다.
- 배너 업로드 폼: 제목, 설명, 연결 상품(선택), 노출 순서, 이미지 파일
- 등록 배너 목록: 썸네일, 제목, 연결 상품, 순서, 삭제 버튼

## 쉬운 용어 설명
- 배너: 메인 상단에서 자동으로 넘어가는 큰 홍보 이미지 영역
- 캐러셀: 여러 이미지를 일정 간격으로 순서대로 보여주는 UI
- multipart 업로드: 텍스트와 파일을 같이 서버로 보내는 방식
- 연결 상품: 배너를 눌렀을 때 이동할 상품 상세 페이지 대상

## 오늘 작업 대상 파일(예정)
- `sosos/src/main/java/com/prosos/sosos/model/MainBanner.java`
- `sosos/src/main/java/com/prosos/sosos/dto/MainBannerDto.java`
- `sosos/src/main/java/com/prosos/sosos/repository/MainBannerRepository.java`
- `sosos/src/main/java/com/prosos/sosos/service/MainBannerService.java`
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/MainBannerApiController.java`
- `frontend/src/services/bannerApi.js`
- `frontend/src/pages/HomePage.jsx`
- `frontend/src/pages/SellerDashboardPage.jsx`
- `sosos/docs/daily/2026-03-03.md`
