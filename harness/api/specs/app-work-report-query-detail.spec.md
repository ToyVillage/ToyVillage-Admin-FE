---
feature: app-work-report-query-detail
api_id: APP_WORK_REPORT_QUERY_DETAIL
target_page: src/pages/task-reports/TaskReportDetailPage.tsx
notion_page: https://app.notion.com/p/5627a4d6147482dbbfa701b2fb8a8447
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

업무보고 상세 화면(`/task-reports/:id`)의 localStorage mock 단일 조회
(`getMockTaskReport`)를 `APP_WORK_REPORT_QUERY_DETAIL` API 연동으로 교체한다.
업무 상세의 보고 줄에서 보고 상세로 들어가는 이동도 되살린다.

# 대상 페이지 또는 컴포넌트

- `src/pages/task-reports/TaskReportDetailPage.tsx`
- `src/pages/tasks/TaskDetailPage.tsx` (보고 줄 `onSelect` 복구)
- `src/entities/task-report`

# 연동할 API

- API ID: `APP_WORK_REPORT_QUERY_DETAIL`
- Notion 데이터베이스 `API 명세서 토이빌리지`
  (`https://app.notion.com/p/3da7a4d6147480d28d51d71665c28b22`,
  `collection://e567a4d6-1474-82c4-8267-879439b48892`)에서 API ID exact
  match로 식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- `/task-reports/:id` 진입 시 route id를 `workReportId`로 단일 조회 API를
  한 번 호출한다.
- 서버가 반환한 값을 기존 상세 화면 요소에 표시한다.
  - `TaskReportMetaRow`: `priority`, `status`, `name`, `finishDate`
  - `TaskReportContentCard`: `title`(업무지시 제목), `content`
  - 첨부자료 카드: `files[].fileName`. `files`가 비면 기존 빈 첨부 표시를
    유지한다.
- 응답의 `taskId`, `note`, `files[].fileKey`, `rejectionReason`은 현재 화면에
  표시 위치가 없어 사용하지 않는다.
- 로딩 중에는 기존 `업무보고를 불러오는 중입니다.` 상태를 유지한다.
- 업무 상세(`/tasks/:id`)의 `업무 보고` 카드에서 `workReportId`가 있는 줄을
  누르면 `/task-reports/{workReportId}`로 이동한다. `workReportId`가 null인
  줄(미제출)은 계속 누를 수 없다. 이 이동은 “업무보고 API 연동까지 보류”로
  막아 둔 것(커밋 `979228c`)을 되돌리는 것이다.

# 기대 오류 동작

- 조회 오류를 mock 데이터나 빈 객체로 숨기지 않는다.
- 실패하면 기존 `업무보고를 찾을 수 없습니다.` 화면과 `목록으로 돌아가기`
  링크를 표시한다.
- 404와 그 외 오류(500, 응답 형식 위반)를 같은 화면으로 처리한다(현재
  화면에 구분 UI가 없다).
- 401은 공통 세션 처리(`app-auth-reissue`: 재발급 시도, 불가하면 `/login`
  이동)를 따른다.
- route id가 양의 정수가 아니면 요청하지 않고 같은 화면을 표시한다.

# 캐시 갱신 기대

- 기존 상세 query key `['task-reports', id]`를 유지한다.
- 승인·반려 성공 시 이 key를 다시 받지 않고 stale로만 표시하는 기존 동작을
  유지한다(`app-work-report-approve`, `app-work-report-reject` 범위).

# 페이지 이동 또는 사용자 알림

- `목록으로` 뒤로가기 링크와 하단 `반려하기`/`승인하기` 동작을 유지한다.
- 조회 실패 시 자동 이동하지 않고 오류 화면에 머문다.

# 상태 표시

`status` 허용값은 목록 API의 `status` 필터 값과 같은 세 값으로 받는다.

| 값         | 배지     |
| ---------- | -------- |
| `PENDING`  | 심사대기 |
| `APPROVED` | 완료     |
| `REJECTED` | 반려     |

허용값 밖의 `status`가 오면 오류 화면으로 처리한다.

# 비고 및 제약

- 상세 조회만 연동한다. 네 업무보고 spec은 같은 파일을 공유하므로 모두 승인된
  뒤 함께 구현한다.
- 보고 줄 이동 복구는 `task-query` 승인 시나리오 S15와 `task-detail`
  퍼블리싱 e2e의 기대값을 바꾸므로 두 승인 기록을 함께 갱신해야 한다.
- 이미 승인·반려된 보고에도 하단 버튼을 그대로 둔다(퍼블리싱 범위). 서버가
  409를 주면 기존 실패 토스트가 뜬다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확인이 필요한 명세 항목

1. 응답 `status`의 허용값이 없다(ENUM 표에는 중요도만 있다). 목록 API
   `status` 필터의 `PENDING`/`APPROVED`/`REJECTED`를 적용했다.
2. `note`가 null일 수 있는지, `files`가 빈 배열인지 null인지 표기가 없다.
   화면이 쓰지 않는 `note`는 형식 검증에서 제외한다.
3. `rejectionReason`은 예시가 null이라 nullable로 받는다. 반려된 보고에서만
   값이 있는지 확인이 필요하다.
