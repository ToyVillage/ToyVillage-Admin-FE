# Prompt — Integrate API

먼저 API 승인 게이트를 통과시킨다. `harness/api/approvals/<feature>.*`만 구현 기준으로 사용한다.

- `api-rules.md`와 `harness/shared/code-rules.md`를 따른다.
- 승인된 계획의 파일만 수정한다.
- request/response 타입, API 함수, query/mutation, UI 연결을 책임별로 배치한다.
- loading, error, success 동작은 승인 시나리오 범위에서 구현한다.
- 구현 중 실제 서버 요청을 실행하지 않는다. 실제 서버 검증은 구현·동결 후 RUNBOOK의 staging 전용 단계에서만 명시적으로 실행한다.

구현 중 기준 파일과 충돌하거나 추가 서버 결정이 필요하면 중단한다.
