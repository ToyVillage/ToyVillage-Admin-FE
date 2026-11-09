# RUNBOOK — Figma-to-Code Publishing Harness

어떤 AI 에이전트(Claude Code / Codex)든 이 문서를 **동일하게** 따른다.
에이전트별 도구 이름(스킬 등)을 쓰지 않는다. 결정적 단계는 `scripts/*.mjs`, 판단 단계는 `harness/publishing/prompts/*.md`를 사용한다.

## 입력 (개발자가 준비)

- **행동명세:** `harness/publishing/specs/<feature>.spec.md` (템플릿: `harness/publishing/templates/behavioral-spec.md`)
  - 상단 메타에 `requires_functional_test: true|false` 를 반드시 명시.
- **Figma:** fileKey + nodeId (URL에서 추출). Figma MCP(`get_figma_data`/`download_figma_images`, 또는 공식 Figma MCP `get_screenshot`)로 접근.

## 0.0 스파이크 (파일별 최초 1회, blocking)

`design-input-contract.md` §2 참조. `get_figma_data`가 Variables를 주는지 확인 — 이 저장소는 **미노출 확정** → solid color/font family는 의미 토큰 후보, px·rgba 등은 직접 구현값으로 분리한다.

## 역할

테스트는 구현을 보지 않은 쪽이 먼저 쓴다. 구현을 본 쪽이 테스트를 쓰면 요구사항이 아니라 이미 만든 구현에 맞춘 테스트가 되기 때문이다.

| 역할        | 단계               | 맡는 일                                   | 고치지 않는 것                                    |
| ----------- | ------------------ | ----------------------------------------- | ------------------------------------------------- |
| 진행 담당   | ①·⑤·⑥              | 추출, 시나리오 초안, 검증 실행, 결과 보고 | 승인 기록                                         |
| 테스트 담당 | ③                  | 승인 시나리오 → e2e·스크린샷 테스트 작성  | `src/**`                                          |
| 구현 담당   | ④ (+⑤·⑥ 실패 수정) | 화면 구현, 실패 시 코드 수정              | `tests/**`, 승인 시나리오, 기준 이미지, 승인 기록 |
| 개발자      | ②·⑦                | 승인, 최종 확인                           | —                                                 |

- 테스트 담당과 구현 담당은 **서로 다른 세션**(서브에이전트 또는 새 대화)으로 실행한다. 대화 맥락을 공유하지 않고, 아래 산출물 파일로만 주고받는다.
- 테스트 담당은 구현보다 먼저 일하므로 그 기능의 구현 코드를 볼 수 없다. 기존 화면을 고치는 작업이면 `src/**`를 읽지 않는다.

## 단계 (7)

### ① 추출 ‖ 시나리오 초안 (진행 담당)

- **추출:** `get_figma_data(fileKey, nodeId)` 호출 → **응답을 `harness/artifacts/publishing/<feature>.figma.txt`로 저장**(map-tokens의 입력). 그다음 `node scripts/map-tokens.mjs <feature>`로 solid color/font family 토큰 후보와 px·rgba 등 direct CSS 값을 분리 → `harness/artifacts/publishing/<feature>.token-candidates.json`, `<feature>.token-diff.report.md`. 아이콘은 `download_figma_images`.
  - MCP 불가 시: `design-input-contract.md` §5의 STOP-and-report(수동 토큰).
- **기준 이미지:** 행동명세에 적힌 Figma 화면(상태별 프레임 포함)을 **원본 크기(1x) PNG**로 내려받아 `harness/publishing/baselines/<feature>/<frame>.png`에 둔다(`download_figma_images`의 `pngScale: 1`, 또는 `get_screenshot`의 `maxDimension`을 프레임 긴 변 이상으로). `<frame>`은 상태를 드러내는 영문 슬러그(예: `list-empty`). 이미지 크기가 곧 ⑥에서 쓸 화면 크기다.
- **시나리오 초안:** `requires_functional_test: true`면 `prompts/draft-scenarios.md`로 행동명세 → 시나리오 초안을 `templates/scenario-draft.md` 형식으로 **`harness/artifacts/publishing/<feature>.scenario-draft.md`에 출력**(핵심→엣지). `false`면 생략.
- **컴포넌트맵 초안:** `templates/component-map.md` 형식으로 Figma 노드 → repo 컴포넌트 매핑을 **`harness/artifacts/publishing/<feature>.component-map.md`에 출력**.

> 산출물 경로 규약: 템플릿(`templates/*.md`)은 형식만 제공하고, feature별 인스턴스는 항상 `harness/artifacts/publishing/<feature>.*`로 출력한다. 템플릿 파일 자체를 채우지 않는다. 기준 이미지만 승인 대상이라 `harness/publishing/baselines/`에 두고 Git으로 추적한다.

### ② 🚦 통합 중간 게이트 (개발자 승인, 구현 전 1회)

개발자가 `templates/figma-review.md`를 채워 확인:

- Figma frame/node 일치 / 토큰·theme 매핑(후보에 시맨틱 이름 부여) / component-map / 새 컴포넌트 후보 과다 여부 / 애매 항목 TODO / **기준 이미지가 비교할 화면·상태와 맞는지** / **시나리오 초안 승인**.
- 승인 시나리오를 durable 경로 `harness/publishing/approvals/<feature>.scenario-draft.md`에 두고, `node scripts/approve.mjs <feature> --by <name> --scenarios S1,S2` 실행 → sentinel `harness/publishing/approvals/<feature>.approved.json` 생성(**Git 커밋됨 — clone/CI 재현 가능**). 기준 이미지가 있으면 `baselineHash`도 함께 기록된다.
- **승인된 시나리오와 기준 이미지는 동결(frozen)** — 이후 재작성/재도출 금지.

**Sentinel 유효성 계약 (gate-check.mjs가 검사, `approvals/`에서 읽음):**

- JSON 파싱 가능 AND 필수 필드(`feature, approvedAt, approvedBy, scenarioIds`) 존재
- `feature` == CLI 인자 슬러그
- `requires_functional_test: true` → `scenarioIds` 비어있지 않음 + **scenarioHash가 `approvals/<feature>.scenario-draft.md`와 일치**(승인 후 변경 감지). e2eHash 있으면 `tests/e2e/<feature>.spec.ts`와 일치.
- `requires_functional_test: false` → `scenarioIds: []` 허용(정적 퍼블리싱)
- 기준 이미지가 있으면 `baselineHash`가 `baselines/<feature>/*.png`와 일치. visualHash 있으면 `tests/visual/<feature>.visual.ts`와 일치.
- `--stage implement`(④ 진입·⑥ 실행 전) → 기능 테스트면 e2eHash, 기준 이미지가 있으면 visualHash가 있어야 한다(③ 동결 완료).
- 위 중 하나라도 실패 = **invalid → 하드 STOP**

**승인 게이트 범위:** `gate-check.mjs`는 **테스트 작성(③)·구현(④)·검증(⑥) 진입 전**에 승인 상태를 확인하는 용도로만 쓴다(AI가 시나리오·테스트·기준 이미지를 제멋대로 바꾸지 못하게). **커밋은 막지 않는다** — 커밋 여부는 개발자가 판단한다.

**정적 feature도 게이트 필요:** sentinel은 기능 테스트 여부와 무관한 **개발자 디자인 승인 게이트**이므로, `requires_functional_test: false`여도 sentinel(`scenarioIds: []`)이 있어야 ④ 구현이 진행된다.

### ③ 테스트 작성 (테스트 담당, 구현 전)

- `gate-check.mjs <feature>` **먼저** 통과 → 실패면 하드 STOP.
- `prompts/write-tests.md`를 따른다.
- 기능 테스트(`requires_functional_test: true`): 승인 시나리오를 `tests/e2e/<feature>.spec.ts`로 **변환만**(재도출 금지).
- 스크린샷 테스트(기준 이미지가 있을 때): 기준 이미지마다 같은 크기·같은 상태의 화면을 캡처해 비교하는 `tests/visual/<feature>.visual.ts`를 쓴다.
- 문구로 찾을 수 없는 요소에 testid가 필요하면 `harness/artifacts/publishing/<feature>.selector-contract.md`에 적어 구현 담당에게 넘긴다.
- 작성 후 `node scripts/approve.mjs <feature> --freeze`로 e2eHash·visualHash 동결.

### ④ 구현 (구현 담당)

- `gate-check.mjs <feature> --stage implement` **먼저** 통과(③ 동결 완료) → 실패면 하드 STOP.
- **컴포넌트맵 대조 게이트 (코드 작성 전, blocking):** 구현을 시작하기 전에 반드시 해당 feature의 `harness/artifacts/publishing/<feature>.component-map.md`를 **열어서** 읽는다. `INSTANCE`로 매핑된 항목(재사용/재사용 검토)은 **인라인으로 다시 그리지 말고** 대응하는 저장소 컴포넌트를 재사용한다. 대응 컴포넌트가 없으면 `shared/ui`(또는 적절한 계층)에 **먼저 공용 컴포넌트를 만들고** 그것을 사용한다. 계획 단계(①)가 적어둔 맵을 구현 단계에서 확인 없이 무시하는 것이 과거 실패 원인이므로, 이 대조를 건너뛰지 않는다.
- `selector-contract.md`가 있으면 적힌 testid를 빠짐없이 붙인다.
- `prompts/publish.md` + `design-rules.md` + `../shared/code-rules.md` + 확정 의미 토큰 + 행동명세 기준으로 FSD-lite 컴포넌트 생성. px·rgba 등 구현값은 Emotion에 직접 작성한다.
- 기준은 **행동명세 프롬프트**(Figma만으로 판단 금지). 컴포넌트 경계는 design-rules §1.

### ⑤ 정적 검증 (인너 루프)

- `scripts/verify.mjs` = `yarn verify`(`lint && typecheck && style-policy && build`, Playwright 아님).
- 실패 시 구현 담당이 `prompts/fix-code.md`로 **코드**를 수정하고 재실행. (테스트/시나리오 수정 금지)
- 매 실패마다 `loop-guard.mjs`로 반복 기록.

### ⑥ 기능 테스트 + Figma 스크린샷 비교

- 선행 1회: `yarn e2e:setup`(= `yarn playwright install chromium`)으로 브라우저 설치.
- `node scripts/run-scenarios.mjs <feature>`(= `yarn verify:e2e <feature>`): `--stage implement` 게이트 확인 → 기능 e2e(`tests/e2e/<feature>.spec.ts`가 있을 때) → 스크린샷 비교(기준 이미지가 있을 때, `playwright.visual.config.ts`).
- 스크린샷 비교가 실패하면 `test-results/` 아래 `*-diff.png`(차이가 빨갛게 표시된 이미지)를 구현 담당에게 함께 넘긴다.
- 실패 시 구현 담당이 **코드**를 수정하고 ⑤부터 재시작. 기준 이미지·테스트는 고치지 않는다.
- **가드레일:** `loop-guard.mjs`가 `no-progress.md`의 조건 + N=3으로 CONTINUE/STOP 판정. STOP이면 루프 중단, 개발자에게 반환.

### ⑦ 최종 확인 (개발자)

- 개발자가 `yarn dev`로 동작을 확인한다. ⑥의 스크린샷 비교를 통과했으면 화면 전체를 다시 대조하지 않고, 남은 차이와 비교하지 못한 상태(애니메이션, 호버 등)를 본다.
- 문제 있으면 코드를 고치고 다시 확인한다. (강제/서명 없음 — 커밋 여부는 개발자가 판단)

## 정적 vs 기능 분기

- `requires_functional_test`가 기능 테스트의 유일한 결정 기준. `true`+승인 시나리오 없음 → ③ 차단. `false` → 기능 e2e 생략.
- 스크린샷 비교는 기능 테스트 여부와 무관하게 기준 이미지가 있으면 수행한다.

## Codex 패리티 기준

- 이 RUNBOOK과 `prompts/*`에는 **에이전트 전용 도구 이름이 없어야** 한다(Figma MCP·node 스크립트는 양쪽 공용).
- 역할 분리는 Claude Code에서 서브에이전트, Codex에서 역할별 새 세션으로 지킨다. 각 세션은 해당 역할의 `prompts/*.md`를 따른다.
- 패리티 = Codex가 동일 산출물(`<feature>.approved.json`, `loop-state.json`)에 도달.
