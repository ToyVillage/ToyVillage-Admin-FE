# Implementation Plan — app-work-report-query-all

## 승인 기준

- `GET /work-report`, Authorization Bearer required, roles `ADMIN`
- Query `page`(1부터)·`size`·`status` optional로 동결. 화면은 `page`, `size=10`, `status`를 보내고 `sort`는 보내지 않는다(2026-09-13 개발자 결정)
- 성공 `200` body `{ reports[], totalPageSize, pendingCount, approvedCount, rejectedCount }` 전 필드 required·non-null
- `reports[].status` 허용값 `PENDING`/`APPROVED`/`REJECTED`, `reports[].priority` 허용값 `HIGH`/`MEDIUM`/`LOW`
- 오류 400/401/500 공통 body
- 실제 서버 테스트 disabled
- 업무보고 네 spec(`app-work-report-query-all`, `-query-detail`, `-approve`, `-reject`)이 모두 승인된 뒤 한 번에 구현한다

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`, `src/app/config/configureApiAuthentication.ts` interceptor
- `src/entities/task/api/taskApi.ts`의 id·파라미터 검증, `unknown` 응답 타입 가드, 도메인 매핑 패턴
- `src/pages/tasks/TaskListPage.tsx`의 `['…', 'list', { page, size, status }]` key, `placeholderData`, `totalPageSize` 페이지 수와 렌더 중 페이지 보정
- `TaskReportTable`, `CategoryTabs`, 로딩·오류·빈 상태 문구

## 변경 파일

- 신규 `src/entities/task-report/api/types.ts`
- 신규 `src/entities/task-report/api/taskReportApi.ts`
- `src/entities/task-report/index.ts` (API export 추가, mock export 제거)
- `src/pages/task-reports/TaskReportListPage.tsx`
- 신규 `tests/e2e/api/app-work-report-query-all.spec.ts`
- `tests/e2e/task-report.spec.ts` (목록 시나리오를 `GET /work-report` route mock으로 이관)

## 타입과 API 함수

- `src/entities/task-report/api/types.ts`
  - `TaskReportQueryAllRequest { page: number; size: number; status: TaskReportReviewStatus }`
  - `TaskReportQueryAllResponseItem { id; taskId; name; title; status; priority; finishDate }`
  - `TaskReportQueryAllResponse { reports; totalPageSize; pendingCount; approvedCount; rejectedCount }`
  - `TaskReportErrorResponse { message; status; timestamp; description }`
- `src/entities/task-report/api/taskReportApi.ts`
  - `getTaskReports({ page, size, status })`
    - `page`는 `Number.isSafeInteger && >= 1`, `size`는 `> 0`이 아니면 명시적 Error
    - `api.get<unknown>('/work-report', { params: { page, size, status } })`
    - `isTaskReportQueryAllResponse` 타입 가드(허용값 밖 enum, 정수 아닌 건수 거부) 실패 시 명시적 Error
    - 반환 `TaskReportListPage { items: TaskReportListItem[]; totalPageSize; counts: Record<TaskReportReviewStatus, number> }`
      - `items`: `{ id: String(id), assigneeName: name, reviewStatus: status, priority, dueDate: finishDate }`
      - `counts`: `{ PENDING: pendingCount, APPROVED: approvedCount, REJECTED: rejectedCount }`
- `src/entities/task-report/model/types.ts`는 `app-work-report-query-detail` 계획에서 함께 정리한다

## Query/Mutation과 캐시

- `useQuery({ queryKey: ['task-reports', 'list', { page, size: TABLE_PAGE_SIZE, status: activeStatus }], queryFn: () => getTaskReports({ page, size: TABLE_PAGE_SIZE, status: activeStatus }), placeholderData: (previousData) => previousData })`
- 승인·반려 후 무효화 key는 `['task-reports', 'list']` prefix(`app-work-report-approve` 계획)

## UI 연결

- `TaskReportListPage`
  - `TABLE_PAGE_SIZE = 10`으로 바꾸고 Figma 3행 주석을 개발자 결정으로 고친다
  - `getMockTaskReports`와 클라이언트 필터·건수 계산·`slice` 분할 제거
  - 탭: `taskReportReviewStatuses.map((reviewStatus) => ({ reviewStatus, label, count: data?.counts[reviewStatus] ?? 0 }))`. `isPending` 동안은 기존 전체 로딩 화면이 먼저 뜨므로 0이 보이지 않는다
  - 표: `reports={data.items}`, `pagination={{ page, pageCount, onChange: setPage }}`
  - `pageCount = Math.max(1, data?.totalPageSize ?? 1)`, `if (data && page > pageCount) setPage(pageCount)` — 기존 `Math.min(page, pageCount)` 보정을 대체
  - 탭 전환 시 `setPage(1)` 유지, 케밥·반려 모달·토스트·초점 로직 유지
  - `isPending` → 기존 로딩 화면, `isError` → 기존 오류 화면

## 기존 테스트 정리

- `tests/e2e/task-report.spec.ts` 목록 시나리오(S1–S8, S14, S17, S25–S29)의 localStorage 시드를 `GET /work-report` route mock으로 바꾼다. 요청 query(`page`, `size=10`, `status`)에 따라 응답을 돌려주는 헬퍼를 둔다. 시나리오 의도(탭 라벨 `심사대기 N`, 페이지네이션 이동)는 유지하고, 한 페이지 행 수 기대값은 3에서 10으로 바꾼다. 페이지네이션 시나리오는 route mock의 `totalPageSize`로 여러 페이지를 만든다.
- 변경 후 `harness/publishing/approvals/task-report.approved.json`의 e2e 해시 재동결이 필요하다(퍼블리싱 승인 절차).

## 검증 순서

1. `yarn harness:api:validate app-work-report-query-all`
2. `yarn harness:api:gate app-work-report-query-all`
3. `yarn harness:api:policy app-work-report-query-all src/entities/task-report/api/types.ts src/entities/task-report/api/taskReportApi.ts src/entities/task-report/index.ts src/pages/task-reports/TaskReportListPage.tsx`
4. `yarn lint`, `yarn typecheck`, `yarn build`
5. `yarn verify:api app-work-report-query-all`
6. `tests/e2e/task-report.spec.ts` 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- 응답에 Contract 밖 필드가 필요해지면 ⑧로 돌아간다.
- `page` 기준(1부터)이 서버와 다르다고 확인되면 Contract 재승인.
- 백엔드 질문: `harness/artifacts/api/work-report.backend-questions.md`
