# API Integration Rules

공통 규칙은 [`../shared/code-rules.md`](../shared/code-rules.md)를 먼저 따른다.

- 승인된 Contract만 구현 기준으로 사용한다.
- Contract에 없는 request 필드를 추가하지 않는다.
- Contract에 없는 response 필드를 사용하지 않는다.
- request와 response 타입을 분리한다.
- optional과 nullable을 구분한다.
- 컴포넌트에서 Axios를 직접 호출하지 않는다.
- 새 Axios 인스턴스와 raw fetch를 만들지 않는다.
- `src/shared/api/axios.ts`의 공통 인스턴스를 사용한다.
- 조회는 `useQuery`, 등록·수정·삭제는 `useMutation`을 사용한다.
- 기존 Query Key Factory가 있으면 우선하며, 현재 패턴이 배열 key라면 그 패턴을 유지한다.
- 서버 데이터를 Zustand에 복제하지 않는다.
- 오류를 빈 배열이나 기본 객체로 숨기지 않는다.
- `any`, `@ts-ignore`, 테스트 삭제, 승인 게이트 우회를 사용하지 않는다.
- 실제 서버 요청은 수행하지 않는다. 기능 테스트는 Playwright `page.route()` 기반 mock을 우선한다.
