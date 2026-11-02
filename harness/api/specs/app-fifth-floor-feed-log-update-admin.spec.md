---
feature: app-fifth-floor-feed-log-update-admin
api_id: APP_FIFTH_FLOOR_FEED_LOG_UPDATE_ADMIN
target_page: src/pages/feeds/EditFeedPage.tsx
notion_page:
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

5층 급여 기록 수정(`/feeds/fifth-floor/:id/edit`)의 퍼블리싱 mock 저장(`updateFifthFloorFeed`)을
관리자 5층 급여일지 수정(PUT `/feed-log/fifth-floor/admin/{feedLogId}`) 연동으로 바꾼다.

# 대상 페이지 또는 컴포넌트

- `src/entities/feed/api/fifthFloorFeedApi.ts` (`updateFifthFloorFeed` mock → 실제 요청)
- `src/entities/feed/api/feedFloorApi.ts` (`updateFloorFeed` 5층 본문 — 이미 Swagger 모양)
- `src/features/feed-form/ui/FeedForm.tsx`, `src/pages/feeds/EditFeedPage.tsx` (변경 없음)

# 연동할 API

- API ID: `APP_FIFTH_FLOOR_FEED_LOG_UPDATE_ADMIN`
- Notion 검색(`5층`·`FIFTH`) 0건 — 제안 ID. 개발자가 준 staging Swagger `fifth-floor-feed-log-controller`만 기준으로 삼는다(개발자 지시 2026-10-28 "무조건 스웨거대로").

# 기대 성공 동작

- `저장하기` → 검증 통과 시 PUT 한 번. 본문 `{ feedDate, feedType, feedAmount, feedUnit }`(Swagger 필수 4개).
  - `feedDate`: 상세 응답 `feedDate` 원본 그대로(화면에서 바꿀 수 없음)
  - `feedType`: 입력값 trim, `feedAmount`: 입력 숫자
  - `feedUnit`: 상세 응답 `feedUnit` 원본 그대로(화면에서 바꿀 수 없음)
- 200 `{ message }` → 목록·이력·그 기록 상세를 무효화하고, 들어온 화면(목록·기록 상세·이력)으로 돌아가 `데이터 수정에 성공했습니다` 토스트(퍼블리싱 동작 그대로).

# 기대 오류 동작

- 404·405·500·네트워크·형식 오류(200인데 `message` 없음) → 폼 유지, 입력 보존, `저장하지 못했습니다. 다시 시도해 주세요.`
- 401·403은 공통 인터셉터를 따른다.

# 캐시 갱신 기대

- 성공 시 `['feeds','list']`, `['feeds','history']`, `feedQueryKeys.detail('5', id)`만 무효화한다.

# 페이지 이동 또는 사용자 알림

- 퍼블리싱 동작 그대로.

# 비고 및 제약

- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. Notion 명세 DB에 이 API를 추가해 달라.
2. 접근 역할이 Swagger에 없다. ADMIN으로 둔다.
3. 400(검증 실패) 응답이 Swagger에 없다.
