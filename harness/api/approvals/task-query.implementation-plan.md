# Implementation Plan — task-query

## 승인 기준

- `GET /tasks/{id}`, Content-Type `application/json`, Authorization Bearer
  required, roles `ADMIN`·`USER`로 동결
- Path `id`: required, non-nullable, 양의 integer로 동결
- Query Parameter·Request Body 없음으로 동결
- 성공 `200` body 필드는 Contract 표대로 동결.
  `reports[].workReportId`와 `assignees[].position`만 nullable
- `status` 허용값 `IN_PROGRESS`/`COMPLETED`/`EXPIRED`,
  `priority` 허용값 `HIGH`/`MEDIUM`/`LOW`
- 오류 400 / 401 / 403 / 404 / 500 body 4필드 required로 동결
- 실제 서버 테스트 disabled

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`, `src/shared/api/auth.ts` interceptor
- `src/entities/notice/api/noticeApi.ts`의 `getNotice` — id 검증 → `unknown`
  응답 → runtime 검증 → 도메인 타입 매핑
- `src/entities/resource/model/types.ts`의 `attachments` + `attachmentFiles`
  이중 표현
- `TaskInfoRow`, `AttachmentList`, 상세/수정 화면의 로딩·오류 카드
- `TaskDetailPage`의 케밥 메뉴와 삭제 흐름(변경 없음)

## 변경 파일

- `src/entities/task/api/types.ts` (`TaskQueryRequest`/`TaskQueryResponse` 등)
- `src/entities/task/api/taskApi.ts` (`getTask` 추가)
- `src/entities/task/model/types.ts` (`Task`에 `assignees`,
  `assigneeCount`, `attachmentFiles` 반영)
- `src/entities/task/model/mock.ts` (`getMockTask` 제거, 남은 mock 정리)
- `src/entities/task/index.ts` (export 정리)
- `src/pages/tasks/TaskDetailPage.tsx` (서버 조회로 교체)
- `src/pages/tasks/EditTaskPage.tsx` (같은 query 재사용)
- `src/features/create-task/ui/TaskForm.tsx` (초기값 소스 변경 — 담당자
  복원은 `assignees[].id`, 첨부는 `attachmentFiles`)
- 신규 `tests/e2e/api/task-query.spec.ts`
- `tests/e2e/task-detail.spec.ts`, `tests/e2e/task-edit.spec.ts`
  (상세 조회 route mock 기반 최소 수정)

`task-query-all`의 상태 모델 개명이 선행 조건이다. 이 계획은 개명된
`TaskStatus`를 전제한다.

## 타입과 API 함수

```ts
// api/types.ts
export interface TaskQueryRequest {
  id: number
}

export interface TaskQueryAssigneeResponse {
  id: number
  name: string
  position: string | null
}

export interface TaskQueryFileResponse {
  fileName: string
  fileKey: string
}

export interface TaskQueryResponse {
  id: number
  title: string
  content: string
  assignees: TaskQueryAssigneeResponse[]
  assigneeCount: number
  status: TaskStatusValue
  priority: TaskPriorityValue
  finishDate: string
  createdAt: string
  files: TaskQueryFileResponse[]
  reports: TaskQueryReportResponse[]
  progress: TaskQueryProgressResponse
}
```

- `reports`·`progress` 타입도 Contract대로 선언한다(응답 형식 검증에 쓰고
  화면에는 연결하지 않는다).
- `getTask({ id })`
  - `Number.isSafeInteger(id) && id > 0` 검증
  - `api.get<unknown>(`/tasks/${id}`)`
  - runtime 검증: 위 필드의 타입과 enum 허용값. `assignees`·`files`는 배열,
    `position`은 `string | null`
  - 도메인 매핑
    ```ts
    {
      id: String(data.id),
      title, content,
      assignees: data.assignees,        // { id: number; name; position }
      assigneeCount: data.assigneeCount,
      status, priority,
      dueDate: data.finishDate,
      attachments: data.files.map(({ fileName }) => fileName),
      attachmentFiles: data.files,      // { fileName, fileKey }
    }
    ```
  - 검증 실패 시 명시적 Error. 빈 객체나 mock으로 대체하지 않는다.

## 도메인 타입 변경

```ts
export interface TaskAssignee {
  id: number
  name: string
  position: string | null
}

export interface Task {
  id: string
  title: string
  content: string
  assignees: TaskAssignee[]
  /** 담당자 총원. `외 N명` 은 assigneeCount - 1 이다. */
  assigneeCount: number
  status: TaskStatus
  priority: TaskPriority
  /** YYYY-MM-DD (`finishDate`) */
  dueDate: string
  attachments: string[]
  attachmentFiles: { fileName: string; fileKey: string }[]
}
```

- `assigneeIds: string[]`는 제거하고, 폼이 선택하는 값은
  `assignees.map(({ id }) => id)`(number)로 만든다.
- `CreateTaskInput`/`UpdateTaskInput`의 `assigneeIds`는 `number[]`가 된다
  (`task-create`·`task-update` 범위에서 확정).

## Query/Mutation과 캐시

- 상세: `useQuery({ queryKey: ['tasks', id], queryFn: () => getTask({ id: Number(id) }), enabled: Boolean(id) })`
- 수정 화면(`EditTaskPage`)은 같은 key·같은 `queryFn`을 쓴다. 상세를 먼저
  본 뒤 수정으로 들어오면 캐시를 재사용한다.
- 목록 prefix `['tasks']` 무효화가 `['tasks', id]`에도 prefix로 매칭된다.
- 삭제 성공 시 `removeQueries({ queryKey: ['tasks', id] })` 유지.
- `['task-reports','by-task',id]` mock query는 제거한다(2026-09-11). 담당자별
  보고 현황이 상세 응답에 함께 오므로 추가 조회가 없다.

## UI 연결

- `TaskInfoRow`
  - `assigneeName={task.assignees[0]?.name ?? ''}`
  - `assigneeExtraCount={Math.max(task.assigneeCount - 1, 0)}`
  - `status={task.status}`, `priority`, `dueDate` 그대로
- 본문 카드: `title`, `content`
- 첨부: `task.attachments.length > 0`일 때만 `AttachmentList` 렌더
- 로딩: 기존 `업무를 불러오는 중입니다.`
- 오류(404 포함): 기존 `업무를 찾을 수 없습니다.` + `목록으로 돌아가기`
- `TaskReportSummaryCard`(2026-09-11 추가)
  - `reviewStatus` 는 `status === 'MISSING' ? 'PENDING' : status` 로 매핑한다
    (미제출을 화면에서 `심사대기` 로 보여준다 — 개발자 결정)
  - `reportId`가 `null`이면 버튼이 아닌 줄로 그리고 chevron 을 뺀다
  - `onSelect={(reportId) => navigate(`/task-reports/${reportId}`)}`
- `TaskProgressCard`(2026-09-11 추가): `total`·`approved`·`rejected` 는
  `progress` 그대로, `pending` 은 `progress.pending + progress.missing` 이다.
  도넛 조각과 요약 문구는 기존 승인·반려·심사대기 세 가지를 유지한다
- `TaskForm`의 담당자 초기 선택: `initialTask.assignees.map(({ id }) => id)`
- `TaskForm`의 첨부 초기값: `initialTask.attachmentFiles`

## 기존 테스트 정리

- `tests/e2e/task-detail.spec.ts`: `page.goto('/tasks/1')` 전에
  `GET /api/tasks/1`을 route mock 한다. 담당자·상태·우선순위·첨부 검증 의도는
  유지한다. 업무보고 카드는 응답 `reports` 기준으로 바꾼다(2026-09-11).
- `tests/e2e/task-edit.spec.ts`: 진입 시 상세 조회를 mock 한다. 담당자 체크
  복원 검증은 `assignees` 응답 기준으로 바꾼다.

## 검증 순서

1. `yarn harness:api:validate task-query`
2. `yarn harness:api:gate task-query`
3. `yarn harness:api:policy task-query <변경된 src 파일>`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api task-query`
8. `tests/e2e/task-detail.spec.ts`, `tests/e2e/task-edit.spec.ts` 표적 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- `assignees`는 담당자 전원이다(2026-09-09 백엔드 확인). 수정 화면의 담당자
  복원은 이 배열만으로 성립한다. 명세 예시의 개수 불일치는 문서 오류다.
- `assignees[].id`가 `TEAM_QUERY_TREE`의 `members[].id`와 다른 체계면 재승인.
- `files`·`reports`가 배열이 아니라 `null`로 오면 재승인.
- `reports`·`progress`를 화면에 연결한다(2026-09-11 범위 추가). 업무보고
  목록·상세 화면(`/task-reports`)은 여전히 mock이며 별도 API 범위다.
- `reports[].status`에 네 값(`APPROVED`/`REJECTED`/`PENDING`/`MISSING`) 밖의
  값이 오면 오류로 처리한다. 명세에 허용값 표가 없어 `PENDING`은 같은 응답의
  `progress.pending` 을 근거로 받는다(백엔드 질문 5번). 다른 값이 확인되면
  재승인한다.
