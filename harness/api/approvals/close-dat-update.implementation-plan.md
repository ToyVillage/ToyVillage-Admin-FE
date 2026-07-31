# Implementation Plan — close-dat-update

## 승인 기준

- Content-Type은 `application/json`으로 동결한다.
- Path `id`는 required, nullable false인 양의 integer로 동결한다.
- Query Parameters는 없음으로 동결한다.
- request와 성공·오류 response 필드는 required, nullable false로 동결한다.
- 날짜는 `YYYY-MM-DD`, 종료일은 시작일과 같거나 이후로 동결한다.
- 성공 Status는 Notion 원문인 HTTP `201`로 동결한다.
- 실제 서버 테스트는 disabled이다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`
- `src/shared/api/auth.ts`의 기존 인증 interceptor
- `src/entities/close-schedule/api/closeScheduleApi.ts`의 request 변환,
  날짜와 route ID 검증, runtime response 검증 패턴
- TanStack Query `useMutation`과 기존 `['close-schedules']` 캐시
- `CloseScheduleForm`의 입력 검증, pending guard, 오류 상태와 성공 이동

## 변경 파일

- `src/entities/close-schedule/api/types.ts`
- `src/entities/close-schedule/api/closeScheduleApi.ts`
- `src/entities/close-schedule/index.ts`
- `src/pages/notices/guide/EditCloseSchedulePage.tsx`
- `src/features/create-close-schedule/ui/CloseScheduleForm.tsx`
- `tests/e2e/api/close-dat-update.spec.ts`

## 타입과 API 함수

- Contract 그대로 `CloseDateUpdateRequest`, `CloseDateUpdateResponse`,
  `CloseDateUpdateErrorResponse`를 분리해 정의한다.
- API 함수 입력은 path `id`와 body용 도메인 입력을 분리한다.
- `updateCloseSchedule({ id, input })`은 `id`를 양의 safe integer로 검증하고
  공통 Axios 인스턴스로 `PUT /close-day/{id}`를 호출한다.
- body는 `title`, `startCloseTime`, `endCloseTime`만 포함한다.
- 기존 생성 request 변환과 같은 규칙으로 trim된 제목, 실제 날짜, 날짜 순서를
  검증한다.
- HTTP 201 response를 `unknown`으로 받은 뒤 non-null string `message`를
  검증해 반환한다.
- status 또는 body 형식이 Contract와 다르면 명시적 오류를 발생시킨다.

## Query/Mutation과 캐시

- `EditCloseSchedulePage`는 route ID와 일치하는 휴관일을 기존
  `['close-schedules']` API 목록 캐시에서 먼저 찾는다.
- 목록 캐시가 없으면 승인된 `getCloseSchedules()`로 실제 목록을 조회한 뒤
  route ID가 일치하는 항목을 선택한다.
- 상세 초기값에 `getMockCloseSchedule` 또는 localStorage mock을 사용하지
  않으며, 승인되지 않은 단일 조회 endpoint도 추가하지 않는다.
- 수정이므로 기존 `useMutation`을 유지한다.
- 수정 분기에서 `updateMockCloseSchedule` 대신 `updateCloseSchedule`을
  호출하고 생성 분기는 기존 `createCloseSchedule`을 유지한다.
- `initialSchedule.id`를 number로 변환해 API 함수 경계에서 검증한다.
- 성공 시 기존 `['close-schedules']` prefix를 무효화한 뒤 목록으로 이동한다.
- 실패 시 캐시를 성공 상태로 변경하거나 localStorage mock 수정으로
  fallback하지 않는다.
- 기존 `submittingRef`와 pending button 상태로 중복 요청을 막는다.

## UI 연결

- 기존 날짜·제목 검증 dialog를 유지한다.
- pending 중 `수정 중`과 disabled 상태를 유지한다.
- 오류 시 입력과 수정 화면을 유지하고
  `수정하지 못했습니다. 다시 시도해 주세요.`를 표시한다.
- 성공 시 `/notices/guide`로 이동하고 전체 조회 API가 목록을 갱신한다.
- 생성과 삭제 분기는 변경하지 않는다.

## 검증 순서

1. `yarn harness:api:validate close-dat-update`
2. `yarn harness:api:gate close-dat-update`
3. 변경 소스 대상
   `yarn harness:api:policy close-dat-update src/entities/close-schedule/api/types.ts src/entities/close-schedule/api/closeScheduleApi.ts src/entities/close-schedule/index.ts src/pages/notices/guide/EditCloseSchedulePage.tsx src/features/create-close-schedule/ui/CloseScheduleForm.tsx`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api close-dat-update`
8. 기존 휴관일 생성·삭제·조회 API 표적 회귀 테스트

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- 성공 응답이 HTTP 200/204이거나 body가 없으면 Contract와 승인을 갱신한다.
- request body에 추가 필드가 필요하면 Contract를 먼저 보완한다.
- 단일 휴관일 조회 API를 추측해 추가하지 않는다.
- 구현 중 승인 Contract 밖의 request 또는 response 필드가 필요하면 중단하고
  ⑧ 승인 단계로 돌아간다.
