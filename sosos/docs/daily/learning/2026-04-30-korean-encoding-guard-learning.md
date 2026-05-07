# 2026-04-30 한글 인코딩 재발 방지 가드 학습 메모

## 무엇
- 프로젝트 전역에서 깨진 한글(모지바케) 패턴을 스캔하고, 재발 방지를 위한 인코딩 가드를 추가한다.
- 작업 대상:
  - 루트 `.editorconfig`
  - `scripts/check-korean-garbled.ps1`
  - `.vscode/settings.json`
  - `sosos/docs/daily/codex-preflight-checklist.md`

## 왜
- 깨진 한글은 예외 메시지/주석의 의미 전달을 망가뜨려 유지보수와 디버깅 속도를 크게 낮춘다.
- 특히 Windows 환경에서 파일 저장 인코딩이 섞이면 같은 문제가 반복되기 쉽다.

## 언제
- 한글 주석/문구를 다루는 기능 작업 전후
- 대량 문서/코드 수정 후 인코딩 이상 여부를 점검할 때

## 어떻게
1. 전역 스캔
- `U+FFFD`, `?[가-힣]`, 비정상 유니코드 구간(호환 한자 영역) 패턴을 탐지
2. 저장 인코딩 강제
- `.editorconfig`로 UTF-8 저장 규칙을 기본 강제
- VS Code 설정에 `files.encoding=utf8`, `files.autoGuessEncoding=false` 적용
3. 자동 점검 스크립트
- 깨짐 패턴 검사 스크립트를 추가해 작업 전후 1회 실행
4. 체크리스트 반영
- preflight 체크리스트에 “깨진 한글 패턴 점검” 항목을 추가해 습관화

## 완료 기준(Definition of Done)
- 전역 스캔에서 깨짐 패턴이 없고, UTF-8 저장 규칙 + 자동 점검 절차가 프로젝트에 반영된다.
