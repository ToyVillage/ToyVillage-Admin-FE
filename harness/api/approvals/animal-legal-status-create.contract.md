# API Contract — ANIMAL_LEGAL_STATUS_CREATE

## Source

- API ID 검색 결과: exact match 1건 (view 모드 전체 행 조회, has_more=false, 2026-09-16 23:43 KST)
- Notion database/data source: https://app.notion.com/p/3dd7a4d6147480feb564ce3b172329f5 / `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`
- Resolved page: https://app.notion.com/p/5387a4d614748333be2d81a374211aee
- Requested page: https://app.notion.com/p/5387a4d614748333be2d81a374211aee
- Checked at: 2026-09-16T23:45:00+09:00
- Exact match count: 1

## Basic Information

| API ID                     | Name                   | Description                          | Method | Full Path                   | Content-Type     |
| -------------------------- | ---------------------- | ------------------------------------ | ------ | --------------------------- | ---------------- |
| ANIMAL_LEGAL_STATUS_CREATE | 법정지정분류 생성 기능 | 관리자가 법정지정분류를 등록하는 기능 | POST   | /animal-manage/legal-status | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Default | Example               | Description                                    | Constraints |
| ------------- | ------ | -------- | -------- | ------- | --------------------- | ---------------------------------------------- | ----------- |
| Authorization | string | true     | false    | 없음    | Bearer <access-token> | JWT 액세스 토큰. 관리자(ADMIN) 액세스 토큰만 허용 | Bearer 스킴 |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

| Name | Type   | Required | Nullable | Default | Example                | Description                     | Constraints |
| ---- | ------ | -------- | -------- | ------- | ---------------------- | ------------------------------- | ----------- |
| kind | string | true     | false    | 없음    | 멸종위기 야생생물 Ⅰ급  | 등록할 법정지정분류 이름입니다. | 없음        |

## Request Example

```json
{
  "kind": "멸종위기 야생생물 Ⅰ급"
}
```

## Success Responses

- `201` — 법정지정분류 생성 성공

```json
{
  "message": "법정지정분류 생성 성공"
}
```

## Error Responses

공통 오류 바디: `message`(string), `status`(integer), `timestamp`(string), `description`(string)

| Status | Description                     | message                         |
| ------ | ------------------------------- | ------------------------------- |
| 400    | 법정지정분류를 입력해주세요.    | 요청이 유효하지 않습니다.       |
| 401    | 만료되었거나 유효하지 않은 토큰 | 만료된 토큰입니다.              |
| 403    | 직원(USER) 토큰으로 호출한 경우 | 접근할 수 있는 권한이 없습니다. |
| 500    | 내부 서버 오류가 발생했습니다.  | 내부 서버 오류가 발생했습니다.  |

## Validation and Constraints

- `kind`는 필수이며 비어 있으면 400(`법정지정분류를 입력해주세요.`).
- `kind` 길이 제한은 명세에 선언돼 있지 않다(명세 누락 — 추측하지 않음).

## Notes

- 성공 status는 200이 아니라 201.
- staging 실측 POST 201 — 명세와 일치 (개체관리 계열은 Swagger가 전부 200으로 표기돼 있으나 실제·명세는 201).
- 개발자 확인(2026-09-16, 명세에 없음): 법정지정분류는 전체 공용 목록이다.

## Backend Questions

없음
