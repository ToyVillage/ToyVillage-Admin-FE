---
feature: app-work-report-query-all
api_id: APP_WORK_REPORT_QUERY_ALL
target_page: src/pages/task-reports/TaskReportListPage.tsx
notion_page: https://app.notion.com/p/7fe7a4d614748333990f8111b19db064
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

업무보고 목록 화면(`/task-reports`)의 localStorage mock 전체 조회
(`getMockTaskReports`)를 `APP_WORK_REPORT_QUERY_ALL` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/task-reports/TaskReportListPage.tsx`
- `src/entities/task-report`

# 연동할 API

- API ID: `APP_WORK_REPORT_QUERY_ALL`
- Notion 데이터베이스 `API 명세서 토이빌리지`
  (`https://app.notion.com/p/3da7a4d6147480d28d51d71665c28b22`,
  `collection://e567a4d6-1474-82c4-8267-879439b48892`)에서 API ID exact
  match로 식별한 단일 상세 페이지를 기준으로 한다.
- 기존 업무지시 Contract가 가리키던 데이터베이스
  (`3d67a4d6…`, `collection://65d7a4d6…`)는 삭제된 사본이라 쓰지 않는다
  (2026-09-13 확인).

# 기대 성공 동작

- 목록 화면 진입 시 업무보고 전체 조회 API를 호출한다.
- 상단 탭은 활성 탭의 `status`를 항상 보낸다. `전체` 탭은 없다.

  | 탭       | `status`   | 탭 건수         |
  | -------- | ---------- | --------------- |
  | 심사대기 | `PENDING`  | `pendingCount`  |
  | 완료     | `APPROVED` | `approvedCount` |
  | 반려     | `REJECTED` | `rejectedCount` |

- 탭 라벨 `{상태명} {건수}`의 건수는 응답의 상태별 건수를 그대로 쓴다. 이
  건수는 `status` 필터와 무관하므로 클라이언트가 목록으로 다시 세지 않는다.
- 서버가 반환한 `reports[]`를 기존 `TaskReportTable`에 표시한다.
  - 담당자 `name`, 상태 `status`, 우선순위 `priority`, 완료기한 `finishDate`
  - 응답의 `taskId`, `title`은 목록 표에 표시 위치가 없어 사용하지 않는다.
- 페이지네이션은 서버 쿼리(`page`, `size`)를 사용한다.
  - `size=10` — 한 페이지 10행(명세 기본값)으로 바꾼다(2026-09-13 개발자
    결정). 퍼블리싱 spec(`harness/publishing/specs/task-report.spec.md`)의
    “한 페이지에 3건”(Figma 표 높이 3행 기준)을 대체한다.
  - `page`는 Notion 명세대로 1부터 보낸다(화면 1페이지 → `page=1`,
    2026-09-13 개발자 확인).
  - 페이지 수는 응답의 `totalPageSize`를 그대로 쓴다(0이면 1페이지).
- `sort`는 보내지 않는다(서버 기본값 `id,DESC`, 화면에 정렬 UI 없음).
- 탭을 바꾸면 기존 동작대로 1페이지로 되돌린다.
- 페이지·탭 전환 중에는 직전 결과를 유지해 표와 탭이 사라지지 않게 한다
  (업무관리 목록과 같은 방식).
- 승인·반려로 현재 페이지가 총 페이지 수를 넘으면 마지막 페이지로 당긴다.
- 빈 목록이면 기존 `등록된 업무보고가 없습니다.` 빈 상태를 표시한다.
- 최초 로딩 중에는 기존 `업무보고를 불러오는 중입니다.` 상태를 유지한다.

# 기대 오류 동작

- API 오류를 mock 데이터나 빈 배열로 숨기지 않는다.
- 기존 `업무보고를 불러오지 못했습니다. 다시 시도해 주세요.` 오류 화면을
  표시한다.
- 응답 형식이 Contract와 다르면(허용값 밖의 `status`·`priority` 포함) 같은
  오류 화면으로 처리한다.
- 401은 공통 세션 처리(`app-auth-reissue`: 재발급 시도, 불가하면 `/login`
  이동)를 따른다. 이 화면에서 따로 처리하지 않는다.

# 캐시 갱신 기대

- 목록 query key를 `['task-reports', 'list', { page, size, status }]`로
  바꾼다(업무관리 목록 `['tasks', 'list', …]`와 같은 패턴).
- 승인·반려 성공 시 `['task-reports', 'list']` prefix를 무효화한다
  (`app-work-report-approve`, `app-work-report-reject` 범위).

# 페이지 이동 또는 사용자 알림

- 행 클릭 시 `/task-reports/{id}` 이동을 유지한다. id는 응답 `reports[].id`다.
- 케밥 메뉴(`승인하기`, `반려하기`)와 결과 토스트, 상세에서 넘겨받는 성공
  토스트 state 처리를 유지한다.

# 비고 및 제약

- 조회만 연동한다. 상세 조회·승인·반려는 각 API ID의 별도 spec이며, 네 spec은
  같은 파일을 공유하므로 모두 승인된 뒤 함께 구현한다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확인이 필요한 명세 항목

1. `page`가 1부터 시작한다고 적혀 있다. staging 업무지시 목록
   (`GET /tasks`)은 0부터였다. 명세대로 1부터 보내되 백엔드 확인을 요청한다.
2. 응답 `priority`의 허용값이 이 페이지에 없다. 같은 카테고리
   `APP_WORK_REPORT_QUERY_DETAIL`의 ENUM 표(`HIGH`/`MEDIUM`/`LOW`)를 적용했다.
3. 응답 필드의 Required·Nullable 표기가 없다. 200 예시 관측에 근거했다.
4. 예시의 `totalPageSize: 3`은 건수 합계 8·기본 `size` 10 기준으로 `1`이어야
   맞다(문서 예시만의 문제).
