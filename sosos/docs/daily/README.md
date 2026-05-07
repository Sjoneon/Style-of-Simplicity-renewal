# 일일 기록 작성 규칙

## 파일 구조
- 날짜별 파일로 분리: `docs/daily/YYYY-MM-DD.md`
- 템플릿 원본: `docs/daily/_template.md`
- 학습 문서: `docs/daily/learning/*.md`
- 학습 인덱스: `docs/daily/learning/README.md`
- TIL 문서: `docs/daily/til/*.md`

## 사용 방법
1. `_template.md`를 복사해서 오늘 날짜 파일을 생성한다.
2. 구현 전 체크리스트와 완료 기준을 먼저 기록한다.
3. 구현 후 검증 명령과 결과를 기록한다.
4. 새 대화 인수인계가 필요하면 `docs/work-summary.md`를 함께 갱신한다.

## 권장 작성 길이
- 각 항목 1~3줄
- 코드/명령 예시 1~2개
- 전체 400~800자 권장

## 유지 원칙
- 일일 로그 본문은 사실 기록 중심으로 유지한다.
- 과거 로그는 수정 최소화, 현재 상태 문서는 별도 문서에서 동기화한다.
- 상태 동기화 우선 문서
  - `README.md`
  - `docs/master-renewal-roadmap.md`
  - `docs/work-summary.md`
  - `docs/daily/today-action-board.md`
