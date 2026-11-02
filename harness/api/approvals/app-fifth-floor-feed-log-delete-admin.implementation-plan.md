# Implementation Plan — app-fifth-floor-feed-log-delete-admin

5층 네 연동과 5층 목록 `/feeds` 사용은 같은 파일을 쓰므로 모두 승인된 뒤 함께 구현한다.

## 승인 기준

- `DELETE /feed-log/fifth-floor/admin/{feedLogId}`, Bearer, ADMIN. 200 본문 없음. Swagger와 차이 없음.
- 실제 서버 테스트 disabled.

## 변경 파일

- `src/entities/feed/api/types.ts` — 5층 목록 응답(`FifthFloorFeedLogListResponse`), 이력 응답(`FifthFloorFeedLogHistoryResponse`) 타입 추가.
- `src/entities/feed/api/fifthFloorFeedApi.ts` — mock 전체를 `api` 요청으로 교체. 타입 가드로 형식 검사, 형식 오류는 throw.
  - 목록 `GET /feed-log/fifth-floor/admin?date&page&size`(1-based) → `FeedListPage`.
  - 상세 `GET /feed-log/fifth-floor/admin/{id}` → `FeedRecordDetail`(`animalManageId = animalId`, `fedAtValue = feedDate`).
  - 이력 `GET /feed-log/fifth-floor/admin/history/{animalManageId}` → `feedDate` 내림차순(안정 정렬). 404 → 빈 배열.
  - 수정 `PUT …/{id}` 본문 `{ feedDate, feedType, feedAmount, feedUnit }`. 응답 `message` 없으면 throw.
  - 삭제 `DELETE …/{id}`. 본문은 읽지 않는다.
- `src/entities/feed/api/feedFloorApi.ts` — 변경 없음(이미 층별로 위 함수를 부른다).
- `tests/e2e/support/feed-api.ts` — `mockFeedApi`에 5층 가짜 서버 추가(기본 데이터 = 지금 앱 mock과 같은 값, 상태·지연 지정, 요청 기록).
- 퍼블리싱 테스트(`feed-list`·`feed-record-detail`·`feed-detail`·`feed-edit`) — 5층만 쓰는 테스트에 `mockFeedApi(page)` 호출 추가(기대값 그대로) → 퍼블리싱 `--freeze` 재동결.
- 신규 `tests/e2e/api/app-fifth-floor-feed-log-delete-admin.spec.ts`.

## 오류 처리

- 404·405·500·네트워크 → `데이터 삭제에 실패했습니다` 토스트, 화면 유지.
- 401·403은 공통 인터셉터(재발급 → 실패 시 `/login`). 화면 고유 동작이 아니어서 시나리오에서 뺀다(`app-feed-log-update-admin` 선례).

## 검증 순서

1. `yarn harness:api:gate app-fifth-floor-feed-log-delete-admin`
2. `yarn harness:api:policy app-fifth-floor-feed-log-delete-admin <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api app-fifth-floor-feed-log-delete-admin`
5. 회귀: `yarn verify:e2e feed-list|feed-record-detail|feed-detail|feed-edit|individual-detail`, 4층 API 테스트

## 승인 시 확정 필요

1. Notion에 없는 API — Swagger만 기준, 제안 API ID, 역할 ADMIN, 응답 필드 필수.
