---
feature: task-query-all
api_id: TASK_QUERY_ALL
target_page: src/pages/tasks/TaskListPage.tsx
notion_page: https://app.notion.com/p/0707a4d61474828eb8a1012a5c5ef73b
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

업무관리 목록 화면(`/tasks`)의 localStorage mock 전체 조회(`getMockTasks`)를
`TASK_QUERY_ALL` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/tasks/TaskListPage.tsx`
- `src/entities/task`

# 연동할 API

- API ID: `TASK_QUERY_ALL`
- Notion 데이터베이스 `API 명세서 토이빌리지`
  (`collection://65d7a4d6-1474-82e1-8615-07f152254595`)에서 API ID exact match로
  식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- 업무관리 화면 진입 시 업무지시 전체 조회 API를 호출한다.
- 서버가 반환한 `tasks[]`를 기존 `TaskTable`에 표시한다.
  - 담당자 셀: `assignees[0].name`(대표)과 `assigneeCount`(담당자 총원).
    `외 N명`의 N은 `assigneeCount - 1`이며 0이면 렌더하지 않는다
    (2026-09-08 개발자 결정 — `assigneeCount`는 총원이다).
    (2026-09-11 staging 확인 — 목록 응답의 담당자 필드는 Notion 명세의
    `assigneeName`이 아니라 상세 조회와 같은 `assignees` 배열이다.)
  - 제목 `title`, 상태 `status`, 우선순위 `priority`, 완료기한 `finishDate`
- 페이지네이션은 서버 쿼리(`page`, `size`)를 사용하고 현재 화면의 한 페이지
  10행을 유지한다. `size=10`, `page`는 0부터 시작한다.
- 페이지 수는 응답의 `totalPageSize`를 그대로 쓴다
  (2026-09-08 개발자 결정 — `totalPageSize`는 총 페이지 수다).
- 상단 탭은 `status` query parameter로 서버에 전달한다.
  `전체 업무`는 `status`를 보내지 않는다.

  | 탭        | `status`      |
  | --------- | ------------- |
  | 전체 업무 | (보내지 않음) |
  | 진행중    | `IN_PROGRESS` |
  | 완료      | `COMPLETED`   |
  | 지연      | `EXPIRED`     |

- 탭을 바꾸면 기존 동작대로 1페이지로 되돌린다.
- 빈 목록이면 기존 `등록된 업무가 없습니다.` 빈 상태를 표시한다.
- 로딩 중에는 기존 `업무를 불러오는 중입니다.` 상태를 유지한다.

# 기대 오류 동작

- API 오류를 mock 데이터나 빈 배열로 숨기지 않는다.
- 기존 `업무를 불러오지 못했습니다. 다시 시도해 주세요.` 오류 화면을
  표시한다.

# 캐시 갱신 기대

- 기존 `['tasks']` query key prefix를 유지하고, 페이지·상태 탭 등 서버
  파라미터를 같은 prefix 아래 배열 key로 잇는다.
- 후속 생성·수정·삭제 연동이 이 prefix를 무효화할 수 있어야 한다.

# 페이지 이동 또는 사용자 알림

- 기존 행 클릭 시 `/tasks/:id` 이동 동작을 유지한다.
- 기존 케밥 메뉴(`수정` → `/tasks/:id/edit`, `삭제`)와 삭제 결과 토스트 표시
  동작을 유지한다.
- 생성 성공 후 전달받는 `create-success` 토스트 state 처리도 유지한다.

# 상태 모델 변경

서버가 세 상태를 모두 계산해 내려준다(2026-09-09 개발자 확인).

| 값            | 화면 탭 | 서버 판정 조건              |
| ------------- | ------- | --------------------------- |
| `IN_PROGRESS` | 진행중  | 미완료 + finishDate >= 오늘 |
| `COMPLETED`   | 완료    | 담당자 전원이 APPROVED      |
| `EXPIRED`     | 지연    | 미완료 + finishDate < 오늘  |

따라서 다음을 함께 정리한다.

- `src/entities/task/model/types.ts`의 `DONE` → `COMPLETED`,
  `OVERDUE` → `EXPIRED`로 개명한다.
- 저장값과 화면값을 나누던 `TaskProgressStatus`/`TaskStatus` 구분을 없애고
  서버 `status` 하나를 쓴다.
- `resolveTaskStatus`(완료기한으로 `OVERDUE` 파생)와 `taskToday`를 제거한다.
  `완료` 조건이 `담당자 전원 APPROVED`라 클라이언트가 계산할 수 없다.
- `taskStatusLabels`의 키를 새 값에 맞춘다.

# 비고 및 제약

- `TASK_QUERY_ALL` 조회만 연동한다. 상세 조회·생성·수정·삭제는 각 API ID의
  별도 범위이며 해당 mock은 유지한다.
- `sort`는 기본값 `id,DESC`를 그대로 쓰고 요청에 포함하지 않는다. 화면에
  정렬 UI가 없다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확인이 필요한 명세 항목

1. `status` query parameter의 값 목록이 `IN PROGRESS`로 적혀 있다(언더바
   누락). 같은 페이지 응답 예시는 `IN_PROGRESS`다. Contract는 `IN_PROGRESS`를
   기준으로 하되 Notion 오타 수정이 필요하다.
2. 성공 응답 예시에서 1·2번 항목의 `id`가 둘 다 `12`다(복사 흔적).
3. 403 응답이 명세에 없다. 다른 업무지시 API는 403을 정의하는데 이 API는
   400/401/500만 있다.
4. `status` 파라미터 설명에 이미지가 첨부돼 있다. 상태 판정 조건표로 보이며
   위 표와 같은 내용인지 확인이 필요하다.
