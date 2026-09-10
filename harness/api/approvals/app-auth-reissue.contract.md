# API Contract — APP_AUTH_REISSUE

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `ebee8d82-a450-83cd-b954-01879bf64735` / `a14e8d82-a450-83d9-b811-87e1c3508076` ("API 명세서")
- Resolved page: https://app.notion.com/p/f6ae8d82a4508321aeed013c5b937c35
- Requested page: 없음 (제공 URL 은 데이터베이스 인덱스 뷰였으며 API ID 검색으로 상세 페이지 해석)
- Checked at: 2026-09-10
- Exact match count: 1

## Basic Information

| API ID           | Name                       | Description                                                      | Method | Full Path         | Content-Type     |
| ---------------- | -------------------------- | ---------------------------------------------------------------- | ------ | ----------------- | ---------------- |
| APP_AUTH_REISSUE | 앱 관리자·직원 토큰 재발급 | 앱 refresh token을 검증하고 앱 access token과 refresh token을 새로 발급하는 기능 | POST   | /app/auth/reissue | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| false    | 없음 | 없음  |

## Request Headers

없음

## Path Parameters

없음

## Query Parameters

없음

## Request Body

required: true

| Name          | Type   | Required | Nullable | Default | Example              | Description                          |
| ------------- | ------ | -------- | -------- | ------- | -------------------- | ------------------------------------ |
| refresh_token | string | true     | false    | 없음    | `앱 refresh token`   | 앱 로그인에서 발급받은 refresh token |

## Request Example

```json
{
  "refresh_token": "앱 refresh token"
}
```

## Success Responses

### HTTP 200 — 재발급 성공

```json
{
  "access_token": "새 앱 access token",
  "refresh_token": "새 앱 refresh token"
}
```

| Name          | Type   | Required | Nullable | Description        |
| ------------- | ------ | -------- | -------- | ------------------ |
| access_token  | string | true     | false    | 새 앱 access token |
| refresh_token | string | true     | false    | 새 앱 refresh token |

- 재발급에 성공하면 요청에 사용한 기존 refresh token 은 무효화된다.

## Error Responses

공통 바디: `{ message: string, status: integer, timestamp: datetime, description: string }`

| Status | 대표 message                     | 비고                                   |
| ------ | -------------------------------- | -------------------------------------- |
| 400    | 잘못된 요청입니다.               | refresh token 을 비워둘 수 없음        |
| 401    | 만료된 토큰입니다.               | 그 외: 유효하지 않은 토큰입니다.       |
| 404    | refreshToken이 존재하지 않습니다. | 서버에 저장된 refresh token 없음      |
| 500    | 내부 서버 오류가 발생했습니다.   | 서버 오류                              |

## Validation and Constraints

- `refresh_token` 은 비어 있을 수 없다.
- 응답의 새 refresh token 으로 반드시 교체 저장해야 한다(기존 토큰 무효화).

## Notes

- 이 엔드포인트 자신의 401 은 재발급 재시도 대상이 아니다.

## Backend Questions

없음
