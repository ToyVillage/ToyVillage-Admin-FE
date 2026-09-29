---
feature: task-update
api_id: TASK_UPDATE
target_page: src/pages/tasks/EditTaskPage.tsx
notion_page: https://app.notion.com/p/9da7a4d614748340a6d3013d68e37ff2
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

업무 수정 화면(`/tasks/:id/edit`)의 localStorage mock 저장(`updateMockTask`)을
`TASK_UPDATE` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/tasks/EditTaskPage.tsx`
- `src/features/create-task/ui/TaskForm.tsx` (`mode="edit"`)
- `src/entities/task`

# 연동할 API

- API ID: `TASK_UPDATE`
- Notion 데이터베이스 `API 명세서 토이빌리지`
  (`collection://65d7a4d6-1474-82e1-8615-07f152254595`)에서 API ID exact match로
  식별한 단일 상세 페이지를 기준으로 한다.

# 담당자 선택 데이터 출처

담당자 트리는 `TEAM_QUERY_TREE`(`GET /team/tree`, `team-query-tree.spec.md`)가
제공한다. 이 spec의 `assigneeIds`에 넣는 값은 그 응답의 `members[].id`다.
기존 담당자 복원은 `TASK_QUERY` 응답의 `assignees[].id`로 한다.
`TEAM_QUERY_TREE`와 `TASK_QUERY` 연동이 선행되어야 한다.

# 기대 성공 동작

- 유효한 입력으로 해당 업무 ID에 대해 `PUT /tasks/{id}`를 한 번 호출한다.
- 요청 body는 Contract에 명시된 `title`, `content`, `assigneeIds`,
  `finishDate`, `priority`, `files`만 보낸다.
- 담당자 트리에서 선택한 직원들을 `assigneeIds`(LIST\<LONG\>)로 보낸다.
  최소 한 명은 포함된다(기존 클라이언트 검증이 이를 보장한다).
- 첨부파일은 승인된 `FILE_CREATE`로 파일별 업로드하고 반환된 fileKey 배열을
  `files`로 전달한다.
- 성공하면 `['tasks']` 조회 캐시를 무효화하고 상세 캐시 `['tasks', id]`를
  갱신한 뒤 `/tasks/:id`로 이동한다.
- 기존 클라이언트 입력 검증 순서(우선순위 → 완료기한 → 제목 → 상세 업무 내용
  → 담당자), 중복 제출 방지, 작성 중 이탈 방지 동작을 유지한다.

# 기대 오류 동작

- 수정 오류를 성공이나 localStorage mock 저장으로 숨기지 않는다.
- 실패하면 수정 화면에 머물고 사용자가 입력한 값을 보존해 다시 제출할 수
  있어야 한다.
- 기존 폼의 저장 실패 상태 표시를 유지한다.

# 캐시 갱신 기대

- 성공 시 기존 업무 목록 prefix `['tasks']`를 무효화한다.
- 해당 상세 query `['tasks', id]`가 이전 값을 계속 표시하지 않도록 갱신한다.
- 실패 시 업무 캐시를 성공 상태로 변경하지 않는다.

# 페이지 이동 또는 사용자 알림

- 성공하면 `/tasks/:id`로 이동한다. 별도 성공 토스트는 띄우지 않는다(현재
  `handleCompleted` 동작 유지 — 결과는 상세 화면에서 확인한다).
- 실패하면 수정 화면에 머문다.

# 비고 및 제약

- `TASK_UPDATE` 수정만 연동한다. 업무 목록·상세 조회, 생성, 삭제는 각 API
  ID의 별도 범위이며 해당 mock은 유지한다.
- 상세 조회가 아직 mock이면 수정 성공 후 상세 화면에 최신 값이 보이는 것은
  이번 범위에서 보장하지 않는다(`task-query` 연동 시 해소).
- 명세의 `files`는 3분기다. 빈 배열은 첨부 초기화, 값이 있으면 그 목록으로
  대체, `null`이면 기존 유지다. 현재 폼은 첨부 목록 전체를 항상 다시 제출하는
  구조이므로 `null`을 보내지 않는다.
- 상태 변경 필드는 요청에 없다. `status`(`IN_PROGRESS`/`COMPLETED`/`EXPIRED`)는
  서버가 계산하므로 이번 범위에서 상태를 보내지 않는다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확인이 필요한 명세 항목

1. `assigneeIds`, `finishDate`, `files`의 Required·Nullable 표기가 없다.
   `assigneeIds`는 `하나는 무조건 포함되어야함` 설명만 있다.
2. 페이지 하단 `ENUM` 절에 `assigneeType`(ALL/EMPLOYEE/TEAM) 표가 남아 있다.
   요청 필드가 `assigneeIds`로 바뀌면서 쓰이지 않는 값이므로 삭제 여부 확인이
   필요하다.
3. `Content-Type`이 Body Example의 코드블록에만 있다. `application/json`으로
   확정할 수 있는지 확인이 필요하다.
