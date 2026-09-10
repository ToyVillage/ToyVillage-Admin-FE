---
feature: task-query
api_id: TASK_QUERY
target_page: src/pages/tasks/TaskDetailPage.tsx
notion_page: https://app.notion.com/p/00c7a4d61474825abd4e01c642364bd0
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

업무 상세(`/tasks/:id`)와 업무 수정(`/tasks/:id/edit`)이 공유하는 localStorage
mock 단일 조회(`getMockTask`)를 `TASK_QUERY` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/tasks/TaskDetailPage.tsx`
- `src/pages/tasks/EditTaskPage.tsx`
- `src/entities/task`

# 연동할 API

- API ID: `TASK_QUERY`
- Notion 데이터베이스 `API 명세서 토이빌리지`
  (`collection://65d7a4d6-1474-82e1-8615-07f152254595`)에서 API ID exact match로
  식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- `/tasks/:id` 진입 시 해당 업무 ID로 단일 조회 API를 한 번 호출한다.
- `/tasks/:id/edit` 진입 시 같은 query key `['tasks', id]`를 재사용해 폼
  초기값을 채운다. 담당자 체크 복원은 `assignees[].id`로 한다.
- 서버가 반환한 값을 기존 상세 화면 요소에 표시한다.
  - `TaskInfoRow`: `assignees[0].name`(대표), `assigneeCount`(담당자 총원),
    `status`, `priority`, `finishDate`. `외 N명`의 N은 `assigneeCount - 1`이며
    0이면 렌더하지 않는다.
  - 본문 카드: `title`, `content`
  - 첨부자료: `files[].fileName` (`files`가 비면 `AttachmentList`를 렌더하지
    않는다)
- 로딩 중에는 기존 `업무를 불러오는 중입니다.` 상태를 유지한다.

# 기대 오류 동작

- 조회 오류를 mock 데이터나 빈 객체로 숨기지 않는다.
- 실패하면 기존 `업무를 찾을 수 없습니다.` 화면과 `목록으로 돌아가기` 링크를
  표시한다.
- 404와 그 외 오류를 같은 화면으로 처리한다(현재 화면에 구분 UI가 없다).

# 캐시 갱신 기대

- 기존 상세 query key `['tasks', id]`를 유지한다.
- 목록 prefix `['tasks']` 무효화가 이 상세에도 prefix로 매칭되어야 한다.
- 삭제 성공 시 기존 `removeQueries({ queryKey: ['tasks', id] })` 동작을
  유지한다.

# 페이지 이동 또는 사용자 알림

- 기존 케밥 메뉴의 `수정`(→ `/tasks/:id/edit`)과 `삭제` 동작을 유지한다.
- 조회 실패 시 자동 이동하지 않고 오류 화면에 머문다.

# 상태 모델 변경

`status`는 서버가 계산한 `IN_PROGRESS` / `COMPLETED` / `EXPIRED` 중 하나다.
개명과 `resolveTaskStatus` 제거는 `task-query-all.spec.md`의
`# 상태 모델 변경` 절을 따른다.

# 비고 및 제약

- `TASK_QUERY` 단일 조회만 연동한다. 목록·생성·수정 API는 각 API ID의 별도
  범위이며 해당 mock은 유지한다.
- 응답의 `reports`·`progress`는 상세 하단 `TaskReportSummaryCard`·
  `TaskProgressCard`가 쓰는 값과 대응하지만, 이번 범위에서는 연결하지 않고
  `@/entities/task-report` mock을 유지한다(아래 확인 항목 2 참고).
- 응답의 `createdAt`은 현재 화면에 표시 위치가 없어 사용하지 않는다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확정된 사항 (2026-09-09 백엔드 확인)

- `assignees`는 담당자 **전원**을 반환한다. 수정 화면의 담당자 체크 복원은
  이 배열을 그대로 쓴다. 명세 예시가 `assignees` 3명 · `assigneeCount` 4로
  어긋나 있는 것은 문서 오류이므로 예시만 정정하면 된다.

# 확인이 필요한 명세 항목

1. `reports[].status`의 Allowed Values가 없다. 예시에 `APPROVED`,
   `REJECTED`, `MISSING`이 보이고 `progress`에는 `pending`과 `missing`이
   있는데, 화면의 심사 상태는 `PENDING`/`APPROVED`/`REJECTED`/`RESUBMITTED`다.
   `MISSING`(미제출)과 `RESUBMITTED`(재제출)의 대응을 확정해야 한다.
2. `assignees[].position`이 `null`일 수 있는지 확인이 필요하다
   (`TEAM_QUERY_TREE`는 `null`을 허용한다).
3. 각 필드의 Required·Nullable 표기가 없다. 특히 `files`, `reports`가 빈
   배열인지 null인지.
