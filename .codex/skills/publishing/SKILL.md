---
name: publishing
description: >
  이 저장소에서 Figma 프레임을 코드로 옮겨달라는(퍼블리싱) 요청에 발동한다
  (예: "notice-list 퍼블리싱해줘"). harness/RUNBOOK.md 퍼블리싱 파이프라인을 실행하고
  사람 게이트(② 시나리오 승인, ⑦ 육안)에서 멈춘다.
---

# publishing (Codex)

이 저장소의 Figma 퍼블리싱은 **`harness/RUNBOOK.md`** 절차(①–⑦)를 유일한 진실 소스로 삼아 그대로 따른다.
세부·규칙의 진실은 `harness/RUNBOOK.md` / `harness/design-rules.md` / `harness/prompts/*` 이며, 여기서 재선언하지 않는다.

## 오케스트레이션 (Claude·Codex 공통)

- **자동 실행**은 저장소 스크립트 계약을 쓴다: 토큰 매핑 `yarn harness:map-tokens <feature>`, 게이트 확인 `yarn harness:gate <feature>`, 검증 `yarn verify`, 반복 `yarn harness:loop`, e2e `yarn verify:e2e <feature>`. Figma는 MCP(`get_figma_data`/`download_figma_images`)로 접근한다.
- 흐름: Figma 라이브 추출 → 시나리오 초안·컴포넌트맵 → 퍼블리싱 → `yarn verify` 고치기 루프 → 승인 시나리오 e2e 변환·실행.
- 산출물 경로 규약: feature별 인스턴스는 항상 `harness/artifacts/<feature>.*`, 승인 sentinel은 `harness/approvals/<feature>.approved.json` (RUNBOOK ①·② 참조).

## 사람 게이트 (자동 통과 금지)

- **② 시나리오 승인**: 초안 후 승인 sentinel이 없으면 STOP하고 개발자에게 요청한다. 승인은 공식 스크립트 `yarn harness:approve <feature> --by <name> --scenarios S1,S2,...` (사람이 실행). AI가 게이트를 우회하려고 시나리오를 임의로 재도출하지 않는다.
- **⑦ 육안 확인**: 파이프라인 종료 후 `yarn dev`로 Figma 원본 vs 로컬 비교를 개발자에게 넘긴다.
- `harness/specs/`는 최신 Figma 반영을 위해 AI가 갱신할 수 있으나, `harness/approvals/`는 위 공식 스크립트로만 변경한다. ②·⑦ 건너뛰기 금지(빌드 통과 = 완료 아님).
- publishing은 API 연동을 하지 않고 mock 교체 경계를 유지한다.

## feature와 Figma 프레임 해석

- `<feature>` = `harness/specs/<feature>.spec.md` 슬러그. 자연어 요청이면 `specs/`에서 매칭하고, 애매하면(list vs create 등) 사용자에게 확인한다.
- 인자가 없으면 우선순위: ① 명시적 인자 → ② 브랜치명과 일치하는 spec → ③ 변경된 `harness/specs/*.spec.md`가 하나면 그것 → ④ 그 외 사용자 확인.
- Figma 프레임은 spec frontmatter의 `figma.fileKey/nodeId`로 `get_figma_data` 라이브 조회한다. 사용자가 URL을 주면 그 URL의 fileKey·nodeId를 우선하고 그 값을 spec frontmatter에도 반영한다(spec 참조가 유효하지 않을 때도 동일).
- 대응하는 spec이 없으면 feature/spec을 임의로 생성하지 않는다 — 새 spec을 만들지, 기존 spec과 연결할지 사용자에게 확인한다. spec과 URL이 모두 없으면 URL을 요청한다.
