# Implementation Plan — task-query-all

## 승인 기준

- `GET /tasks`, Content-Type `application/json`, Authorization Bearer required,
  role `ADMIN`으로 동결
- Query `page`·`size`·`sort`·`status` 모두 optional, non-nullable로 동결.
  `status` 허용값 `IN_PROGRESS` / `COMPLETED` / `EXPIRED`로 동결
- Path Parameter·Request Body 없음으로 동결
- 성공 `200` body `{ tasks[], totalPageSize }` 전 필드 required·non-nullable로
  동결. `tasks[].priority` 허용값 `HIGH`/`MEDIUM`/`LOW`
- 오류 400 / 401 / 500 body 4필드 required로 동결(403은 명세에 없다)
- `assigneeCount`는 담당자 총원, `totalPageSize`는 총 페이지 수
- 실제 서버 테스트 disabled

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`와 `src/shared/api/auth.ts` interceptor
- `src/entities/resource/api`의 `getDocuments` — `params` 객체 전달 +
  `unknown` 응답 runtime 검증 + 도메인 타입 매핑
- `ResourceListPage`의 서버 페이지네이션 형태(1-base 화면 페이지 → `page - 1`,
  `placeholderData: (previousData) => previousData`)
- `TaskTable`, `TaskStatusBadge`, `TaskAssigneeCell`, `CategoryTabs`,
  `RowActionMenu`, `DeleteConfirmationDialog`, `Toast` — 표현 변경 없음
- `TaskListPage`의 케밥 메뉴·삭제 흐름·토스트 state 처리

## 변경 파일

- `src/entities/task/api/types.ts` (조회 request/response 타입 추가)
- `src/entities/task/api/taskApi.ts` (`getTasks` 추가)
- `src/entities/task/model/types.ts` (상태 값 개명, `TaskProgressStatus` 제거)
- `src/entities/task/model/labels.ts` (`taskStatusLabels` 키 교체)
- 삭제 `src/entities/task/model/status.ts`
  (`resolveTaskStatus`, `taskToday`)
- `src/entities/task/model/mock.ts` (저장값 검증·`mockTasks`의 상태 값 개명,
  `recordDeletedMockTask`/`deletedTaskStorageKey` 제거)
- `src/entities/task/ui/TaskStatusBadge.tsx` (분기 값 개명)
- `src/entities/task/ui/TaskTable.tsx` (기준일 헬퍼 내부화)
- `src/entities/task/index.ts` (export 정리)
- `src/entities/task-report/model/mock.ts` (`taskStatus` 값 개명 12곳)
- `src/pages/tasks/TaskListPage.tsx` (서버 조회로 교체)
- `src/pages/tasks/TaskDetailPage.tsx` (개명 반영 — `resolveTaskStatus(task)`
  호출부가 타입 오류가 나지 않도록 `task.status`를 그대로 넘긴다. 상세 조회
  연동은 `task-query` 범위)
- 신규 `tests/e2e/api/task-query-all.spec.ts`
- `tests/e2e/task-list.spec.ts` (route mock 기반 최소 수정)

## 타입과 API 함수

```ts
// api/types.ts
export type TaskStatusFilter = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'

export interface TaskQueryAllRequest {
  page: number
  size: number
  status?: TaskStatusFilter
}

export interface TaskQueryAssigneeResponse {
  id: number
  name: string
  position: string | null
}

export interface TaskQueryAllResponseItem {
  id: number
  title: string
  assignees: TaskQueryAssigneeResponse[]
  assigneeCount: number
  status: TaskStatusFilter
  priority: TaskPriorityValue
  finishDate: string
}

export interface TaskQueryAllResponse {
  tasks: TaskQueryAllResponseItem[]
  totalPageSize: number
}

export interface TaskQueryAllErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
```

- `getTasks({ page, size, status })`
  - `page >= 0`, `size > 0`의 safe integer 검증
  - `api.get<unknown>('/tasks', { params })` — `status`가 없으면 params에서
    생략한다(`전체 업무` 탭)
  - runtime 검증: `tasks` 배열, 각 항목의 `id`·`assigneeCount` 정수,
    `title`·`finishDate` 문자열, `assignees`가 `{ id, name, position }` 배열,
    `status`·`priority`가 허용값, `totalPageSize` 정수
  - 반환: `{ items: TaskListItem[]; totalPageSize: number }`
    - `id: String(task.id)` (라우트가 문자열 id를 쓴다 — notice와 같은 규칙)
    - `assigneeName: assignees[0]?.name ?? ''` (대표 담당자)
    - `assigneeExtraCount: Math.max(assigneeCount - 1, 0)`
    - `dueDate: finishDate`
- 응답이 검증에 실패하면 명시적 Error를 던진다. 빈 배열이나 mock으로
  대체하지 않는다.

## 상태 모델 변경

```ts
export const taskStatuses = ['IN_PROGRESS', 'COMPLETED', 'EXPIRED'] as const
export type TaskStatus = (typeof taskStatuses)[number]
```

- `taskProgressStatuses` / `TaskProgressStatus` 제거. `Task.status`는
  `TaskStatus` 하나를 쓴다.
- `taskStatusLabels`: `IN_PROGRESS: '진행중'`, `COMPLETED: '완료'`,
  `EXPIRED: '지연'`
- `TaskStatusBadge`: `COMPLETED`는 accent, `EXPIRED`는 warning, 나머지는 회색
  (색 배정은 현행 유지)
- `model/status.ts` 삭제. `TaskTable`은 파일 하단 순수 헬퍼
  `function todayString()`으로 기준일을 만들고 `today` prop이 있으면 그것을
  우선한다. 완료기한 위험색 규칙 자체는 바뀌지 않는다.

## Query/Mutation과 캐시

- 목록 query
  ```ts
  useQuery({
    queryKey: ['tasks', 'list', { page, size: TABLE_PAGE_SIZE, status }],
    queryFn: () => getTasks({ page: page - 1, size: TABLE_PAGE_SIZE, status }),
    placeholderData: (previousData) => previousData,
  })
  ```
  - `status`는 `tabStatuses[active]`(`전체 업무`는 `undefined`)
  - `['tasks']` prefix를 유지하므로 기존 `invalidateQueries({ queryKey: ['tasks'] })`가
    그대로 매칭된다. 상세 key `['tasks', id]`와 겹치지 않는다.
- `pageCount = Math.max(1, totalPageSize)`, `currentPage = Math.min(page, pageCount)`
- 탭 변경 시 1페이지로 되돌리는 기존 렌더 중 보정은 유지한다.
- 삭제 mutation(`deleteTask`)은 그대로 두고 `recordDeletedMockTask` 호출만
  제거한다. 성공 시 `removeQueries(['tasks', id])` +
  `invalidateQueries(['tasks'])`가 서버 목록을 다시 불러온다.

## UI 연결

- 로딩: `isPending` → 기존 `업무를 불러오는 중입니다.` 카드
- 오류: `isError` → 기존 `업무를 불러오지 못했습니다. 다시 시도해 주세요.` 카드
- 빈 목록: `tasks: []` → 기존 `등록된 업무가 없습니다.`
- 행 클릭·케밥(`수정`/`삭제`)·삭제 토스트·`create-success` 토스트 state 처리
  모두 변경 없음
- 표에 넘기는 `today`는 기존과 같이 목록에서 한 번 계산해 전달한다

## 기존 테스트 정리

- `tests/e2e/task-list.spec.ts`: `page.goto('/tasks')` 전에
  `GET /api/tasks*`를 `page.route()`로 mock 한다. 탭·페이지네이션 시나리오는
  요청 query(`status`, `page`)를 확인하는 형태로 바꾸고, 검증 의도(행 수, 탭
  aria-pressed, 이동, 삭제 결과 토스트)는 유지한다.
- localStorage `toyvillage:tasks:deleted` 전제(S19·S20)는 삭제 후
  재조회 응답으로 대체한다.

## 검증 순서

1. `yarn harness:api:validate task-query-all`
2. `yarn harness:api:gate task-query-all`
3. `yarn harness:api:policy task-query-all <변경된 src 파일>`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api task-query-all`
8. `tests/e2e/task-list.spec.ts` 표적 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- `status` 허용값이 `IN_PROGRESS`/`COMPLETED`/`EXPIRED` 셋이 아니면 재승인
  (Contract Backend Question 1·4).
- `totalPageSize`가 총 페이지 수가 아니라 페이지 크기이면 재승인.
- 403 응답이 실제로 오면 Contract에 없으므로 재승인(현재는 다른 오류와 같이
  실패 화면으로 처리된다).
- Contract 밖의 필드(`createdAt`, `assigneeIds` 등)를 목록에서 쓰지 않는다.
