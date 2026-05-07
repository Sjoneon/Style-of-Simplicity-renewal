# 폴더 기반 상품 재등록 학습 메모 (2026-04-29)

## 무엇
- 기존 사이트 상품을 모두 삭제하고, `sosos/uploads` 아래 폴더 구조(`outer`, `top`, `bottoms`, `shoes`, `BAG_acc`)를 기준으로 상품을 다시 등록한다.
- 등록 시 상품명/키워드/탭 노출값을 함께 넣고, 상세 설명 이미지는 공통으로 `test-Detailed-explanation.png`를 사용한다.
- 홈 카테고리에서 `SET CLOTHES`를 제거한다.

## 왜
- 테스트용 데이터가 카테고리/의도와 맞지 않아 추천, 검색, 홈 노출 품질이 떨어지는 문제를 줄이기 위해서다.
- 폴더 기준으로 데이터 정합성을 맞춰야 판매자 운영/소비자 탐색 테스트를 실제 시나리오처럼 진행할 수 있다.
- `SET CLOTHES`는 현재 운영 정책에서 쓰지 않으므로 혼선을 줄이기 위해 제외한다.

## 언제
- 배포 전 실제 운영 데이터 정리 리허설이 필요할 때 사용한다.
- AI 추천/홈 탭/카테고리 필터 검증 전에 기준 데이터를 초기화할 때 사용한다.

## 어떻게
- 대상 파일 경로:
  - `scripts/reseed-products-from-uploads.ps1` (신규)
  - `frontend/src/pages/HomePage.jsx` (`SET CLOTHES` 제거)
  - `frontend/src/pages/SellerDashboardPage.jsx` (`SET CLOTHES` 제거)
- 처리 순서:
  1. `/api/v1/products` 목록 조회 후 전체 삭제
  2. 폴더별 파일을 읽어 상품 1회씩 등록 (대표 이미지)
  3. 상세 설명 이미지는 공통 파일로 업로드
  4. `BEST`는 각 폴더에서 랜덤 3개씩 뽑아 `discoveryTabKeys`에 `ranking`을 추가하지 않고, 카테고리는 원래 카테고리를 유지한 채 `work/new/basic/gift/starter`를 조정한다
  5. 홈 카테고리 상수에서 `SET CLOTHES` 제거
- 완료 기준(Definition of Done):
  - 기존 상품이 제거되고 폴더 기반 상품이 재등록된다.
  - 홈/판매자 화면 카테고리에 `SET CLOTHES`가 더 이상 보이지 않는다.
  - `BEST` 목적의 샘플(폴더별 3개 랜덤)이 탭 노출 규칙에 반영된다.
