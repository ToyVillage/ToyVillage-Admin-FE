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
│  └─ approvals/
└─ artifacts/
   ├─ publishing/       # runtime only
   └─ loop-state.json  # runtime only
```

`publishing/approvals`는 승인 해시가 포함된 durable 기록이므로 Git으로 추적한다. `artifacts/publishing`과 `loop-state.json`은 실행 중 생성되며 Git에 커밋하지 않는다.

## 흐름

```text
행동명세 + Figma 입력
→ Figma 추출 / 시나리오 초안
→ 개발자 승인
→ 승인 게이트
→ 퍼블리싱
→ 정적 검증
→ 조건부 Playwright 테스트
→ 반복 가드
→ 개발자 육안 확인
```

## 주요 명령

| 명령                                 | 역할                                   |
| ------------------------------------ | -------------------------------------- |
| `yarn harness:map-tokens <feature>`  | Figma 덤프에서 토큰 후보와 구현값 분리 |
| `yarn harness:approve <feature> ...` | 시나리오 승인 해시 생성 또는 e2e 동결  |
| `yarn harness:gate <feature>`        | 승인 파일과 해시 검증                  |
| `yarn harness:verify`                | lint, typecheck, style-policy, build   |
| `yarn harness:loop <cmd> <feature>`  | 반복 상태와 STOP 조건 관리             |
| `yarn verify:e2e <feature>`          | 승인 게이트 후 Playwright 실행         |

기존 feature 인자는 내부적으로 `publishing:<feature>` scope로 관리한다.

## 경로 계약

- 입력 spec: `harness/publishing/specs/<feature>.spec.md`
- 승인 시나리오: `harness/publishing/approvals/<feature>.scenario-draft.md`
- 승인 sentinel: `harness/publishing/approvals/<feature>.approved.json`
- Figma 덤프: `harness/artifacts/publishing/<feature>.figma.txt`
- 토큰 산출물: `harness/artifacts/publishing/<feature>.token-candidates.json`
- 컴포넌트 맵: `harness/artifacts/publishing/<feature>.component-map.md`
- e2e: `tests/e2e/<feature>.spec.ts`

스크립트는 runtime 디렉터리가 없으면 자동 생성한다.

## 안전장치

- 승인된 시나리오와 e2e 파일이 바뀌면 해시 검증이 실패한다.
- `requires_functional_test: false`도 퍼블리싱 승인 sentinel은 필요하다.
- 테스트나 승인 파일을 수정해 실패를 숨기지 않는다.
- 퍼블리싱 요청에서 명세에 없는 실제 API를 임의로 연결하지 않는다.
- 동일 오류 또는 동일 diff가 반복되거나 3회에 도달하면 `no-progress.md`에 따라 중단한다.

## 레퍼런스

`notice-list`는 이동 후에도 기존 승인 시나리오와 e2e 해시를 유지하는 회귀 기준이다.
