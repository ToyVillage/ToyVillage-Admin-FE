# RUNBOOK — Figma-to-Code Publishing Harness

어떤 AI 에이전트(Claude Code / Codex)든 이 문서를 **동일하게** 따른다.
에이전트별 도구 이름(스킬 등)을 쓰지 않는다. 결정적 단계는 `scripts/*.mjs`, 판단 단계는 `harness/publishing/prompts/*.md`를 사용한다.

## 입력 (개발자가 준비)

- **행동명세:** `harness/publishing/specs/<feature>.spec.md` (템플릿: `harness/publishing/templates/behavioral-spec.md`)
  - 상단 메타에 `requires_functional_test: true|false` 를 반드시 명시.
- **Figma:** fileKey + nodeId (URL에서 추출). Figma MCP(`get_figma_data`/`download_figma_images`)로 접근.

## 0.0 스파이크 (파일별 최초 1회, blocking)

`design-input-contract.md` §2 참조. `get_figma_data`가 Variables를 주는지 확인 — 이 저장소는 **미노출 확정** → solid color/font family는 의미 토큰 후보, px·rgba 등은 직접 구현값으로 분리한다.

## 단계 (7)

### ① 추출 ‖ 시나리오 초안 (병렬)

- **추출:** `get_figma_data(fileKey, nodeId)` 호출 → **응답을 `harness/artifacts/publishing/<feature>.figma.txt`로 저장**(map-tokens의 입력). 그다음 `node scripts/map-tokens.mjs <feature>`로 solid color/font family 토큰 후보와 px·rgba 등 direct CSS 값을 분리 → `harness/artifacts/publishing/<feature>.token-candidates.json`, `<feature>.token-diff.report.md`. 아이콘은 `download_figma_images`.
  - MCP 불가 시: `design-input-contract.md` §5의 STOP-and-report(수동 토큰).
- **시나리오 초안:** `requires_functional_test: true`면 `prompts/draft-scenarios.md`로 행동명세 → 시나리오 초안을 `templates/scenario-draft.md` 형식으로 **`harness/artifacts/publishing/<feature>.scenario-draft.md`에 출력**(핵심→엣지). `false`면 생략.
- **컴포넌트맵 초안:** `templates/component-map.md` 형식으로 Figma 노드 → repo 컴포넌트 매핑을 **`harness/artifacts/publishing/<feature>.component-map.md`에 출력**.

> 산출물 경로 규약: 템플릿(`templates/*.md`)은 형식만 제공하고, feature별 인스턴스는 항상 `harness/artifacts/publishing/<feature>.*`로 출력한다. 템플릿 파일 자체를 채우지 않는다.

### ② 🚦 통합 중간 게이트 (개발자 승인, 퍼블리싱 전 1회)

개발자가 `templates/figma-review.md`를 채워 확인:

- Figma frame/node 일치 / 토큰·theme 매핑(후보에 시맨틱 이름 부여) / component-map / 새 컴포넌트 후보 과다 여부 / 애매 항목 TODO / **시나리오 초안 승인**.
- 승인 시나리오를 durable 경로 `harness/publishing/approvals/<feature>.scenario-draft.md`에 두고, `node scripts/approve.mjs <feature> --by <name> --scenarios S1,S2` 실행 → sentinel `harness/publishing/approvals/<feature>.approved.json` 생성(**Git 커밋됨 — clone/CI 재현 가능**).
- **승인된 시나리오는 동결(frozen)** — 이후 재작성/재도출 금지. 기능 테스트 통과 후 `node scripts/approve.mjs <feature> --freeze`로 e2eHash stamp.

**Sentinel 유효성 계약 (gate-check.mjs가 검사, `approvals/`에서 읽음):**

- JSON 파싱 가능 AND 필수 필드(`feature, approvedAt, approvedBy, scenarioIds`) 존재
- `feature` == CLI 인자 슬러그
- `requires_functional_test: true` → `scenarioIds` 비어있지 않음 + **scenarioHash가 `approvals/<feature>.scenario-draft.md`와 일치**(승인 후 변경 감지). e2eHash 있으면 `tests/e2e/<feature>.spec.ts`와 일치.
- `requires_functional_test: false` → `scenarioIds: []` 허용(정적 퍼블리싱)
- 위 중 하나라도 실패 = **invalid → 하드 STOP**

**승인 게이트 범위:** `gate-check.mjs`는 **퍼블리싱(③)·기능 테스트(⑤) 진입 전**에 승인 시나리오를 확인하는 용도로만 쓴다(AI가 시나리오를 제멋대로 재도출하지 못하게). **커밋은 막지 않는다** — 커밋 여부는 개발자가 판단한다.

**정적 feature도 게이트 필요:** sentinel은 기능 테스트 여부와 무관한 **개발자 디자인 승인 게이트**이므로, `requires_functional_test: false`여도 sentinel(`scenarioIds: []`)이 있어야 ③ 퍼블리싱이 진행된다.

### ③ 퍼블리싱 (AI)

- `gate-check.mjs <feature>` **먼저** 통과(sentinel 존재) → 실패면 하드 STOP.
- `prompts/publish.md` + `design-rules.md` + `../shared/code-rules.md` + 확정 의미 토큰 + 행동명세 기준으로 FSD-lite 컴포넌트 생성. px·rgba 등 구현값은 Emotion에 직접 작성한다.
- 기준은 **행동명세 프롬프트**(Figma만으로 판단 금지). 컴포넌트 경계는 design-rules §7.

### ④ 자동검증 (인너 루프)

- `scripts/verify.mjs` = `yarn verify`(`lint && typecheck && build`, Playwright 아님).
- 실패 시 `prompts/fix-code.md`로 **코드**를 수정하고 재실행. (테스트/시나리오 수정 금지)
- 매 실패마다 `loop-guard.mjs`로 반복 기록.

### ⑤ 기능 테스트 (조건부, Playwright)

- `requires_functional_test: false` → **이 단계 생략**, ⑦로.
- 선행 1회: `yarn e2e:setup`(= `yarn playwright install chromium`)으로 브라우저 설치.
- `true` → 승인 시나리오(`approvals/<feature>.scenario-draft.md`)를 `tests/e2e/<feature>.spec.ts`로 **변환만**(재도출 금지) → `node scripts/approve.mjs <feature> --freeze`로 e2eHash 동결 → `node scripts/run-scenarios.mjs <feature>`(= `yarn verify:e2e <feature>`, 게이트 먼저 확인 후 Playwright).
- 실패 시 **코드** 수정 후 ④부터 재시작.

### ⑥ 가드레일

- `loop-guard.mjs`가 `no-progress.md`의 조건 + N=3으로 CONTINUE/STOP 판정.
- STOP이면 루프 중단, 개발자에게 반환.

### ⑦ 최종 육안 확인 (개발자)

- 개발자가 `yarn dev`로 Figma 원본과 로컬을 눈으로 비교한다.
- 문제 있으면 코드를 고치고 다시 확인한다. (강제/서명 없음 — 커밋 여부는 개발자가 판단)

## 정적 vs 기능 분기

- `requires_functional_test`가 유일한 결정 기준. `true`+승인 시나리오 없음 → ⑤ 차단. `false` → ⑤ 생략, ④ + ⑦로 종료.

## Codex 패리티 기준

- 이 RUNBOOK과 `prompts/*`에는 **에이전트 전용 도구 이름이 없어야** 한다(Figma MCP·node 스크립트는 양쪽 공용).
- 패리티 = Codex가 동일 산출물(`<feature>.approved.json`, `loop-state.json`)에 도달.
