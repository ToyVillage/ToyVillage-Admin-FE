# API Contract — APP_FEED_LOG_UPDATE_ADMIN

## Source

- Notion 최신 명세 DB(`b53e8d82-a450-8355-b0f9-8702915ee325`) 검색 결과: 관리자 수정 0건
  (먹이급여일지 카테고리의 수정은 USER 용 `APP_FEED_LOG_UPDATE` 1건뿐)
- 개발자 지시로 staging Swagger `https://api-stag.toyvillage.kr/v3/api-docs/app` 의
  `PUT /feed-log/admin/{feedLogId}`(operationId `updateAdminFeedLog`)를 기준으로 삼는다.
- `source.notionDatabase`/`resolvedNotionPage` 에는 Swagger 문서 URL을 기록했다.
- Checked at: 2026-09-28
- Exact match count: 1 (Swagger paths 중 `PUT /feed-log/admin/{feedLogId}` 1건)

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| APP_FEED_LOG_UPDATE_ADMIN | 관리자 급여일지 수정 | 앱 관리자가 급여일지 한 건을 수정 | PUT | /feed-log/admin/{feedLogId} | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | ADMIN |

- Swagger 전역 security `bearerAuth`. 역할은 Swagger에 없어 같은 컨트롤러의 `APP_FEED_LOG_QUERY_ADMIN`(Notion: ADMIN)과 맞췄다.

## Path Parameters

| Name | Type | Required | Nullable | Example | Description |
| --- | --- | --- | --- | --- | --- |
| feedLogId | integer(int64) | true | false | 1 | 수정할 급여일지 id |

## Query Parameters

없음

## Request Body (`FeedLogRequest`, required)

| Name | Type | Required | Nullable | Example | Constraints |
| --- | --- | --- | --- | --- | --- |
| feedDateTime | string(date-time) | true | false | 2026-09-03T09:30:00 | — |
| feedType | string | true | false | 생닭 | minLength 1 |
| feedAmount | number(float) | true | false | 1.2 | kg |
| significant | string | true | false | 평소보다 식욕이 왕성함. | — |

```json
{ "feedDateTime": "2026-09-03T09:30:00", "feedType": "생닭", "feedAmount": 1.2, "significant": "평소보다 식욕이 왕성함." }
```

## Success Responses

- `200` — `{ "message": string }` (MessageResponse)

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(date-time), `description`(string)

| Status | Description |
| --- | --- |
| 403 | 인증 토큰이 없거나 유효하지 않음, 또는 접근 권한 없음 (body 스키마 없음) |
| 404 | FEED_LOG_NOT_FOUND `존재하지 않는 급여일지입니다.` / APP_ADMIN_NOT_FOUND `존재하지 않는 앱 관리자입니다.` |
| 405 | 지원하지 않는 메서드 형식입니다. |
| 500 | 내부 서버 오류가 발생했습니다. |

## Backend Questions

1. 관리자 수정 API 를 Notion 명세 DB 에 추가해 주세요(제안 API ID `APP_FEED_LOG_UPDATE_ADMIN`).
2. 권한(roles)이 ADMIN 만인지 확인이 필요합니다(Swagger 미기재).
3. 화면에서 바꾸지 않는 `feedDateTime` 이 필수입니다 — 상세 조회 원본 문자열을 그대로 보내면 되는지 확인이 필요합니다.
4. 400(검증 실패) 응답이 Swagger 에 없습니다.
5. 급여일지 삭제 API 가 없습니다(목록 케밥 `삭제` 에 필요).
