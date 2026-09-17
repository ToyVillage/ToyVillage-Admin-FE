# API Contract — APP_ADMIN_EMPLOYEE_CREATE

## Source

- API ID 검색 결과: exact match 1건 (SQL 정확 일치 count, 2026-09-17 KST)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/d047a4d614748399a72881ece7e5fe28
- Requested page: https://app.notion.com/p/d047a4d614748399a72881ece7e5fe28
- Checked at: 2026-09-17T20:00:00+09:00
- Exact match count: 1

## Basic Information

| API ID                    | Name           | Description                                              | Method | Full Path            | Content-Type     |
| ------------------------- | -------------- | -------------------------------------------------------- | ------ | -------------------- | ---------------- |
| APP_ADMIN_EMPLOYEE_CREATE | 직원 계정 생성 | 앱 슈퍼관리자가 아이디와 이름으로 직원 계정을 생성하는 기능 | POST   | /app/admin/employees | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Default | Example              | Description                            | Constraints |
| ------------- | ------ | -------- | -------- | ------- | -------------------- | -------------------------------------- | ----------- |
| Authorization | string | true     | false    | 없음    | Bearer {accessToken} | `Bearer {accessToken}` 형식으로 전달합니다. | Bearer 스킴 |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

| Name     | Type   | Required | Nullable | Default | Example    | Description                        | Constraints |
| -------- | ------ | -------- | -------- | ------- | ---------- | ---------------------------------- | ----------- |
| username | string | true     | false    | 없음    | employee01 | 생성할 직원의 로그인 아이디입니다. | 없음        |
| name     | string | true     | false    | 없음    | 김직원     | 생성할 직원의 이름입니다.          | 없음        |

## Request Example

```json
{
  "username": "employee01",
  "name": "김직원"
}
```

## Success Responses

- `201` — 직원이 생성되었습니다.

```json
{
  "message": "직원이 생성되었습니다."
}
```

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Description                              | message                                |
| ------ | ---------------------------------------- | -------------------------------------- |
| 400    | 아이디 또는 이름을 비워둘 수 없습니다.   | 잘못된 요청입니다.                     |
| 401    | 만료된 토큰입니다.                       | 만료된 토큰입니다.                     |
| 401    | 유효하지 않은 토큰입니다.                | 유효하지 않은 토큰입니다.              |
| 403    | 접근할 수 있는 권한이 없습니다.          | 접근할 수 있는 권한이 없습니다.        |
| 409    | 이미 사용 중인 앱 관리자 아이디입니다.   | 이미 사용 중인 앱 관리자 아이디입니다. |
| 500    | 내부 서버 오류가 발생했습니다.           | 내부 서버 오류가 발생했습니다.         |

## Validation and Constraints

- `username`, `name`은 필수이며 비어 있으면 400.
- 같은 `username`이 이미 있으면 409.
- 길이·형식 제한은 명세에 선언돼 있지 않다(명세 누락 — 추측하지 않음).

## Notes

- 초기 비밀번호는 서버가 `username`과 같게 설정한다. 요청에 비밀번호 필드가 없다.
- 명세에 Nullable 표기가 없다. 필수 문자열이라 `nullable: false`로 둔다(기존 contract 관례).

## Backend Questions

1. `username`·`name` 길이·허용 문자 제한이 있는지.
