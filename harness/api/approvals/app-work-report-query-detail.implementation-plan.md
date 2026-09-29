# Implementation Plan — app-work-report-query-detail

## 승인 기준

- `GET /work-report/detail/{workReportId}`, Authorization Bearer required, roles `ADMIN`
- Path `workReportId` required, 양의 정수
- Query·Body 없음
- 성공 `200` body 전 필드 required. `rejectionReason`만 nullable
- `status` 허용값 `PENDING`/`APPROVED`/`REJECTED`(목록 API 값 적용), `priority` 허용값 `HIGH`/`MEDIUM`/`LOW`
- 오류 401/404/500 공통 body
- 실제 서버 테스트 disabled
- 업무보고 네 spec이 모두 승인된 뒤 한 번에 구현한다

## 재사용할 기존 코드

- `src/entities/task/api/taskApi.ts`의 `getTask` 패턴(id 검증, 타입 가드, `files` → 파일 이름 매핑)
- `TaskReportDetailPage`의 로딩·오류 화면, `TaskReportMetaRow`, `TaskReportContentCard`, `AttachmentList`, `TaskReportReviewActions`
- `TaskReportSummaryCard`의 `onSelect`(null id 줄은 버튼이 아님)

## 변경 파일

- `src/entities/task-report/api/types.ts`, `src/entities/task-report/api/taskReportApi.ts` (상세 타입·함수 추가)
- `src/entities/task-report/model/types.ts` (API에 없는 `taskId`, `assigneeId` 제거)
- `src/entities/task-report/model/mock.ts` 삭제 (네 API 교체 완료 시점)
- `src/entities/task-report/index.ts`
- `src/pages/task-reports/TaskReportDetailPage.tsx`
- `src/pages/tasks/TaskDetailPage.tsx` (보고 줄 `onSelect` 복구, 보류 주석 제거)
- 신규 `tests/e2e/api/app-work-report-query-detail.spec.ts`
- `tests/e2e/task-report.spec.ts` (상세 시나리오 route mock 이관, S16 기대값 복구)
- `tests/e2e/api/task-query.spec.ts` S15, `tests/e2e/task-detail.spec.ts` (보고 줄 이동 기대값 복구)
- `harness/api/approvals/task-query.test-scenarios.md` S15 문구 복구는 `task-query` 재승인으로 처리한다(이 계획에서 직접 편집하지 않음)

## 타입과 API 함수

- `TaskReportQueryRequest { id: number }`
- `TaskReportQueryFileResponse { fileName: string; fileKey: string }`
- `TaskReportQueryResponse { id; title; priority; finishDate; taskId; name; content; note; files; status; rejectionReason: string | null }`
- `getTaskReport({ id })`
  - `Number.isSafeInteger(id) && id > 0` 아니면 명시적 Error
  - `api.get<unknown>(`/work-report/detail/${id}`)`
  - `isTaskReportQueryResponse`: 화면이 쓰는 `id`, `title`, `priority`, `finishDate`, `name`, `content`, `files[].fileName`, `status`를 검증한다. `taskId`, `note`, `fileKey`, `rejectionReason`은 검증하지 않는다(쓰지 않음, Nullable 미확정)
  - 반환 `TaskReport { id: String(id), assigneeName: name, title, content, reviewStatus: status, priority, dueDate: finishDate, attachments: files.map(({ fileName }) => fileName) }`

## Query/Mutation과 캐시

- `useQuery({ queryKey: ['task-reports', id], queryFn: () => getTaskReport({ id: Number(id) }), enabled: Boolean(id) })` — key 유지
- 승인·반려 성공 후 `['task-reports', id]` exact `refetchType: 'none'` 유지(`app-work-report-approve` 계획)

## UI 연결

- `TaskReportDetailPage`: `getMockTaskReport` → `getTaskReport`. `!report` 분기는 API가 null을 반환하지 않으므로 `isError`만 남긴다. `attachments ?? []` → `attachments`
- `TaskDetailPage`: `<TaskReportSummaryCard items={reportItems} onSelect={(reportId) => navigate(`/task-reports/${reportId}`)} />`

## 기존 테스트 정리

- `tests/e2e/task-report.spec.ts` 상세 시나리오(S9–S12, S15, S18–S24, S32–S33)를 `/task-reports/{숫자 id}` + `GET /work-report/detail/{id}` route mock으로 이관한다. S15(없는 보고)는 404 응답으로 바꾼다. S16은 “제출된 줄을 누르면 보고 상세로 이동”으로 복구한다.
- `tests/e2e/api/task-query.spec.ts` S15, `tests/e2e/task-detail.spec.ts` 보고 줄: 제출된 3줄이 버튼이고 첫 줄 클릭 시 `/task-reports/31`로 이동.
- 재동결: `task-report`·`task-detail` 퍼블리싱 e2e 해시, `task-query` API 시나리오·테스트 해시.

## 검증 순서

1. `yarn harness:api:validate app-work-report-query-detail`
2. `yarn harness:api:gate app-work-report-query-detail`
3. `yarn harness:api:policy app-work-report-query-detail src/entities/task-report/api/types.ts src/entities/task-report/api/taskReportApi.ts src/entities/task-report/model/types.ts src/entities/task-report/index.ts src/pages/task-reports/TaskReportDetailPage.tsx src/pages/tasks/TaskDetailPage.tsx`
4. `yarn lint`, `yarn typecheck`, `yarn build`
5. `yarn verify:api app-work-report-query-detail`
6. `yarn verify:api task-query`, `tests/e2e/task-report.spec.ts`, `tests/e2e/task-detail.spec.ts` 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- `note`·`rejectionReason` 등 지금 쓰지 않는 필드를 화면에 표시해야 하면 ⑧로 돌아간다.
- `task-query` 재승인이 거절되면 보고 줄 이동 복구를 이 범위에서 뺀다.
- 백엔드 질문: `harness/artifacts/api/work-report.backend-questions.md`
