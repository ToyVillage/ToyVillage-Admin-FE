---
feature: task-delete
api_id: TASK_DELETE
target_page: src/pages/tasks/TaskDetailPage.tsx
notion_page: https://app.notion.com/p/8777a4d6147483ab9f79812d73580d3f
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

업무 상세(수정) 화면의 localStorage mock 삭제를 `TASK_DELETE` API 연동으로
교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/tasks/TaskDetailPage.tsx`
- `src/features/create-task/ui/TaskForm.tsx`
- `src/entities/task`

# 연동할 API

- API ID: `TASK_DELETE`
- Notion API 명세서에서 API ID exact match로 식별한 단일 상세 페이지를
  기준으로 한다.

# 기대 성공 동작

- `/tasks/:id`에서 삭제 확인 후 해당 업무 ID로 `DELETE /tasks/{id}`를 한 번
  호출한다.
- 성공하면 `['tasks']` 조회 캐시를 무효화하고 삭제된 상세 캐시
  `['tasks', id]`를 제거한 뒤 `/tasks`로 이동해 기존
  `데이터 삭제에 성공했습니다` 토스트를 표시한다.
- 기존 삭제 확인 다이얼로그와 중복 제출 방지 동작을 유지한다.

# 기대 오류 동작

- 삭제 오류를 성공이나 localStorage mock 삭제로 숨기지 않는다.
- 실패하면 상세 화면에 머물고 기존 `데이터 삭제에 실패했습니다` 토스트를
  표시하며 다시 삭제할 수 있어야 한다.

# 캐시 갱신 기대

- 성공 시 기존 업무 목록 prefix `['tasks']`를 무효화한다.
- 삭제된 상세 query `['tasks', id]`를 제거한다.
- 실패 시 업무 캐시를 성공 상태로 변경하지 않는다.

# 페이지 이동 또는 사용자 알림

- 성공하면 `/tasks`로 이동하고 `delete-success` 토스트 state를 전달한다.
- 실패하면 상세 화면에 머물고 기존 실패 토스트를 표시한다.

# 비고 및 제약

- `TASK_DELETE` 삭제만 연동한다. 업무 목록·상세 조회, 생성, 수정은 각 API
  ID의 별도 범위이며 해당 mock은 유지한다.
- 목록·상세가 아직 mock이므로 삭제 성공 후 목록에서 해당 항목이 사라지는
  것은 이번 범위에서 보장하지 않는다(조회 API 연동 시 해소).
- 요청 필드와 응답 형식은 Contract에 명시된 값만 사용한다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
