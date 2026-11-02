# API Contract — EXCEL_EXPORT

## Source

- Notion 검색(`EXCEL`·`엑셀`·`/excel`) 0건 → 개발자 지시(2026-11-02 "스웨거에서 확인")에 따라 staging Swagger만 기준. API ID는 제안값.
- Swagger: `https://api-stag.toyvillage.kr/v3/api-docs` `GET /excel`, operationId `export`, tag `excel-controller`
- 원본: `excel-export.swagger-source.json` (checkedAt 2026-11-02)
- `source.apiIdMatchCount: 0` + `source.swagger`
- Swagger에 없는 값의 근거: BE 저장소 `ToyVillage-BE` develop의 `ExcelController`·`SecurityConfig`

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| EXCEL_EXPORT | 엑셀 내보내기 | GET | /excel | application/json (요청 표기. 성공 응답은 파일) |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | ADMIN |

- 역할은 Swagger에 없다. BE `SecurityConfig`의 `hasRole("APP_ADMIN")`이 근거이고, 표기는 다른 앱 관리자 계약과 같이 ADMIN으로 둔다.

## Request Headers

| Name | Required | Example |
| --- | --- | --- |
| Authorization | true | `Bearer <access-token>` |

## Path Parameters

없음

## Query Parameters

| Name | Type | Required | Default | Example | Description |
| --- | --- | --- | --- | --- | --- |
| types | array\<enum\> `NOTICE`\|`TASK`\|`WORK_REPORT`\|`RESERVATION`\|`TEAM_MEMBER`\|`ANIMAL`\|`WORK_LOG`\|`FEED_LOG`\|`FIFTH_FLOOR_FEED_LOG`\|`ANIMAL_OBSERVATION`\|`DOCUMENT` | true | 없음 | TASK | 내보낼 항목. `types=A&types=B` 형식 |
| mode | enum `SHEET`\|`ZIP` | false | SHEET | SHEET | SHEET = xlsx 한 파일(항목별 시트), ZIP = 항목별 xlsx와 첨부파일 원본 |
| startDate | string(date) | false | 없음 | 2026-10-01 | 시작일. 없으면 하한 없음 |
| endDate | string(date) | false | 없음 | 2026-10-31 | 종료일. 없으면 상한 없음 |

## Request Body

없음

## Request Example

`GET /excel?types=ANIMAL&types=ANIMAL_OBSERVATION&mode=SHEET&startDate=2026-10-01&endDate=2026-10-31`

## Success Responses

`200` — 파일 본문(xlsx 또는 zip 바이너리). 화면은 Blob으로 받는다. Swagger 표기는 `string(byte)`.

- 헤더 `Content-Disposition`은 서버가 보내지만 CORS로 노출되지 않아 화면에서 읽지 않는다.

## Error Responses

| Status | 코드 | message |
| --- | --- | --- |
| 400 | EXCEL_EXPORT_INVALID_DATE_RANGE | 시작일은 종료일보다 늦을 수 없습니다. |
| 400 | EXCEL_EXPORT_TYPE_REQUIRED | 내보낼 항목을 하나 이상 선택해야 합니다. |
| 403 | — | 본문 없음. 토큰이 없거나 유효하지 않음, 또는 접근 권한 없음 |
| 405 | METHOD_NOT_ALLOWED | 지원하지 않는 메서드 형식입니다. |
| 413 | EXCEL_EXPORT_TOO_LARGE | 엑셀 내보내기 최대 건수를 초과했습니다. |
| 413 | EXCEL_EXPORT_ATTACHMENT_TOO_LARGE | 엑셀 내보내기 첨부파일 총용량을 초과했습니다. |
| 500 | INTERNAL_SERVER_ERROR | 내부 서버 오류가 발생했습니다. |

오류 본문 필드: `message`(string), `status`(integer), `timestamp`(datetime), `description`(string). 모두 필수로 둔다(Swagger에 필수 여부 없음, 개발자 승인 대상).

## Validation and Constraints

- `types`는 1개 이상. 서버가 중복을 제거한다.
- `startDate`는 `endDate`보다 늦을 수 없다.
- 기간이 적용되지 않는 `TEAM_MEMBER`·`ANIMAL`만 보내면 서버가 기간을 무시한다.
- 서버 한도(BE 코드): 항목별 최대 10,000건, 첨부파일 합계 200MB. 화면은 이 값을 쓰지 않고 413만 처리한다.

## Notes

- Swagger 보충 없이 Swagger 값을 그대로 썼다. 오류 필드 필수 여부와 역할만 개발자 승인으로 정한다.
- 화면 항목과 `types` 대응, `mode` 선택은 `excel-export.spec.md`에 있다.
