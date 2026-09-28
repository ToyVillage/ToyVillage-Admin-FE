# API Contract — APP_FEED_LOG_DELETE_ADMIN

## Source

- Notion 최신 명세 DB(`b53e8d82-a450-8355-b0f9-8702915ee325`) FEED_LOG DELETE 검색 결과: 0건
- 개발자 지시로 staging Swagger `https://api-stag.toyvillage.kr/v3/api-docs/app` 의
  `DELETE /feed-log/admin/{feedLogId}`(operationId `deleteFeedLog`)를 기준으로 삼는다.
- Checked at: 2026-09-28 / Exact match count: 1 (Swagger paths 중 1건)

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| APP_FEED_LOG_DELETE_ADMIN | 관리자 급여일지 삭제 | DELETE | /feed-log/admin/{feedLogId} | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | ADMIN |

- 역할은 Swagger 에 없어 같은 컨트롤러의 `APP_FEED_LOG_QUERY_ADMIN`(ADMIN)과 맞췄다.

## Path Parameters

| Name | Type | Required | Nullable | Example | Description |
| --- | --- | --- | --- | --- | --- |
| feedLogId | integer(int64) | true | false | 1 | 삭제할 급여일지 id |

## Query Parameters / Request Body

없음

## Success Responses

- `200` — 본문 없음(Swagger content 정의 없음). 프론트는 본문을 읽지 않는다.

## Error Responses

공통 오류 바디: `message`, `status`, `timestamp`, `description`

| Status | Description |
| --- | --- |
| 403 | 인증 토큰이 없거나 유효하지 않음, 또는 접근 권한 없음 (body 스키마 없음) |
| 404 | FEED_LOG_NOT_FOUND `존재하지 않는 급여일지입니다.` / APP_ADMIN_NOT_FOUND |
| 405 | 지원하지 않는 메서드 형식입니다. |
| 500 | 내부 서버 오류가 발생했습니다. |

## Backend Questions

1. 관리자 삭제 API 를 Notion 명세 DB 에 추가해 달라(제안 API ID `APP_FEED_LOG_DELETE_ADMIN`).
2. 성공 200 의 응답 본문(예: `{ message }`) 유무를 명세에 적어 달라.
3. 권한이 ADMIN 만인지 확인이 필요하다.
