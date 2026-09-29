---
name: api
description: >
  Notion API 명세를 기반으로 프론트엔드 API 연동을 요청할 때 사용한다.
  Codex: API 연동 요청에서 이 스킬을 사용한다.
---

# API integration entrypoint

1. `harness/api/RUNBOOK.md`를 읽고 ①–⑭ 단계를 순서대로 따른다.
2. 규칙은 `harness/api/api-rules.md`, 입력 계약은 `harness/api/api-input-contract.md`를 참조한다.
3. API ID가 없거나 Contract STOP 조건이 있으면 구현하지 않고 백엔드 질문 목록을 반환한다.
4. 개발자 승인 전에는 API 코드를 구현하거나 테스트 코드를 작성하지 않는다.
5. 실제 API 서버 테스트는 승인된 staging 설정과 동결된 전용 테스트가 있을 때 개발자 또는 CI가 명시적으로 실행한다. 에이전트는 실제 API 서버와 운영 서버를 임의로 호출하지 않고 Notion을 수정하지 않는다.

이 파일에는 RUNBOOK 규칙을 복제하지 않는다.
