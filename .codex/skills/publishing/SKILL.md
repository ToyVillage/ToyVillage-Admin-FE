---
name: publishing
description: >
  이 저장소에서 Figma 프레임을 코드로 옮겨달라는(퍼블리싱) 요청에 발동한다
  (예: "notice-list 퍼블리싱해줘"). harness/RUNBOOK.md 퍼블리싱 파이프라인을 실행하고
  사람 게이트(② 시나리오 승인, ⑦ 육안)에서 멈춘다.
---

# publishing (Codex)

이 저장소의 Figma 퍼블리싱은 **`harness/RUNBOOK.md`** 절차를 그대로 따른다.
상세 오케스트레이션 규칙은 **`.claude/skills/publishing/SKILL.md`** 와 동일하다 — 그 파일을 읽고 따른다 (Claude·Codex 공통).

- 자동: Figma 라이브 추출 → 퍼블리싱 → `yarn verify` 고치기 루프 → 시나리오 e2e.
- 사람 게이트에서 멈춤: **② 시나리오 승인**(`yarn harness:approve`), **⑦ 육안 확인**(`yarn dev`).
- `harness/specs/`는 갱신 가능, `harness/approvals/`는 공식 스크립트로만 변경. ②·⑦ 건너뛰기 금지.
- feature 인자가 없으면 `.claude/skills/publishing/SKILL.md`의 feature 해석 규칙을 따른다.
