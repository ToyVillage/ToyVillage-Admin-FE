# AGENTS

이 저장소에서 하네스 작업을 시작하기 전에 [`harness/README.md`](harness/README.md)를 확인하고 작업 유형의 RUNBOOK을 따른다.

## 퍼블리싱 (Figma → 코드)

Figma 프레임을 코드로 옮겨달라는(퍼블리싱) 요청이면(예: "notice-list 퍼블리싱해줘"), **[`.claude/skills/publishing/SKILL.md`](.claude/skills/publishing/SKILL.md)를 읽고 그 절차를 따른다.** (Claude는 `/publishing <feature>` 슬래시로 같은 파일을 사용한다.)

## API 연동 (Notion 명세 → 프론트엔드)

API 연동 요청이면 **[`harness/api/RUNBOOK.md`](harness/api/RUNBOOK.md)를 먼저 읽고** Contract 생성·검증·개발자 승인 게이트를 따른다. Claude는 `/api <feature>`, Codex는 `.codex/skills/api/SKILL.md`를 진입점으로 사용한다.

퍼블리싱 작업에서는 실제 API를 임의로 연결하지 않고, API 작업에서는 Figma 퍼블리싱을 다시 수행하지 않는다. 작업 유형이 불명확하면 먼저 범위를 확인한다.
