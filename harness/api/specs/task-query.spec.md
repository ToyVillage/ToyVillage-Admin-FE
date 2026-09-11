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
  - 업무 보고 카드(2026-09-11 추가): `reports[]`가 담당자별 현황이다. 한 줄에
    `name`과 심사 상태 배지를 그린다. `workReportId`가 있으면 누를 수 있고
    `/task-reports/{workReportId}`로 이동한다. `MISSING`(미제출)은 화면에서
    `심사대기`로 표시하며, `workReportId`가 `null`이라 열 보고가 없으므로
    누를 수 없는 줄로 그린다. `reports`가 비면 기존 빈 문구를 표시한다.
  - 진행도 카드(2026-09-11 추가): 숫자는 `progress`에서 온다. 클라이언트가
    `reports`로 다시 세지 않는다. 요약 문구는 기존
    `전체 N · 승인 N · 반려 N · 심사대기 N`이고 도넛 조각도 기존 세 가지다.
    `심사대기`는 `progress.pending + progress.missing`이다
    (미제출을 심사대기에 합산 — 2026-09-11 개발자 결정).
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
- 응답의 `reports`·`progress`를 상세 하단 `TaskReportSummaryCard`·
  `TaskProgressCard`에 연결한다(2026-09-11 범위 추가). 같은 응답에 들어 있어
  추가 요청이 없다. `@/entities/task-report`의 mock 조회
  (`getMockTaskReportsByTaskId`)는 상세 화면에서 더 쓰지 않는다. 업무보고
  목록·상세 화면은 여전히 mock이며 별도 API 범위다.
- 응답의 `createdAt`은 현재 화면에 표시 위치가 없어 사용하지 않는다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확정된 사항 (2026-09-09 백엔드 확인)

- `assignees`는 담당자 **전원**을 반환한다. 수정 화면의 담당자 체크 복원은
  이 배열을 그대로 쓴다. 명세 예시가 `assignees` 3명 · `assigneeCount` 4로
  어긋나 있는 것은 문서 오류이므로 예시만 정정하면 된다.

# 확인이 필요한 명세 항목

1. `reports[].status`의 Allowed Values가 없다 — **2026-09-11 결정으로 진행**.
   예시에 `APPROVED`, `REJECTED`, `MISSING`이 보이고 `progress`에는 `pending`이
   따로 있으므로, 제출 후 심사 전 상태를 `PENDING`으로 보고 네 값을 받는다.
   화면 대응은 `APPROVED`→`승인`, `REJECTED`→`반려`, `PENDING`→`심사대기`,
   `MISSING`→`심사대기`(열 보고가 없어 누를 수 없는 줄)이다. `RESUBMITTED`(재제출)는 서버 상태에
   없어 이 화면에서 나타나지 않는다. 확인 요청은 백엔드 질문 5번에 있다.
   허용값 밖의 status가 오면 오류 화면으로 처리한다.
2. `assignees[].position`이 `null`일 수 있는지 확인이 필요하다
   (`TEAM_QUERY_TREE`는 `null`을 허용한다).
3. 각 필드의 Required·Nullable 표기가 없다. 특히 `files`, `reports`가 빈
   배열인지 null인지.
