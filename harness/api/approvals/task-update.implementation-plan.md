# Implementation Plan — task-update

## 승인 기준

- `PUT /tasks/{id}`, Content-Type `application/json`, Authorization Bearer
  required, role `ADMIN`으로 동결
- Path `id`: required, non-nullable, 양의 integer로 동결
- Query Parameter 없음으로 동결
- Request Body required. `title`, `content`, `assigneeIds`, `finishDate`,
  `priority`, `files` 6필드만 전송. `files`만 nullable(기존 유지)이며
  이번 구현은 `null`을 보내지 않는다
- `priority` 허용값 `HIGH`/`MEDIUM`/`LOW`, `finishDate`는 `yyyy-MM-dd`
- 성공 `200` body `{ message: string }`로 동결
- 오류 400 / 401 / 403 / 404 / 500 body 4필드 required로 동결
- 첨부 fileKey는 승인된 `FILE_CREATE`(`POST /file`) 응답과 `TASK_QUERY`
  응답의 기존 `files[].fileKey`를 쓴다
- 실제 서버 테스트 disabled

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`, `src/shared/api/auth.ts` interceptor
- `src/entities/notice/api/noticeApi.ts`의 `updateNotice` — id 검증 →
  `unknown` 응답 → `message` runtime 검증
- `src/entities/file`의 `uploadFile`
- `TaskForm`의 검증 순서·중복 제출 방지·실패 문구·성공 시 캐시 처리,
  `EditTaskPage`의 이탈 방지와 `/tasks/:id` 이동
- `ResourceUploadField`가 쓰는 `{ fileName, fileKey }` 초기 첨부 표현

`team-query-tree`와 `task-query` 연동이 선행 조건이다.

## 변경 파일

- `src/entities/task/api/types.ts` (`TaskUpdateRequest`/`TaskUpdateResponse`)
- `src/entities/task/api/taskApi.ts` (`updateTask` 추가)
- `src/entities/task/model/types.ts` (`UpdateTaskInput.assigneeIds: number[]`)
- `src/entities/task/model/mock.ts` (`updateMockTask`와 남은 제어점 제거 —
  이 연동으로 업무지시 mock 전체가 사라진다)
- `src/entities/task/index.ts` (export 정리)
- `src/shared/ui/AttachmentField.tsx` (optional `initialFiles`,
  `onFileItemsChange` 추가)
- `src/features/create-task/ui/TaskForm.tsx` (수정 mutationFn 교체,
  첨부 항목 수집)
- 신규 `tests/e2e/api/task-update.spec.ts`
- `tests/e2e/task-edit.spec.ts` (route mock 기반 최소 수정)

## 타입과 API 함수

```ts
// api/types.ts
export interface TaskUpdateRequest {
  title: string
  content: string
  assigneeIds: number[]
  finishDate: string
  priority: TaskPriorityValue
  files: string[]
}

export interface TaskUpdateResponse {
  message: string
}

export interface TaskUpdateErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
```

- `updateTask({ id, input })`
  - `Number.isSafeInteger(id) && id > 0` 검증
  - `api.put<unknown>(`/tasks/${id}`, input)`
  - `status === 200`과 `message: string` runtime 검증
  - Contract 밖 필드를 body에 넣지 않는다

## 첨부 필드 확장

```ts
// shared/ui/AttachmentField.tsx
export interface AttachmentItem {
  name: string
  /** 기존 첨부: 서버가 준 저장소 키 */
  fileKey?: string
  /** 새로 첨부한 파일 */
  file?: File
}

interface AttachmentFieldProps {
  // 기존 props 유지
  initialFiles?: { fileName: string; fileKey: string }[]
  onFileItemsChange?: (items: AttachmentItem[]) => void
}
```

- `initialFiles`가 있으면 그것으로 초기 목록을 만들고, 없으면 기존
  `initialFileNames`를 그대로 쓴다. 두 prop을 동시에 받지 않는다.
- `onFileItemsChange`는 현재 목록 순서대로 `{ name, fileKey?, file? }`를
  내보낸다. shared는 도메인 타입에 의존하지 않고 업로드도 하지 않는다.
- 다른 호출부(공지·자료·업무 생성)는 optional prop을 쓰지 않으므로 동작이
  바뀌지 않는다.

## Query/Mutation과 캐시

`TaskForm`의 수정 경로 mutationFn:

```ts
const files: string[] = []
for (const item of attachmentItems) {
  if (item.fileKey) {
    files.push(item.fileKey)
    continue
  }
  if (!item.file) continue
  const { fileKey } = await uploadFile({ files: item.file })
  files.push(fileKey)
}

await updateTask({
  id: Number(initialTask.id),
  input: { title, content, assigneeIds, finishDate: dueDate, priority, files },
})
```

- 첨부를 모두 지우면 `files: []`(첨부 초기화). `null`은 보내지 않는다.
- 성공: 기존 `invalidateQueries({ queryKey: ['tasks'] })` +
  `removeQueries({ queryKey: ['tasks', initialTask.id] })` 후 `onCompleted()`
  → `/tasks/:id`로 이동. 상세가 다시 조회되어 최신 값이 보인다.
- 실패: `submittingRef`를 풀고 입력값을 유지한다. localStorage 저장으로
  fallback 하지 않는다.
- `['teams','tree']`는 무효화하지 않는다.

## UI 연결

- 검증 순서·문구·포커스 복귀: 변경 없음
- 제출 중 버튼 라벨 `저장 중`과 `disabled`: 변경 없음
- 실패 문구 `저장하지 못했습니다. 다시 시도해 주세요.`: 변경 없음
- 성공 토스트 없음(결과는 상세 화면에서 확인 — spec 결정 사항)
- 담당자 초기 체크는 `initialTask.assignees[].id`(`task-query` 범위)

## 기존 테스트 정리

- `tests/e2e/task-edit.spec.ts`: 진입 시 `GET /api/tasks/:id`,
  `GET /api/team/tree`를 mock 하고 저장은 `PUT /api/tasks/:id`를 mock 한다.
  `mutation-log`·`mutation-delay` 전제 시나리오는 요청 횟수·route 지연으로
  바꾼다. 삭제 시나리오는 `task-delete` 연동에서 정리된 형태를 유지한다.
- `mock.ts`는 이 단계에서 업무지시 mock 전체(생성·수정·조회·저장 키·제어점)를
  제거한다.

## 검증 순서

1. `yarn harness:api:validate task-update`
2. `yarn harness:api:gate task-update`
3. `yarn harness:api:policy task-update <변경된 src 파일>`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api task-update`
8. `tests/e2e/task-edit.spec.ts` 표적 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- `TASK_QUERY`의 `assignees`는 담당자 전원이다(2026-09-09 백엔드 확인).
  전체 교체로 담당자가 유실될 위험은 해소됐다.
- `assigneeIds`가 `files`처럼 `null`이면 기존 유지로 처리되는지 확정 필요
  (Backend Question 2). 현재는 항상 전체 교체로 보낸다.
- 성공 status가 `200`이 아니거나 `message`가 없으면 재승인.
- `Content-Type`이 `application/json`이 아니면 재승인.
- Contract 밖 필드(`status`, `assigneeType` 등)를 보내지 않는다.
