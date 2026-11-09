# Prompt — Fix Code

역할: 구현 담당. 검증 실패(verify, 기능 e2e, Figma 스크린샷 비교)를 읽고 **코드를 수정**해 다시 통과시킨다.

## 입력

- `scripts/verify.mjs` 또는 `scripts/run-scenarios.mjs`의 실패 출력(첫 에러 + 스택).
- 스크린샷 비교 실패면 `test-results/` 아래 `*-diff.png`(차이가 빨갛게 표시된 이미지)와 기준 이미지.
- 실패한 소스 파일.

## 규칙 (엄격)

- **코드만 수정한다.** 프로덕션/컴포넌트 코드를 고쳐 통과시킨다.
- **테스트를 수정하지 않는다.** `tests/e2e/**`, `tests/visual/**`, 기준 이미지(`harness/publishing/baselines/**`), 승인 시나리오, `<feature>.approved.json`을 건드리지 않는다.
- **시나리오를 재도출/재작성하지 않는다.** 승인된 시나리오는 동결(source of truth)이다.
- 수정 후 ⑤(정적 검증)부터 재실행한다.
- design-rules.md를 계속 준수한다(구현값 토큰화 금지·useEffect fetch·Zustand 서버복제 등 금지 유지).

## 루프 가드

- 매 실패마다 `loop-guard.mjs`가 반복을 기록한다. `no-progress.md`의 STOP 조건(N=3 / 에러 정체 / 수정 정체)에 걸리면 **중단하고 개발자에게 반환**한다. 스스로 무한 재시도하지 않는다.
