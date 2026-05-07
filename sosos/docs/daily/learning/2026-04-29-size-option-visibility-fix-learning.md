# 상세페이지 사이즈 선택 미노출 수정 (2026-04-29)

## 무엇
- 소비자 상품 상세페이지에서 사이즈 선택 UI가 보이지 않던 문제를 수정했다.
- 정책은 `BAG_ACC`만 사이즈 미사용, `OUTER/TOP/BOTTOMS/SHOES`는 사이즈 필수 노출로 맞췄다.

## 왜
- 상세페이지 사이즈 UI는 상품 옵션(`options`) 데이터가 있어야 렌더링된다.
- 기존 재시드 데이터가 옵션 없이 등록되어 카테고리와 무관하게 선택 UI가 숨겨졌다.

## 언제
- 폴더 기반 상품 재등록 직후, 소비자 로그인 상태에서 상세페이지 주문 흐름 검증 시 적용.

## 어떻게
- 백엔드
  - `ProductApiController.parseOptionDtos`에 CSV fallback 파서를 추가했다.
  - 예: `optionsJson=M:3,L:4,XL:3` 형태도 허용.
- 데이터 시드
  - `scripts/reseed-products-from-uploads.ps1`에서
    - `OUTER/TOP/BOTTOMS/SHOES`는 `optionsJson`을 함께 전송.
    - `BAG_ACC`는 옵션 미전송(사이즈 없음 유지).
  - 재시드 실행으로 전체 상품을 다시 등록.

## 완료 기준
- API 기준 옵션 상태
  - `OUTER/TOP/BOTTOMS/SHOES`: 모든 상품 `options > 0`
  - `BAG_ACC`: 모든 상품 `options = 0`
- 소비자 상세페이지에서 비 `BAG_ACC` 상품은 사이즈 선택 UI가 노출된다.
