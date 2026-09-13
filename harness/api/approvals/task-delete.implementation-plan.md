# Implementation Plan — task-delete

## 승인 기준

- Content-Type `application/json`, Authorization Bearer required로 동결
- Path `id`: required, nullable false, 양의 integer로 동결
- Query Parameters, Request Body: 없음으로 동결
- 성공 Status `200`, body `{ message: string }` required로 동결
- 오류 400/401/403/404/500 body 필드 모두 required로 동결
- 실제 서버 테스트 disabled

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`와 `src/shared/api/auth.ts` interceptor
- `src/entities/close-schedule/api/closeScheduleApi.ts`의 id 검증·runtime
  응답 검증 패턴
- `TaskForm`의 `deleteMutation`, `deletingRef`, 삭제 확인 다이얼로그, 실패
  토스트, 성공 시 캐시 무효화·제거·`onCompleted('deleted')`
- `TaskDetailPage`의 `/tasks` 이동 + `delete-success` 토스트 state

## 변경 파일

- 신규 `src/entities/task/api/types.ts`
- 신규 `src/entities/task/api/taskApi.ts`
- `src/entities/task/index.ts` (export 추가)
- `src/features/create-task/ui/TaskForm.tsx` (삭제 mutationFn 교체)
- 신규 `tests/e2e/api/task-delete.spec.ts`
- `tests/e2e/task-edit.spec.ts` (삭제 시나리오를 DELETE route mock 기반으로
  최소 수정)

## 타입과 API 함수

- `TaskDeleteRequest { id: number }`, `TaskDeleteResponse { message: string }`,
  `TaskDeleteErrorResponse { message; status; timestamp; description }`
- `deleteTask({ id })`: `Number.isSafeInteger(id) && id > 0` 검증 →
  `api.delete<unknown>(`/tasks/${id}`)` → `status === 200`과
  `message: string` runtime 검증 → 아니면 명시적 Error
- body·query 전달 없음

## Query/Mutation과 캐시

- `TaskForm.deleteMutation.mutationFn`을
  `deleteTask({ id: Number(initialTask.id) })`로 교체
- 성공: 기존 `invalidateQueries(['tasks'])`, `removeQueries(['tasks', id])`
  유지
- 실패: 기존 `deletingRef` 해제·토스트 유지. mock 삭제 fallback 없음
- 생성·수정 mutation은 `createMockTask`/`updateMockTask` 그대로 유지

## UI 연결

- 다이얼로그, 문구, 초점 처리, 토스트 모두 변경 없음
- `TaskDetailPage` 변경 없음

## 기존 테스트 정리

- `tests/e2e/task-edit.spec.ts`의 S8(삭제 확인), S14(삭제 실패), S19(중복
  제출 중 삭제)는 localStorage mock 제어점(`mutation-delay`, `mutation-log`)
  전제. DELETE를 `page.route()`로 mock 하도록 최소 수정하고 검증 의도는
  유지한다. S7, S13(취소·Esc)은 요청이 없으므로 그대로 둔다.
- `mock.ts`의 `deleteMockTask`와 delete 관련 mutation 로그 분기는 사용처가
  없어지면 제거한다(create/update 제어점은 유지).

## 검증 순서

1. `yarn harness:api:validate task-delete`
2. `yarn harness:api:gate task-delete`
3. `yarn harness:api:policy task-delete src/entities/task/api/types.ts src/entities/task/api/taskApi.ts src/entities/task/index.ts src/features/create-task/ui/TaskForm.tsx`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api task-delete`
8. `tests/e2e/task-edit.spec.ts` 표적 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- 성공 응답이 200이 아니거나 `message`가 없으면 Contract 재승인
- 단일 조회·목록 API를 추측해 추가하지 않는다
- 승인 Contract 밖의 필드가 필요하면 ⑧로 돌아간다
