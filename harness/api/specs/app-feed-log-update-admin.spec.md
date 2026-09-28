---
feature: app-feed-log-update-admin
api_id: APP_FEED_LOG_UPDATE_ADMIN
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

먹이 급여 기록 수정 화면(`/feeds/:id/edit`)의 mock 저장(`updateFeed`)을
관리자 급여일지 수정 API(PUT `/feed-log/admin/{feedLogId}`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/entities/feed/api/feedMutations.ts` (`updateFeed` mock → 실제 요청)
- `src/entities/feed/api/feedApi.ts`, `src/entities/feed/model/types.ts` (상세 응답의 원본 `feedDateTime` 보존)
- `src/features/feed-form/ui/FeedForm.tsx` (요청 본문 구성)
- `src/pages/feeds/EditFeedPage.tsx`

# 연동할 API

- API ID: `APP_FEED_LOG_UPDATE_ADMIN`
- Notion 최신 명세 DB(`b53e8d82-a450-8355-b0f9-8702915ee325`, 카테고리 `먹이급여일지`)에 관리자 수정 행이 없다.
  같은 카테고리의 수정 행은 `APP_FEED_LOG_UPDATE`(PUT `/feed-log/{feedLogId}`, USER — 직원 본인 기록) 1건뿐이다.
- 개발자 지시(2026-09-28, "Swagger feed-log-controller 보고 반영")로 staging Swagger
  `/v3/api-docs/app` 의 `PUT /feed-log/admin/{feedLogId}`(operationId `updateAdminFeedLog`)를 기준으로 한다
  (`APP_AUTH_LOGOUT` 선례).

# 기대 성공 동작

- `저장하기` → 검증 통과 시 PUT `/feed-log/admin/{feedLogId}` 를 한 번 보낸다.
- 본문은 Swagger `FeedLogRequest` 의 필수 4개를 모두 보낸다.
  - `feedDateTime`: 상세 조회 응답의 `feedDateTime` 원본 문자열 그대로(화면에서 바꿀 수 없는 값)
  - `feedType`: 입력값 trim
  - `feedAmount`: 입력값을 kg 숫자로 읽은 값(`1.2kg` → 1.2)
  - `significant`: 입력값 trim(비우면 빈 문자열)
- 200 `{ message }` 성공 시 기존 동작 유지: 목록(`['feeds','list']`)과 그 기록 상세를 무효화하고,
  진입 전 조건의 목록으로 이동해 `데이터 수정에 성공했습니다` 토스트를 띄운다.

# 기대 오류 동작

- 403·404(`FEED_LOG_NOT_FOUND`/`APP_ADMIN_NOT_FOUND`)·405·500·네트워크·응답 형식 오류 시
  폼에 머무르고 입력을 보존하며 기존 저장 실패 표시(`저장하지 못했습니다. 다시 시도해 주세요.`)를 쓴다.
- 만료 토큰 403 은 기존 공통 인터셉터(재발급 후 재시도) 규칙을 따른다.

# 캐시 갱신 기대

- 성공 시 `['feeds','list']` 범위와 `feedQueryKeys.detail(id)` 만 무효화한다(넓은 `['feeds']` 무효화 금지).

# 페이지 이동 또는 사용자 알림

- 성공: 목록으로 이동 + 수정 성공 토스트(퍼블리싱 `feed-edit` 동작 그대로). 이탈 가드 해제 후 이동.

# 비고 및 제약

- 급여 기록 삭제는 feed-log-controller(Swagger)와 Notion 모두에 엔드포인트가 없다. 이 작업 범위 밖이며 백엔드 질문으로 남긴다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. 관리자 수정 API 가 Notion 명세 DB 에 없다 — 행 추가 필요(API ID 제안: `APP_FEED_LOG_UPDATE_ADMIN`).
2. Swagger 에 권한(roles) 정보가 없다. `/admin` 경로와 같은 컨트롤러의 `APP_FEED_LOG_QUERY_ADMIN`(ADMIN)에 맞춰 ADMIN 으로 둔다.
3. `feedDateTime` 을 바꿀 수 없는 화면인데 필수다 — 원본을 그대로 보내면 되는지, 초 단위 정밀도가 유지되는지 확인 필요.
4. 400(검증 실패) 응답이 Swagger 에 정의돼 있지 않다(`feedType` minLength 1, 필수 누락 시 동작).
5. 급여 기록 삭제 API 가 필요하다(목록 케밥 `삭제`).
