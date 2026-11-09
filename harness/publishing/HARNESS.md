# Figma-to-Code Publishing Harness

행동명세와 Figma 프레임을 기준으로 퍼블리싱하고, 승인 게이트와 검증 루프로 결과를 보호하는 agent-agnostic 하네스이다.

실행 절차는 [`RUNBOOK.md`](./RUNBOOK.md), Figma 전용 규칙은 [`design-rules.md`](./design-rules.md), 공통 코드 규칙은 [`../shared/code-rules.md`](../shared/code-rules.md)를 따른다.

## 구조

```text
harness/
├─ no-progress.md
├─ shared/
│  └─ code-rules.md
├─ publishing/
│  ├─ HARNESS.md
│  ├─ RUNBOOK.md
│  ├─ design-input-contract.md
│  ├─ design-rules.md
│  ├─ prompts/
│  ├─ templates/
│  ├─ specs/
│  ├─ baselines/       # Figma 기준 이미지
│  └─ approvals/
└─ artifacts/
   ├─ publishing/       # runtime only
   └─ loop-state.json  # runtime only
```

`publishing/approvals`는 승인 해시가 포함된 durable 기록이고, `publishing/baselines`는 승인 대상인 Figma 기준 이미지이므로 Git으로 추적한다. `artifacts/publishing`과 `loop-state.json`은 실행 중 생성되며 Git에 커밋하지 않는다.

## 흐름

```text
행동명세 + Figma 입력
→ ① Figma 추출(토큰·기준 이미지) / 시나리오 초안
→ ② 개발자 승인
→ ③ 테스트 작성 — 테스트 담당(구현 전, 구현을 보지 않음) → 동결
→ ④ 구현 — 구현 담당(테스트 수정 불가)
→ ⑤ 정적 검증
→ ⑥ 기능 e2e + Figma 스크린샷 비교 (반복 가드)
→ ⑦ 개발자 최종 확인
```

테스트 담당과 구현 담당은 서로 다른 세션이다. 역할과 권한은 [`RUNBOOK.md`](./RUNBOOK.md) "역할"을 따른다.

## 주요 명령

| 명령                                 | 역할                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `yarn harness:map-tokens <feature>`  | Figma 덤프에서 토큰 후보와 구현값 분리                       |
| `yarn harness:approve <feature> ...` | 시나리오 승인 해시 생성 또는 테스트 동결                     |
| `yarn harness:gate <feature>`        | 승인 파일과 해시 검증 (`--stage implement`: 테스트 동결까지) |
| `yarn harness:verify`                | lint, typecheck, style-policy, build                         |
| `yarn harness:loop <cmd> <feature>`  | 반복 상태와 STOP 조건 관리                                   |
| `yarn verify:e2e <feature>`          | 게이트 후 기능 e2e + Figma 스크린샷 비교                     |

기존 feature 인자는 내부적으로 `publishing:<feature>` scope로 관리한다.

## 경로 계약

- 입력 spec: `harness/publishing/specs/<feature>.spec.md`
- 승인 시나리오: `harness/publishing/approvals/<feature>.scenario-draft.md`
- 승인 sentinel: `harness/publishing/approvals/<feature>.approved.json`
- Figma 덤프: `harness/artifacts/publishing/<feature>.figma.txt`
- 토큰 산출물: `harness/artifacts/publishing/<feature>.token-candidates.json`
- 컴포넌트 맵: `harness/artifacts/publishing/<feature>.component-map.md`
- Figma 기준 이미지: `harness/publishing/baselines/<feature>/<frame>.png`
- 선택자 계약: `harness/artifacts/publishing/<feature>.selector-contract.md`
- e2e: `tests/e2e/<feature>.spec.ts`
- 스크린샷 비교: `tests/visual/<feature>.visual.ts` (`playwright.visual.config.ts`)

스크립트는 runtime 디렉터리가 없으면 자동 생성한다.

## 안전장치

- 해시 검증은 기록된 해시가 있을 때만 비교한다.
  - 승인 시나리오: 기능 테스트 대상이면 승인 때 기록되고, 이후 바뀌면 실패한다.
  - 기준 이미지: 승인 때 있었으면 기록되고, 이후 바뀌거나 승인 뒤 새로 생기면 실패한다.
  - e2e·스크린샷 테스트: ③에서 동결(`--freeze`)한 뒤에만 해시가 생기고, 그 뒤 바뀌면 실패한다. 동결 전에는 해시가 없다.
- 테스트가 동결되기 전에는 구현 단계 게이트(`--stage implement`)를 통과하지 못한다.
- `requires_functional_test: false`도 퍼블리싱 승인 sentinel은 필요하다.
- 테스트나 승인 파일을 수정해 실패를 숨기지 않는다.
- 퍼블리싱 요청에서 명세에 없는 실제 API를 임의로 연결하지 않는다.
- 동일 오류 또는 동일 diff가 반복되거나 3회에 도달하면 `no-progress.md`에 따라 중단한다.

## 레퍼런스

`notice-list`는 이동 후에도 기존 승인 시나리오와 e2e 해시를 유지하는 회귀 기준이다.
