# Implementation Plan — close-dat-delete

## 승인 기준

- Content-Type은 `application/json`으로 동결한다.
- Path `id`는 required, nullable false인 양의 integer로 동결한다.
- Query Parameters와 Request Body는 없음으로 동결한다.
- 성공·오류 response body와 필드는 required 또는 nullable false로 동결한다.
- 성공 Status는 Notion 원문인 HTTP `201`로 동결한다.
- 실제 서버 테스트는 disabled이다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`
- `src/shared/api/auth.ts`의 기존 인증 interceptor
- `src/entities/close-schedule/api/closeScheduleApi.ts`의 runtime 검증 패턴
- TanStack Query `useMutation`과 기존 `['close-schedules']` 캐시
- `CloseScheduleForm`의 삭제 확인 다이얼로그, pending guard, 오류 상태와
  성공 이동
- 승인된 `CLOSE_DAT_QUERY_ALL`이 저장한 목록 캐시

## 변경 파일

- `src/entities/close-schedule/api/types.ts`
- `src/entities/close-schedule/api/closeScheduleApi.ts`
- `src/entities/close-schedule/index.ts`
- `src/pages/notices/guide/EditCloseSchedulePage.tsx`
- `src/features/create-close-schedule/ui/CloseScheduleForm.tsx`
- `tests/e2e/api/close-dat-delete.spec.ts`

## 타입과 API 함수

- Contract 그대로 `CloseDateDeleteRequest`, `CloseDateDeleteResponse`,
  `CloseDateDeleteErrorResponse`를 분리해 정의한다.
- `CloseDateDeleteRequest`는 path parameter `id: number`만 가진다.
- `deleteCloseSchedule({ id })`는 `id`를 양의 safe integer로 검증하고 공통
  Axios 인스턴스로 `DELETE /close-day/{id}`를 호출한다.
- DELETE request body와 query parameter는 보내지 않는다.
- HTTP 201 response의 status와 body를 `unknown`에서 검증한다.
- non-null string `message`가 아니거나 status가 201이 아니면 명시적 오류를
  발생시킨다.

## 수정 화면 데이터 연결

- `EditCloseSchedulePage`의 query 함수는 route ID와 일치하는 휴관일을 기존
  `['close-schedules']` API 목록 캐시에서 먼저 찾는다.
- 목록 캐시가 없으면 승인된 `getCloseSchedules()`로 실제 목록을 조회한 뒤
  route ID가 일치하는 항목을 선택한다.
- 상세 초기값에 `getMockCloseSchedule` 또는 localStorage mock을 사용하지
  않는다.
- 승인되지 않은 단일 조회 endpoint나 새 query key factory는 추가하지 않는다.
- 목록을 거치지 않은 직접 진입과 새로고침도 전체 조회 API로 지원한다.

## Query/Mutation과 캐시

- 삭제이므로 기존 `useMutation`을 유지한다.
- 삭제 분기에서 `deleteMockCloseSchedule` 대신 `deleteCloseSchedule`을
  호출한다.
- route ID는 `Number(initialSchedule.id)`로 변환하고 API 함수 경계에서
  검증한다.
- 성공 시 기존 `['close-schedules']` prefix를 무효화한다.
- 삭제된 상세 query `['close-schedules', initialSchedule.id]`를 제거한다.
- 실패 시 캐시를 성공 상태로 바꾸거나 localStorage mock 삭제로 fallback하지
  않는다.

## UI 연결

- 기존 삭제 확인 다이얼로그와 오류 문구를 변경하지 않는다.
- pending 중 확인 버튼과 삭제 버튼을 비활성화하고 기존 `deletingRef`로 중복
  요청을 막는다.
- 성공 시 기존 `/notices/guide` 이동을 유지한다.
- 실패 시 `삭제하지 못했습니다. 다시 시도해 주세요.`를 유지한다.
- 생성 API와 수정 mock mutation은 변경하지 않는다.

## 검증 순서

1. `yarn harness:api:validate close-dat-delete`
2. `yarn harness:api:gate close-dat-delete`
3. 변경 소스 대상
   `yarn harness:api:policy close-dat-delete src/entities/close-schedule/api/types.ts src/entities/close-schedule/api/closeScheduleApi.ts src/entities/close-schedule/index.ts src/pages/notices/guide/EditCloseSchedulePage.tsx src/features/create-close-schedule/ui/CloseScheduleForm.tsx`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api close-dat-delete`
8. 기존 휴관일 수정 UI의 표적 회귀 테스트

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- 성공 응답이 HTTP 200/204이거나 body가 없으면 Contract와 승인을 갱신한다.
- DELETE request body나 query parameter가 필요하면 Contract를 먼저 보완한다.
- 단일 휴관일 조회 API를 추측해 추가하지 않는다.
- 구현 중 승인 Contract 밖의 request 또는 response 필드가 필요하면 중단하고
  ⑧ 승인 단계로 돌아간다.
