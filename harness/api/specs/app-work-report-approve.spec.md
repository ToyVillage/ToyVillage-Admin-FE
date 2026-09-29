---
feature: app-work-report-approve
api_id: APP_WORK_REPORT_APPROVE
target_page: src/features/review-task-report/model/useReviewTaskReport.ts
notion_page: https://app.notion.com/p/75b7a4d61474825c951e018e869562fd
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

업무보고 목록 케밥과 상세 하단의 `승인하기`가 쓰는 localStorage mock 심사
(`reviewMockTaskReport` 승인 분기)를 `APP_WORK_REPORT_APPROVE` API 연동으로
교체한다.

# 대상 페이지 또는 컴포넌트

- `src/features/review-task-report/model/useReviewTaskReport.ts`
- `src/pages/task-reports/TaskReportListPage.tsx` (케밥 `승인하기`)
- `src/features/review-task-report/ui/TaskReportReviewActions.tsx`
  (상세 `승인하기`)
- `src/entities/task-report`

# 연동할 API

- API ID: `APP_WORK_REPORT_APPROVE`
- Notion 데이터베이스 `API 명세서 토이빌리지`
  (`https://app.notion.com/p/3da7a4d6147480d28d51d71665c28b22`,
  `collection://e567a4d6-1474-82c4-8267-879439b48892`)에서 API ID exact
  match로 식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- `승인하기`를 누르면 `PATCH /work-report/approve/{workReportId}`를 한 번
  보낸다. body와 query는 없다.
- HTTP 200 `{ message }`이면 성공으로 처리한다.
  - 목록 케밥: 목록에 머물며 `승인에 성공했습니다` 토스트를 띄우고 케밥
    버튼으로 초점을 되돌린다.
  - 상세: `/task-reports`로 이동하고 목록에서 `승인에 성공했습니다` 토스트를
    띄운다.
- 처리 중에는 버튼·다른 행 케밥을 막고 두 번째 요청을 보내지 않는 기존 동작을
  유지한다.

# 기대 오류 동작

- 404/409/500과 응답 형식 위반(200이 아닌 성공 status, `message` 없음)을
  실패로 처리한다.
  - 목록 케밥: `승인에 실패했습니다` 토스트, 목록 유지
  - 상세: `승인에 실패했습니다` 토스트, 상세 유지
- 401은 공통 세션 처리(`app-auth-reissue`: 재발급 시도, 불가하면 `/login`
  이동)를 따른다.
- 실패를 localStorage mock 성공으로 대체하지 않는다.
- route id 또는 행 id가 양의 정수가 아니면 요청하지 않고 실패로 처리한다.

# 캐시 갱신 기대

- 성공 시
  - `['task-reports', 'list']` prefix를 무효화하고 화면에 없어도 다시 받는다
    (탭 건수와 행이 즉시 바뀐다).
  - 처리한 보고의 상세 `['task-reports', id]`는 다시 받지 않고 stale로만
    표시한다(기존 동작).
  - `['tasks']` prefix를 무효화한다. Notion 개요에 “모든 담당자의 업무보고가
    승인되면 업무지시 상태가 `COMPLETED`로 바뀐다”고 되어 있어 업무관리
    목록·상세의 상태·보고 현황이 바뀔 수 있다.
- 실패 시 캐시를 건드리지 않는다.

# 페이지 이동 또는 사용자 알림

- 결과 토스트 문구와 위치는 기존 퍼블리싱 결과(`taskReportReviewToasts`)를
  그대로 쓴다. 서버 `message`는 화면에 표시하지 않는다.

# 비고 및 제약

- 승인만 연동한다. 네 업무보고 spec은 같은 파일을 공유하므로 모두 승인된 뒤
  함께 구현한다.
- mock의 테스트 제어점(`mutation-delay`, `mutation-log`, `fail`
  localStorage 키)은 실제 API 교체와 함께 제거하고, 기존 퍼블리싱 e2e
  (`tests/e2e/task-report.spec.ts`)는 `page.route()` mock으로 옮긴다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확인이 필요한 명세 항목

1. 반려된 보고를 승인할 수 있는지(409인지) 명세에 없다. 화면 동작에는 영향이
   없다(실패면 실패 토스트).
2. ADMIN 전용인데 403 응답이 정의되어 있지 않다.
