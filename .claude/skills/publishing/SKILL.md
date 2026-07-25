---
name: publishing
description: >
  이 저장소에서 Figma 프레임을 코드로 옮겨달라는(퍼블리싱) 요청에 발동한다.
  Claude: `/publishing <feature>`. Codex: AGENTS.md를 통해 문장으로 요청("<feature> 퍼블리싱해줘").
  이 스킬은 harness/publishing/RUNBOOK.md·design-rules.md·prompts를 참조·오케스트레이션만 하며 규칙을 재선언하지 않는다.
  Claude는 이 파일을 /publishing 스킬로 자동 로드하고, Codex는 AGENTS.md가 이 파일을 가리킨다.
---

# publishing — 이 저장소의 Figma 퍼블리싱 파이프라인 실행

## 절대 규칙

- **먼저 `harness/publishing/RUNBOOK.md`를 읽고 ①–⑦ 단계를 따른다.** 세부·규칙의 진실은 `harness/publishing/RUNBOOK.md` / `harness/publishing/design-rules.md` / `harness/publishing/prompts/*`. 여기서 재선언하지 않는다.
- AI 자동 실행은 저장소의 `yarn harness:*` / `yarn verify` / `yarn verify:e2e` 명령을 사용한다.

## specs / approvals 수정 규칙 (분리)

- `harness/publishing/specs/`는 **최신 Figma 정보를 반영하기 위해 AI가 갱신할 수 있다.**
- `harness/publishing/approvals/`는 AI가 승인 상태를 **직접 수정하지 않는다.** 변경이 필요하면 `yarn harness:approve` 같은 **공식 스크립트만** 사용한다.

## feature와 Figma 프레임 해석

- `<feature>` = `harness/publishing/specs/<feature>.spec.md` 슬러그. "공지사항 퍼블리싱" 같은 자연어면 `specs/`에서 매칭하고, 애매하면(list vs create) 사용자에게 확인한다.
- 인자가 없으면 우선순위: ① 명시적 인자 → ② 브랜치명과 일치하는 spec → ③ 변경된 `harness/publishing/specs/*.spec.md`가 하나면 그것 → ④ 그 외 사용자 확인.
- Figma 프레임은 spec frontmatter의 `figma.fileKey/nodeId`로 `get_figma_data` 라이브 조회한다.
- 사용자가 Figma URL을 주면 **그 URL의 fileKey·nodeId를 모두 우선**하고, 그 값을 **spec frontmatter에도 반영**한다.
- **대응하는 spec이 없으면 feature/spec을 AI가 임의로 생성하지 않는다** — 새 spec을 만들지, 기존 spec과 연결할지 사용자에게 확인한다. spec과 Figma URL이 모두 없으면 Figma URL을 요청한다.
- spec의 Figma 참조가 유효하지 않은 경우(`get_figma_data` 조회 실패, 노드 삭제, 접근 불가 등) 또는 사용자가 최신 URL을 제공한 경우에도 위 "URL 우선 + spec 반영" 규칙을 적용한다.

## 실행 (자동으로 진행)

1. **추출:** spec의 nodeId로 `get_figma_data` 라이브 조회 → `harness/artifacts/publishing/<feature>.figma.txt` 저장 → `yarn harness:map-tokens <feature>`. 아이콘은 `download_figma_images` 전에 기존 에셋을 `grep`으로 먼저 찾는다.
2. **초안·게이트:** 추출 후 RUNBOOK에 따라 시나리오 초안을 생성하고 `yarn harness:gate <feature>`로 게이트를 확인한다.
3. **퍼블리싱:** `harness/publishing/prompts/publish.md`, `harness/publishing/design-rules.md`, 저장소의 기존 구조와 토큰 규약에 따라 구현한다.
4. **검증 루프:** `yarn verify` 실패 → `harness/publishing/prompts/fix-code.md`로 코드만 수정 → 재실행. `yarn harness:loop`를 실행하고 반복 횟수·무진전 중단 기준은 RUNBOOK을 따른다.
5. **e2e:** RUNBOOK에 정의된 순서대로 승인 시나리오 freeze, `tests/e2e/<feature>.spec.ts` 변환, `yarn verify:e2e <feature>`를 수행한다.

## 사람에게 멈춰 넘기는 2개 게이트 (자동 통과 금지)

- **② 시나리오 승인:** 초안 후 승인 sentinel이 없으면 STOP하고 개발자에게 요청한다(`harness/publishing/approvals/<feature>.scenario-draft.md` 확인 → `yarn harness:approve <feature> --by <name> --scenarios S1,S2,...`, 사람이 실행). AI가 게이트를 우회하기 위해 시나리오를 임의로 다시 만들지 않는다. **단 개발자가 시나리오 수정을 요청한 경우 초안을 수정할 수 있고, 수정 후 다시 사람의 승인을 기다린다.**
- **⑦ 육안 확인:** 파이프라인이 끝나면 `yarn dev`로 Figma 원본 vs 로컬 비교를 개발자에게 반환한다. 강제 통과하지 않는다.

## 범위

- **②·⑦ 게이트 건너뛰기 금지**(빌드 통과 = 완료 아님). 커밋/푸시는 개발자 승인 후에만.
- **publishing은 API 연동을 수행하지 않고 API 교체 경계(mock)를 유지한다. 실제 API 연결과 mock 교체는 별도 `/api` 스킬이 담당한다.**
