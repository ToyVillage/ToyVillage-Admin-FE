---
feature: app-fifth-floor-feed-log-query-history-admin
api_id: APP_FIFTH_FLOOR_FEED_LOG_QUERY_HISTORY_ADMIN
target_page: src/pages/feeds/FeedAnimalHistoryPage.tsx
notion_page:
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

5층 개체별 급여 이력(`/feeds/fifth-floor/animals/:animalId`)과 개체 상세 `먹이 급여 기록 확인하기`의 5층 이력 확인을
퍼블리싱 mock(`getFifthFloorFeedHistory`)에서 관리자 5층 개체별 급여 이력 조회(GET `/feed-log/fifth-floor/admin/history/{animalManageId}`) 연동으로 바꾼다.

# 대상 페이지 또는 컴포넌트

- `src/entities/feed/api/fifthFloorFeedApi.ts` (`getFifthFloorFeedHistory` mock → 실제 요청)
- `src/entities/feed/api/types.ts`
- `src/pages/feeds/FeedAnimalHistoryPage.tsx`, `src/pages/species/IndividualDetailPage.tsx` (변경 없음 — `getFloorFeedHistory('5', id)` 그대로)

# 연동할 API

- API ID: `APP_FIFTH_FLOOR_FEED_LOG_QUERY_HISTORY_ADMIN`
- Notion 검색(`5층`·`FIFTH`) 0건 — 제안 ID. 개발자가 준 staging Swagger `fifth-floor-feed-log-controller`만 기준으로 삼는다(개발자 지시 2026-10-28 "무조건 스웨거대로").

# 기대 성공 동작

- 화면 진입 시 GET `/feed-log/fifth-floor/admin/history/{animalManageId}`를 한 번 보낸다(개체 조회는 기존 그대로).
- 열 매핑: 급여일=`feedDate`(`YYYY.MM.DD`), 먹이 종류=`feedType`, 급여량=`feedAmount`+단위, 급여자=`staffName`.
- 행 순서: `feedDate` 내림차순(최신이 위). 같은 날은 응답 순서를 따른다(4층 이력과 같은 규칙).
- 행을 누르면 `/feeds/fifth-floor/{feedLogId}`로 간다.

# 기대 오류 동작

- 404 → 이력 없음으로 본다(빈 표 `급여 이력이 없습니다.`, `0건`) — 4층 이력(`getFeedHistory`)과 같은 규칙.
- 500·405·네트워크·형식 오류 → 오류 카드와 `다시 시도`.
- 개체 상세 `먹이 급여 기록 확인하기`: 4층 이력이 없을 때 5층을 조회한다. 5층도 없으면(404 포함) `급여 기록이 없습니다`, 실패하면 `급여 기록을 불러오지 못했습니다` 토스트.

# 캐시 갱신 기대

- query key `feedQueryKeys.history('5', animalManageId)`. 수정·삭제 뒤 무효화는 각 mutation 연동을 따른다.

# 페이지 이동 또는 사용자 알림

- 퍼블리싱 동작 그대로.

# 비고 및 제약

- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. Notion 명세 DB에 이 API를 추가해 달라.
2. 접근 역할·응답 필드 필수 여부가 Swagger에 없다. ADMIN·필수로 둔다.
3. 404의 뜻(개체 없음인지 이력 없음인지)이 Swagger에 없다. 4층과 같이 이력 없음으로 본다. 정렬 기준도 명시 요청.
