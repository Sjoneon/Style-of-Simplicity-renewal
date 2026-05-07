# 문의 번호 표시 방식 변경 학습 (2026-04-30)

## 무엇
- 소비자 고객센터의 문의 카드 제목에서 전역 DB ID(`#{inquiry.id}`)를 숨기고, 화면 순번(`내 문의 1, 2, 3...`)으로 표시한다.

### 오늘 작업 대상 파일 경로
- `frontend/src/pages/CustomerCenterPage.jsx`
- `sosos/docs/daily/learning/2026-04-30-inquiry-display-sequence-learning.md`
- `sosos/docs/daily/learning/README.md`
- `sosos/docs/daily/2026-04-30.md`

### 완료 기준(DoD)
- 문의 목록 카드 제목이 `#ID` 대신 `내 문의 {순번}` 형태로 보인다.
- 첨부 이미지 alt 문구도 전역 ID 대신 화면 순번 기준으로 맞춰진다.

## 왜
- 문의 ID는 테이블 전체 자동증가값이라 사용자 관점에서 순번이 점프해 보일 수 있다.
- 사용자에게는 내 목록 기준 순번이 더 직관적이다.

## 언제
- 2026-04-30, 사용자 피드백으로 번호 점프 혼란이 확인된 즉시 반영한다.

## 어떻게
1. `visibleInquiries.map((inquiry) => ...)`를 `map((inquiry, index) => ...)`로 변경한다.
2. 카드 제목을 `#{inquiry.id}`에서 `내 문의 ${index + 1}`로 치환한다.
3. 첨부 이미지 `alt` 텍스트도 동일 순번 기준으로 치환한다.

## 쉬운 용어 설명
- 전역 ID: 모든 사용자가 공유하는 데이터의 고유 번호
- 화면 순번: 현재 화면에 보이는 목록의 1번, 2번처럼 정렬된 순서 번호
