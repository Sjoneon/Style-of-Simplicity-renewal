# 2026-04-29 학습 메모 - 한글 주석 스타일 정렬(찜/세일)

## 무엇
- 목표:
  - 최근 반영한 찜/세일/카드 동선 코드에 사후 유지보수용 한글 근거 주석을 추가한다.
  - 어제 적용한 스타일처럼 "왜 필요한지" 중심의 짧은 주석만 남긴다.

## 왜
- 기존 누락:
  - 기능은 동작하지만 핵심 분기 의도가 코드만으로 바로 읽히지 않는 지점이 있었다.
  - 특히 카드 클릭/찜 버튼 이벤트 분리, 정상가 null 처리 이유는 사후 수정 시 오해가 생길 수 있다.

## 언제
- 사용자 피드백으로 주석 보강을 요청받았고, 정책/UX 의도를 코드에 남겨야 할 때 적용한다.

## 어떻게
- 쉬운 용어 설명:
  - 근거 주석: "무엇을 한다"보다 "왜 이렇게 했다"를 적는 설명
- 구현 순서:
  1. 프론트(카드/찜) 핵심 분기 위치에 한글 주석 추가
  2. 백엔드(정상가 정규화) 정책 분기에 한글 주석 추가
  3. 한글 깨짐 문자(`U+FFFD`) 검색으로 인코딩 이상 유무 확인

## 오늘 작업 대상 파일 경로
- `frontend/src/components/ProductList.jsx`
- `frontend/src/pages/HomePage.jsx`
- `sosos/src/main/java/com/prosos/sosos/service/SellerService.java`
- `sosos/docs/daily/learning/README.md`
- `sosos/docs/daily/2026-04-29.md`

## 완료 기준(Definition of Done)
- 핵심 분기에 한글 근거 주석이 반영되고, 깨짐 문자 검색 결과가 0건이다.

## 추가 반영 (옵션/삭제 로직 주석)
- 사용자 요청:
  - 최근 수정 코드에도 한글 주석을 추가하고, 한글 깨짐 여부를 다시 점검한다.
- 반영 파일:
  - `sosos/src/main/java/com/prosos/sosos/controller/api/v1/ProductApiController.java`
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java`
- 추가 주석:
  - 옵션 JSON 파싱 실패 시 CSV(`M:3,L:4`) 허용 이유
  - 탐색 탭/키워드 문자열 fallback 복구 이유
  - 상품 삭제 시 FK 제약 회피를 위한 참조 데이터 선삭제 이유
- 인코딩 점검:
  - UTF-8로 파일을 읽어 신규 한글 주석이 정상 출력되는지 확인
  - `U+FFFD` 포함 여부 검사 결과: `false` (두 파일 모두 이상 없음)
