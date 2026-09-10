# Implementation Plan — task-create

## 승인 기준

- `POST /tasks`, Content-Type `application/json`, Authorization Bearer
  required, role `ADMIN`으로 동결
- Path Parameter·Query Parameter 없음으로 동결
- Request Body required. `title`, `content`, `assigneeIds`, `finishDate`,
  `priority`, `files` 6필드만 전송하며 모두 required·non-nullable로 동결
- `priority` 허용값 `HIGH`/`MEDIUM`/`LOW`, `finishDate`는 `yyyy-MM-dd`,
  `files`는 첨부가 없으면 빈 배열
- 성공 `201` body `{ message: string }`로 동결
- 오류 400 / 401 / 403 / 500 body 4필드 required로 동결
- 첨부 fileKey는 승인된 `FILE_CREATE`(`POST /file`) 응답을 쓴다
- 실제 서버 테스트 disabled

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`, `src/shared/api/auth.ts` interceptor
- `src/entities/file`의 `uploadFile`
- `src/features/create-notice/ui/NoticeForm.tsx`의 mutationFn 구성
  (첨부 순차 업로드 → fileKey 배열 → 본 생성 호출)
- `TaskForm`의 검증 순서·`ValidationDialog`·`submittingRef` 중복 제출 방지·
  실패 문구·`CreateTaskPage`의 이탈 방지와 성공 이동
- `AttachmentField`의 `onFileObjectsChange`

`team-query-tree` 연동이 선행 조건이다(`assigneeIds`의 유일한 출처).

## 변경 파일

- `src/entities/task/api/types.ts` (`TaskCreateRequest`/`TaskCreateResponse`)
- `src/entities/task/api/taskApi.ts` (`createTask` 추가)
- `src/entities/task/model/types.ts` (`CreateTaskInput.assigneeIds: number[]`)
- `src/entities/task/model/mock.ts` (`createMockTask`와 create 관련 제어점
  제거)
- `src/entities/task/index.ts` (export 정리)
- `src/features/create-task/ui/TaskForm.tsx` (생성 mutationFn 교체,
  `File[]` 수집)
- 신규 `tests/e2e/api/task-create.spec.ts`
- `tests/e2e/task-create.spec.ts` (route mock 기반 최소 수정)

## 타입과 API 함수

```ts
// api/types.ts
export interface TaskCreateRequest {
  title: string
  content: string
  assigneeIds: number[]
  finishDate: string
  priority: TaskPriorityValue
  files: string[]
}

export interface TaskCreateResponse {
  message: string
}

export interface TaskCreateErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
```

- `createTask(input: TaskCreateRequest): Promise<TaskCreateResponse>`
  - `api.post<unknown>('/tasks', input)`
  - `status === 201`이 아니면 명시적 Error
  - `message: string` runtime 검증 후 반환
  - Contract 밖 필드를 body에 넣지 않는다

## Query/Mutation과 캐시

`TaskForm`의 생성 경로 mutationFn:

```ts
const files: string[] = []
for (const file of attachmentFiles) {
  const { fileKey } = await uploadFile({ files: file })
  files.push(fileKey)
}

await createTask({
  title,
  content,
  assigneeIds,
  finishDate: dueDate,
  priority,
  files,
})
```

- 첨부가 없으면 `files: []`
- 성공: 기존 `invalidateQueries({ queryKey: ['tasks'] })` 후 `onCompleted()`
  → `/tasks` 이동 + `create-success` 토스트 state
- 실패: `submittingRef`를 풀고 입력값을 그대로 둔다. localStorage 저장으로
  fallback 하지 않는다.
- `['teams','tree']`는 무효화하지 않는다.

## UI 연결

- 검증 순서·문구·`ValidationDialog`·포커스 복귀: 변경 없음
- 제출 중 버튼 라벨 `생성 중`과 `disabled`: 변경 없음
  (mock 지연 제어점 대신 실제 요청 지연이 이 상태를 만든다)
- 실패 문구 `생성하지 못했습니다. 다시 시도해 주세요.`: 변경 없음
- 첨부 등록 토스트(`첨부파일 등록에 성공/실패했습니다`)는 파일 선택 시점의
  로컬 결과이므로 유지한다. 업로드 실패는 제출 실패 문구로 드러난다.
- 담당자 트리 조회 실패 시 제출 차단은 `team-query-tree` 계획이 담당한다.

## 기존 테스트 정리

- `tests/e2e/task-create.spec.ts`: `POST /api/tasks`(+ 필요 시 `POST /api/file`,
  `GET /api/team/tree`)를 route mock 한다. `toyvillage:tasks:mutation-log`·
  `mutation-delay` 전제 시나리오는 route 지연과 요청 횟수 검증으로 바꾼다.
- `mock.ts`의 `createMockTask`와 create용 mutation 제어점은 사용처가
  없어지면 제거한다.

## 검증 순서

1. `yarn harness:api:validate task-create`
2. `yarn harness:api:gate task-create`
3. `yarn harness:api:policy task-create <변경된 src 파일>`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api task-create`
8. `tests/e2e/task-create.spec.ts` 표적 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- 성공 status가 `201`이 아니면 재승인(Contract 동결값).
- `assigneeIds`·`finishDate`·`files`의 Required가 다르게 확정되면 재승인
  (Backend Question 1).
- `Content-Type`이 `application/json`이 아니면 재승인(Backend Question 2).
- 부분 업로드된 파일의 정리 API가 필요하면 별도 명세가 있어야 한다.
- Contract 밖 필드(`status`, `assigneeType` 등)를 보내지 않는다.
