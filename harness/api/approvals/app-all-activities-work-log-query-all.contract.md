# API Contract — APP_ALL_ACTIVITIES_WORK_LOG_QUERY_ALL

## Source

- Notion 검색(`전체 활동 업무일지`·`ALL_ACTIVITIES`) 0건 → 개발자가 준 staging Swagger만 기준(개발자 지시 2026-10-29). API ID는 제안값.
  Notion `WORK_LOG_QUERY_ALL`은 `GET /work-log`(업무일지 목록)로 다른 API다.
- Swagger: `https://api-stag.toyvillage.kr/v3/api-docs`(App) `GET /all-activities/work-log`, operationId `getWorkLogs`, tag `all-activities-controller`
- 원본: `app-all-activities-work-log-query-all.swagger-source.json` (checkedAt 2026-11-02)
- `writeAt` date-time 변경: ToyVillage-BE#252(2026-11-02 머지·스테이징 배포)
- `source.apiIdMatchCount: 0` + `source.swagger`

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| APP_ALL_ACTIVITIES_WORK_LOG_QUERY_ALL | 전체 활동 날짜별 업무일지 조회 | GET | /all-activities/work-log | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | ADMIN |

- 역할은 Swagger에 없어 다른 관리자 조회와 맞췄다.

## Request Headers

| Name | Required | Example |
| --- | --- | --- |
| Authorization | true | `Bearer <access-token>` |

## Path Parameters

없음

## Query Parameters

| Name | Type | Required | Example | Description |
| --- | --- | --- | --- | --- |
| date | string(date) | true | 2026-10-20 | 조회 날짜 |

## Request Body

없음

## Request Example

`GET /all-activities/work-log?date=2026-10-20`

## Success Responses

`200` — 배열

| Name | Type | Required | Nullable | Example | Description |
| --- | --- | --- | --- | --- | --- |
| [].workLogId | integer(int64) | true | false | 1 | 행 key |
| [].writeAt | string(date-time) | true | false | 2026-10-20T08:30:00 | 작성시간 `HH:mm` |
| [].templateTitle | string | true | false | 개장 전 점검일지 | 양식 |
| [].title | string | true | false | 정문·매표소 개장 전 점검 | 제목 |
| [].authorName | string | true | false | 이승현 | 작성자 |
| [].fileCount | integer(int64) | true | false | 1 | 첨부 수 |

## Error Responses

| Status | Description |
| --- | --- |
| 403 | 토큰 없음/만료/권한 없음(공통 인터셉터) |
| 405 | 지원하지 않는 메서드 형식입니다. |
| 500 | 내부 서버 오류가 발생했습니다. |

## Validation and Constraints

- `date`는 `YYYY-MM-DD`. 아니면 요청하지 않고 실패로 본다.

## Notes

- Swagger와 차이 없음. 페이지 파라미터 없이 배열 전체가 온다.
- DB 컬럼 변경(DATE → DATETIME) 전에 쓴 업무일지는 `writeAt` 시간이 `00:00:00`이다. 받은 값을 그대로 표시한다.

## Backend Questions

1. Notion 명세 DB에 이 API를 추가해 달라(제안 ID `APP_ALL_ACTIVITIES_WORK_LOG_QUERY_ALL`).
2. 접근 역할, 필드 nullable, 정렬 기준 명시 요청.
