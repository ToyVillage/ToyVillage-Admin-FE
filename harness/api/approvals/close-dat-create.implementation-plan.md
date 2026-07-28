# Implementation Plan — close-dat-create

## 승인 기준

- Content-Type은 사용자 결정으로 `application/json`으로 동결한다.
- request, success response, error response 필드는 required, nullable false로
  동결한다.
- 날짜는 `YYYY-MM-DD`, 종료일은 시작일과 같거나 이후로 동결한다.
- 실제 서버 테스트는 disabled이다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`
- `src/shared/api/auth.ts`의 Authorization interceptor
- TanStack Query `useMutation`, `useQueryClient`
- 기존 `['close-schedules']` query key
- 기존 `CreateCloseScheduleInput`과 생성 폼 검증·오류 UI

## 변경 파일

- `src/entities/close-schedule/api/types.ts`
- `src/entities/close-schedule/api/closeScheduleApi.ts`
- `src/entities/close-schedule/index.ts`
- `src/features/create-close-schedule/ui/CloseScheduleForm.tsx`
- `tests/e2e/api/close-dat-create.spec.ts`

## 타입과 API 함수

- Contract 그대로의 `CloseDateCreateRequest`, `CloseDateCreateResponse`,
  `CloseDateCreateErrorResponse`를 작성한다.
- `createCloseSchedule()`은 공통 Axios로 `POST /close-day`를 호출한다.
- 도메인 입력을 `startCloseTime`, `endCloseTime`으로 매핑한다.
- 날짜 형식, 실제 날짜, 날짜 순서와 trim된 title을 검증한다.
- 성공 body의 `message`가 non-null string인지 런타임 검증한다.

## Query/Mutation과 캐시

- 등록 API이므로 기존 `useMutation`을 유지한다.
- 생성 분기만 `createCloseSchedule`, 수정 분기는 기존 mock을 사용한다.
- 성공 시 `['close-schedules']`를 무효화한 뒤 목록으로 이동한다.
- 오류 시 캐시를 무효화하지 않고 입력값과 재시도 가능 상태를 유지한다.
- 중복 제출 방지 ref와 pending button 상태를 유지한다.

## UI 연결

- 기존 클라이언트 검증 dialog를 유지한다.
- API pending 중 `생성 중`과 disabled 상태를 유지한다.
- 오류 시 기존 `생성하지 못했습니다. 다시 시도해 주세요.` 상태를 표시한다.
- 성공 시 `/notices/guide`로 이동하고 전체 조회 API가 목록을 갱신한다.

## 검증 순서

1. `yarn harness:api:validate close-dat-create`
2. `yarn harness:api:gate close-dat-create`
3. `yarn harness:api:policy`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api close-dat-create`

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- 구현 중 response wrapper 또는 추가 request 필드가 필요하면 중단한다.
- 수정·삭제 API 연동은 별도 API ID 작업이다.
- 승인 Contract, 계획 또는 테스트 시나리오가 바뀌면 재승인한다.
