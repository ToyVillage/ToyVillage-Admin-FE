# API Contract — CLOSE_DAT_CREATE

## Source

- API ID 검색 결과: exact match 1건
- Notion database:
  `https://app.notion.com/p/3ab7a4d6147480ad9017d80be2c11449`
- Notion data source:
  `collection://ecf7a4d6-1474-83e4-91c7-077a08b7cc37`
- Resolved page:
  `https://app.notion.com/p/3bc7a4d614748379bd1581dea10a27b2`
- Requested page:
  `https://app.notion.com/p/3bc7a4d614748379bd1581dea10a27b2`
- Checked at: `2026-07-28T22:01:48+09:00`

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- | --- |
| `CLOSE_DAT_CREATE` | 휴관일 추가(등록) 기능 | 휴관일을 추가하는 기능 | `POST` | `/close-day` | `application/json` |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | `ADMIN` |

## Request Headers

| Name | Type | Required | Nullable | Example |
| --- | --- | --- | --- | --- |
| `Authorization` | string | true | false | `Bearer <access-token>` |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

| Name | Type | Required | Nullable | Example | Constraints |
| --- | --- | --- | --- | --- | --- |
| `title` | string | true | false | `휴관` | trim 후 비어 있지 않음 |
| `startCloseTime` | string | true | false | `2026-07-10` | `YYYY-MM-DD` |
| `endCloseTime` | string | true | false | `2026-07-11` | `YYYY-MM-DD`, 시작일과 같거나 이후 |

## Request Example

```json
{
  "title": "휴관",
  "startCloseTime": "2026-07-10",
  "endCloseTime": "2026-07-11"
}
```

## Success Responses

### HTTP 200

```json
{
  "message": "휴관일이 생성되었습니다."
}
```

`message`는 required, nullable false string이다.

## Error Responses

- HTTP 400: 요청이 유효하지 않음
- HTTP 401: 만료된 토큰
- HTTP 500: 예상하지 못한 서버 오류
- 공통 필드: `message`, `status`, `timestamp`, `description`
- 오류 body와 모든 필드는 required, nullable false

## Validation and Constraints

- Request Body의 세 필드는 모두 required, nullable false이다.
- 날짜는 `YYYY-MM-DD` 형식이며 실제 달력 날짜여야 한다.
- `endCloseTime`은 `startCloseTime`과 같거나 이후여야 한다.
- `title`은 trim 후 비어 있지 않아야 한다.

## Notes

- 누락된 필드 메타데이터는 2026-07-28 사용자 결정으로 기존 프로젝트 계약
  규칙에 맞춰 보수적으로 동결했다.
- 실제 서버 테스트는 비활성화한다.
- 백엔드 명세가 보완되면 임시 동결값을 재검토한다.

## Backend Questions

없음
