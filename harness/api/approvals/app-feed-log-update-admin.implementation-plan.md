# Implementation Plan — app-feed-log-update-admin

## 승인 기준

- `PUT /feed-log/admin/{feedLogId}`, Bearer, role `ADMIN`(Swagger 미기재 — 같은 컨트롤러 기준)
- body `FeedLogRequest` 4개 필수: `feedDateTime`(date-time), `feedType`(minLength 1), `feedAmount`(float), `significant`(string)
- 성공 200 `{ message }`, 오류 403/404/405/500
- 실제 서버 테스트 disabled

## 변경 파일

- `src/entities/feed/api/types.ts` — `FeedLogUpdateRequest`, `FeedLogMessageResponse`
- `src/entities/feed/api/feedMutations.ts` — `updateFeed` 를 `api.put<unknown>('/feed-log/admin/{feedLogId}', body)` 로 교체, `message` 응답 검사.
  `FeedUpdateInput` 에 `feedDateTime` 추가. `deleteFeed` mock 은 그대로(주석으로 API 없음 명시).
- `src/entities/feed/model/types.ts`·`api/feedApi.ts` — `FeedRecordDetail.feedDateTime`(상세 응답 원본) 추가
- `src/features/feed-form/ui/FeedForm.tsx` — 요청에 `feedDateTime: feed.feedDateTime` 추가
- `tests/e2e/support/feed-api.ts` — 상세 패턴에 PUT 분기(요청 본문 기록, 200 `{ message }`, 옵션으로 상태 지정)
- 신규 `tests/e2e/api/app-feed-log-update-admin.spec.ts`

## 저장 흐름

1. 폼 검증(기존) 통과
2. `updateFeed({ feedLogId, feedDateTime, feedType, feedAmount, significant })`
3. `api.put<unknown>` → 200 이고 `message` 가 string 이면 성공, 아니면 형식 오류로 실패 처리
4. 성공: `['feeds','list']`·`feedQueryKeys.detail(id)` 무효화 → 목록 이동 + `데이터 수정에 성공했습니다`
5. 실패: 폼 유지, 입력 보존, `저장하지 못했습니다. 다시 시도해 주세요.`

## 검증 순서

1. `yarn harness:api:gate app-feed-log-update-admin`
2. `yarn harness:api:policy app-feed-log-update-admin <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api app-feed-log-update-admin`
5. 회귀: `yarn verify:e2e feed-edit`, `feed-list`, `feed-detail`, API 조회 테스트

## 승인 시 확정 필요

1. Notion 에 행이 없어 Swagger 기준으로 연동한다(API ID `APP_FEED_LOG_UPDATE_ADMIN`).
2. `feedDateTime` 은 상세 응답 원본을 그대로 보낸다.
3. 삭제는 API 가 없어 이 작업에서 연동하지 않는다 — 목록 `삭제` 메뉴 처리 방식은 개발자 결정.

## 승인 결과 (2026-09-28 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다(Swagger 기준 연동, `feedDateTime` 원본 전송).
- 삭제: 목록 케밥 `삭제` 는 Figma 대로 두고 mock 을 유지한다. 백엔드가 삭제 API 를 만들면 별도 작업으로 연동한다.

## 재승인 (2026-09-28)

- 구현 중 시나리오 S5 의 403 기대값이 spec(403 = 공통 인터셉터 규칙)과 충돌해 S5 에서 403 을 빼고,
  S8 의 재조회 시점을 '저장 이후 언제든'으로 명확히 했다. 개발자 위임 승인 범위 안에서 공식 스크립트로 재승인한다.
