---
feature: dashboard-animal-observation-query-all
api_id: DASHBOARD_ANIMAL_OBSERVATION_QUERY_ALL
target_page: src/pages/dashboard/DashboardPage.tsx
notion_page: https://app.notion.com/p/9ea7a4d6147483dcb67a812c7f97b041
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

대시보드 `개체관리` 카드에 이번 주 관찰 및 특이사항 최신 3건(`GET /dashboard/animal-observations`)을 표시한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/dashboard/DashboardPage.tsx`
- `src/features/dashboard` (api·model)

# 연동할 API

- API ID: `DASHBOARD_ANIMAL_OBSERVATION_QUERY_ALL`
- Notion 데이터베이스 `API 명세서 토이빌리지`
  (`https://app.notion.com/p/3de7a4d6147480e18466e66547493b25`,
  `collection://9717a4d6-1474-822a-8703-074d4cfad636`, 2026-09-17 개발자가 새로 옮긴 DB)에서
  API ID exact match로 식별한 단일 상세 페이지를 기준으로 한다.
- staging Swagger(`dash-board-controller`)의 Method·Path·응답 필드와 일치함을 확인했다.

# 기대 성공 동작

- 진입 시 `GET /dashboard/animal-observations?page=1&size=3`을 1회 호출한다. `sort`는 보내지 않는다(기본 `createdAt,desc`).
- 행: `title` / `createdAt`을 기존 규칙(24시간 이내 `N시간 전`, 그 외 `YYYY.MM.DD`)으로 표시한다.
- `content`가 비면 `최근 관찰 기록이 없습니다.`
- 항목에 id가 없어 행 key는 순번으로 만든다.

# 대시보드 공통 동작 (4개 dashboard spec 공통)

- 대시보드 mock(localStorage `toyvillage:dashboard*`)을 제거하고 7개 조회를 각각 `useQuery`로 호출한다.
  - dashboard API 4개: `DASHBOARD_COUNT_QUERY`, `DASHBOARD_OVERALL_OPERATIONS_QUERY`, `DASHBOARD_FEED_LOG_QUERY_ALL`, `DASHBOARD_ANIMAL_OBSERVATION_QUERY_ALL`
  - 기존 승인 API 재사용 3개(개발자 결정, 2026-09-17):
    - 휴관일 관리 — `CLOSE_DAT_QUERY_ALL`(`getCloseSchedules`) 결과에서 이번 달만 표시(기존 로직)
    - 업무보고 — `APP_WORK_REPORT_QUERY_ALL`(`getTaskReports`) `page=1&size=3`, `status` 없이 조회. 제목은 응답 `reports[].title`
    - 업무일지관리 — `WORK_LOG_QUERY_ALL`(`getWorkLogs`) `date=오늘&page=0&size=3`
- 로딩·오류 표시는 퍼블리싱 동작을 유지한다. 7개 중 하나라도 최초 로딩 중이면 `대시보드를 불러오는 중입니다.`, 하나라도 실패하면 `대시보드를 불러오지 못했습니다.`
- 카드 이동 링크, 레이아웃, 빈 상태 문구는 바꾸지 않는다.

# 기대 오류 동작

- 400/403/405/500/네트워크 실패/응답 형식 오류는 mock이나 빈 값으로 숨기지 않고 대시보드 오류 상태를 표시한다.
- 401은 공통 인터셉터(재발급 1회 후 재시도)를 따른다.

# 캐시 갱신 기대

- query key: `['dashboard', '<section>']` (`dashboardQueryKeys`). 재사용 API도 대시보드 전용 key를 써서 각 목록 화면 캐시와 섞지 않는다.
- 다른 화면의 등록·수정·삭제에서 대시보드 invalidate는 하지 않는다(화면 진입 시 재조회).

# 페이지 이동 또는 사용자 알림

- 없음. 기존 카드 링크 유지. 디자인에 없는 토스트를 만들지 않는다.

# 비고 및 제약

- 네 dashboard spec은 같은 파일을 공유하므로 모두 승인된 뒤 함께 구현한다.
- 퍼블리싱 동결 테스트 `tests/e2e/dashboard.spec.ts`는 localStorage mock 기반이라 `page.route()` 가짜 서버 기반으로 전환한다(S1–S12 기대값 유지, 선례 `ede2088`).
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. 필드별 required·nullable 표기가 없다. 200 예시 근거로 required·non-null로 기록했다.
2. 데이터베이스 엔드포인트 값에 Query String(`?page=1&size=10`)이 붙어 있다. Path는 `/dashboard/animal-observations`로 분리했다.
3. 퍼블리싱은 관찰 본문을 보여줬지만 응답은 `title`만 있다. `title`을 표시한다.
