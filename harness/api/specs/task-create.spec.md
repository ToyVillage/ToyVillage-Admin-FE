---
feature: task-create
api_id: TASK_CREATE
target_page: src/pages/tasks/CreateTaskPage.tsx
notion_page: https://app.notion.com/p/5377a4d6147483f1991181833853b00c
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

업무지시 생성 화면의 localStorage mock 저장을 `TASK_CREATE` API 연동으로
교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/tasks/CreateTaskPage.tsx`
- `src/features/create-task/ui/TaskForm.tsx`
- `src/entities/task`

# 연동할 API

- API ID: `TASK_CREATE`
- Notion API 명세서에서 API ID exact match로 식별한 단일 상세 페이지를
  기준으로 한다.

# 기대 성공 동작

- 유효한 입력으로 `POST /tasks`를 한 번 호출한다.
- 첨부파일은 승인된 `FILE_CREATE`로 파일별 업로드하고 반환된 fileKey 배열을
  `files`로 전달한다. 첨부파일이 없으면 `files: []`를 전달한다.
- 성공하면 `['tasks']` 조회 캐시를 무효화하고 `/tasks`로 이동한다.
- 기존 클라이언트 입력 검증, 중복 제출 방지, 작성 중 이탈 방지 동작을
  유지한다.

# 기대 오류 동작

- 생성 오류를 성공이나 mock 저장으로 숨기지 않는다.
- 실패하면 생성 화면에 머물고 입력값을 보존해 다시 제출할 수 있어야 한다.
- 기존 `생성하지 못했습니다. 다시 시도해 주세요.` 상태를 표시한다.

# 캐시 갱신 기대

- 성공 시 기존 업무지시 목록 prefix `['tasks']`를 무효화한다.
- 실패 시 업무지시 캐시를 성공 상태로 변경하지 않는다.

# 페이지 이동 또는 사용자 알림

- 성공하면 `/tasks`로 이동한다.
- 실패하면 생성 화면에 머물고 기존 실패 문구를 표시한다.

# 비고 및 제약

- `TASK_CREATE` 생성만 연동한다. 업무지시 수정·삭제·조회 API는 이번 범위가
  아니며 해당 mock은 유지한다.
- 요청 필드와 Content-Type은 Contract에 명시된 값만 사용한다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
- Notion 명세의 Contract 필수값 누락과 예시 충돌이 해소되기 전에는 구현하지
  않는다.
