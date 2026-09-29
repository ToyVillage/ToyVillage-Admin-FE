# Prompt — Draft Scenarios

역할: 개발자의 행동명세로부터 Playwright 기능 시나리오 **초안**을 만든다. (승인은 개발자가 게이트에서)

## 입력
- `harness/publishing/specs/<feature>.spec.md` 의 "동작" 섹션 (source of truth)

## 규칙
- 행동명세에 적힌 동작만 근거로 한다. 명세에 없는 기능을 지어내지 않는다.
- **핵심 시나리오 → 엣지 케이스** 순으로 커버(빈 목록/에러/경계값 등).
- 각 시나리오는 Given/When/Then으로, 하나의 사용자 행동에 집중.
- 출력은 `harness/publishing/templates/scenario-draft.md` 형식으로 `harness/artifacts/publishing/<feature>.scenario-draft.md`에 쓴다.
- **테스트 코드를 지금 쓰지 않는다.** 시나리오 텍스트만. 코드 변환은 승인 후 ⑤단계.

## 금지
- 개발자 승인 없이 시나리오를 확정/동결하지 않는다.
- `requires_functional_test: false`면 이 프롬프트를 실행하지 않는다.
