# Implementation Plan — app-work-report-approve

## 승인 기준

- `PATCH /work-report/approve/{workReportId}`, Authorization Bearer required, roles `ADMIN`
- Path `workReportId` required, 양의 정수. Query·Body 없음
- 성공 `200` body `{ message: string }` required. 다른 성공 status는 실패로 본다
- 오류 401/404/409/500 공통 body
- 실제 서버 테스트 disabled
- 업무보고 네 spec이 모두 승인된 뒤 한 번에 구현한다

## 재사용할 기존 코드

- `src/entities/task/api/taskApi.ts`의 `updateTask`/`deleteTask`(id 검증, `status === 200`, `message` 검증)
- `useReviewTaskReport`의 중복 요청 차단(`reviewingRef`), 화면 콜백 구조, `taskReportReviewToasts`
- 목록 케밥·상세 버튼 UI 전부

## 변경 파일

- `src/entities/task-report/api/types.ts`, `src/entities/task-report/api/taskReportApi.ts` (승인 타입·함수)
- `src/entities/task-report/index.ts`
- `src/features/review-task-report/model/useReviewTaskReport.ts`
- 신규 `tests/e2e/api/app-work-report-approve.spec.ts`
- `tests/e2e/task-report.spec.ts` (승인 시나리오 route mock 이관)

## 타입과 API 함수

- `TaskReportApproveRequest { id: number }`, `TaskReportApproveResponse { message: string }`
- `approveTaskReport({ id })`
  - `Number.isSafeInteger(id) && id > 0` 아니면 명시적 Error
  - `api.patch<unknown>(`/work-report/approve/${id}`)` — body 없음
  - `status !== 200` 또는 `message`가 string이 아니면 명시적 Error

## Query/Mutation과 캐시

- `useReviewTaskReport.mutationFn`
  - `action === 'approve'` → `approveTaskReport({ id: Number(id) })`
  - `action === 'reject'` → `rejectTaskReport(…)` (`app-work-report-reject` 계획)
  - `reviewMockTaskReport` 호출 제거
- `onSuccess`
  - `invalidateQueries({ queryKey: ['task-reports', 'list'], refetchType: 'all' })` — 기존 exact `['task-reports']`를 새 목록 key prefix로 교체
  - `invalidateQueries({ queryKey: ['task-reports', id], exact: true, refetchType: 'none' })` 유지
  - `invalidateQueries({ queryKey: ['tasks'] })` 추가 — 업무지시 `COMPLETED` 전환, 업무 상세 보고 현황
- 실패 시 캐시 변경 없음, mock fallback 없음

## UI 연결

- 목록·상세 화면 코드 변경 없음(콜백·토스트·이동·초점 그대로)

## 기존 테스트 정리

- `tests/e2e/task-report.spec.ts`의 승인 관련 시나리오(S11, S13, S27, S30, S32)에서 `mutation-delay`/`mutation-log`/`fail` 키를 `PATCH /work-report/approve/{id}` route mock으로 바꾼다.
  - 진행 중 상태: route에서 응답을 늦춘다
  - 요청 횟수: route 핸들러 카운트
  - 실패: 500 응답
- 성공 후 목록 재조회로 탭 건수가 바뀌는 기대값은 route mock 상태(승인된 id 집합)로 재현한다.

## 검증 순서

1. `yarn harness:api:validate app-work-report-approve`
2. `yarn harness:api:gate app-work-report-approve`
3. `yarn harness:api:policy app-work-report-approve src/entities/task-report/api/types.ts src/entities/task-report/api/taskReportApi.ts src/entities/task-report/index.ts src/features/review-task-report/model/useReviewTaskReport.ts`
4. `yarn lint`, `yarn typecheck`, `yarn build`
5. `yarn verify:api app-work-report-approve`
6. `tests/e2e/task-report.spec.ts` 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- 서버 `message`를 화면에 표시해야 하면 ⑧로 돌아간다.
- 성공 status가 200이 아니라고 확인되면 Contract 재승인.
- 백엔드 질문: `harness/artifacts/api/work-report.backend-questions.md`
