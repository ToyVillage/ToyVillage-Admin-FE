# Implementation Plan — app-feed-log-delete-admin

## 승인 기준

- `DELETE /feed-log/admin/{feedLogId}`, Bearer, role `ADMIN`(Swagger 미기재 — 같은 컨트롤러 기준), 본문 없음
- 성공 200 본문 없음, 오류 403/404/405/500
- 실제 서버 테스트 disabled

## 변경 파일

- `src/entities/feed/api/feedMutations.ts` — `deleteFeed` 를 `api.delete('/feed-log/admin/{feedLogId}')` 로 교체(응답 본문 읽지 않음). mock 주석 제거.
- `tests/e2e/support/feed-api.ts` — DELETE 분기: 요청 기록(`deletes`), 성공 시 해당 급여 기록을 목록 데이터에서 제거, `deleteStatus`/`deleteDelayMs` 옵션
- 신규 `tests/e2e/api/app-feed-log-delete-admin.spec.ts`
- 화면(`FeedListPage`)은 바꾸지 않는다(퍼블리싱 흐름 그대로).

## 검증 순서

1. `yarn harness:api:gate app-feed-log-delete-admin`
2. `yarn harness:api:policy app-feed-log-delete-admin src/entities/feed/api/feedMutations.ts`
3. `yarn verify`
4. `yarn verify:api app-feed-log-delete-admin`
5. 회귀: `yarn verify:e2e feed-edit`, `yarn verify:api app-feed-log-update-admin`, 먹이 급여 목록·상세·조회 API 테스트

## 승인 시 확정 필요

1. Notion 에 행이 없어 Swagger 기준으로 연동한다(API ID `APP_FEED_LOG_DELETE_ADMIN`).
2. 성공 응답 본문은 읽지 않는다.

## 승인 결과 (2026-09-28 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다(Swagger 기준 연동, 성공 응답 본문 읽지 않음).
