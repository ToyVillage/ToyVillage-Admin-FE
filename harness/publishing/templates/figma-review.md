<!-- 퍼블리싱 전 통합 중간 게이트. 개발자가 채우고, 모두 OK면 sentinel(<feature>.approved.json)을 작성해 승인한다. -->

# Figma Review — <feature>

날짜: <YYYY-MM-DD> / 검토자: <name>

## 체크리스트 (모두 확인해야 승인)

- [ ] **Figma frame/node 일치** — 올바른 fileKey/nodeId를 추출했는가
- [ ] **토큰/theme 매핑** — report의 solid color/font family 후보에만 시맨틱 이름을 부여했는가 - 이 저장소는 Figma Variables가 없어 자동 명명 불가 → 아래 표에 개발자가 이름 지정
- [ ] **직접 구현값 확인** — px·rgba·font size/weight·spacing·radius가 토큰 후보가 아니라 Emotion 직접값으로 분류됐는가
- [ ] **component-map** — `harness/artifacts/publishing/<feature>.component-map.md`의 노드→컴포넌트 매핑이 맞는가
- [ ] **과분리 여부** — 새 컴포넌트 후보가 과하지 않은가(기존 재사용 우선)
- [ ] **애매 항목 TODO** — 불확실한 값/동작이 TODO로 표시됐는가
- [ ] **시나리오 승인** — `harness/artifacts/publishing/<feature>.scenario-draft.md`의 시나리오(핵심~엣지)를 검토·가지치기했는가 (정적 퍼블리싱이면 생략)

## 의미 토큰 명명 (solid color/font family만)

| raw 값  | 제안 용도  | 확정 토큰 이름    | 기존 tokens.ts와 |
| ------- | ---------- | ----------------- | ---------------- |
| #FF8181 | 강조(핑크) | color.primary?    | (new/conflict)   |
| #F5F5F7 | 배경       | color.background? |                  |
| …       |            |                   |                  |

## 승인 시나리오

승인하는 시나리오 id 목록(동결됨):

- [ ] S1: …
- [ ] S2: …

## 승인 액션 (헬퍼로 작성 — 손으로 JSON/해시 쓰지 않는다)

위가 모두 OK면:

1. 승인 시나리오를 **durable 경로**에 둔다: `harness/publishing/approvals/<feature>.scenario-draft.md`
2. 승인 명령 실행 (scenarioHash 자동 계산):
   ```
   node scripts/approve.mjs <feature> --by <name> --scenarios S1,S2
   ```
   → `harness/publishing/approvals/<feature>.approved.json` 생성 (durable, Git 커밋됨)
3. (기능 테스트 작성·통과 후) e2e 동결:
   ```
   node scripts/approve.mjs <feature> --freeze
   ```
   → sentinel 에 e2eHash stamp.

> 승인 기록은 `harness/publishing/approvals/`(커밋됨)에 남아 clone/CI에서도 재현된다.
> 승인 후 시나리오/e2e가 바뀌면 gate-check가 해시 불일치로 STOP(재승인 필요).
> 정적 퍼블리싱(`requires_functional_test: false`)이면 `--scenarios` 생략(scenarioIds:[]); 게이트 자체는 여전히 필요.
