# API Contract — APP_AUTH_LOGIN

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `ebee8d82-a450-83cd-b954-01879bf64735` / `a14e8d82-a450-83d9-b811-87e1c3508076` ("API 명세서")
- Resolved page: https://app.notion.com/p/7fde8d82a4508360819a01dca6981ea7
- Requested page: 없음 (제공 URL 은 데이터베이스 인덱스 뷰였으며 API ID 검색으로 상세 페이지 해석)
- Checked at: 2026-09-10
- Exact match count: 1

## Basic Information

| API ID         | Name                  | Description                                                   | Method | Full Path       | Content-Type     |
| -------------- | --------------------- | ------------------------------------------------------------- | ------ | --------------- | ---------------- |
| APP_AUTH_LOGIN | 앱 관리자·직원 로그인 | 앱 슈퍼관리자와 직원이 공통 API로 로그인하고 앱 전용 토큰을 발급받는 기능 | POST   | /app/auth/login | application/json |

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

| Name     | Type   | Required | Nullable | Default | Example       | Description                          |
| -------- | ------ | -------- | -------- | ------- | ------------- | ------------------------------------ |
| username | string | true     | false    | 없음    | `employee01`  | 앱 슈퍼관리자 또는 직원 아이디       |
| password | string | true     | false    | 없음    | `employee01`  | 앱 슈퍼관리자 또는 직원 비밀번호     |

## Request Example

```json
{
  "username": "employee01",
  "password": "employee01"
}
```

## Success Responses

### HTTP 200 — 로그인 성공

```json
{
  "access_token": "앱 access token",
  "refresh_token": "앱 refresh token",
  "name": "김직원",
  "role": "EMPLOYEE"
}
```

| Name          | Type | Required | Nullable | Allowed Values           | Description        |
| ------------- | ---- | -------- | -------- | ------------------------ | ------------------ |
| access_token  | string | true   | false    | —                        | 앱 access token    |
| refresh_token | string | true   | false    | —                        | 앱 refresh token   |
| name          | string | true   | false    | —                        | 사용자 이름        |
| role          | enum   | true   | false    | `APP_ADMIN`, `EMPLOYEE`  | 슈퍼관리자 / 직원  |

## Error Responses

공통 바디: `{ message: string, status: integer, timestamp: datetime, description: string }`

| Status | 대표 message                     | 비고                                    |
| ------ | -------------------------------- | --------------------------------------- |
| 400    | 잘못된 요청입니다.               | 아이디 또는 비밀번호를 비워둘 수 없음   |
| 401    | 아이디 또는 비밀번호를 확인해주세요 | 자격증명 오류(세션 만료 아님)        |
| 500    | 내부 서버 오류가 발생했습니다.   | 서버 오류                               |

## Validation and Constraints

- `username`, `password` 는 비어 있을 수 없다.
- 자격증명 불일치는 401 이다.

## Notes

- 만료 시각(`expires_in` 등) 필드는 명세에 없다.
- 이 엔드포인트의 401 은 전역 토큰 재발급 대상이 아니다.

## Backend Questions

없음
