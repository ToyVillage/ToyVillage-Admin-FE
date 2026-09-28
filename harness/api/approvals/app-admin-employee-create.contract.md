# API Contract — APP_ADMIN_EMPLOYEE_CREATE

## Source

- Notion 최신 명세 DB `b53e8d82-a450-8355-b0f9-8702915ee325` 에서 엔드포인트 `/app/admin` 검색(2026-09-28): `APP_ADMIN_EMPLOYEE_CREATE`(POST) 1건뿐.
- 개발자 지시(2026-09-28, "Swagger app-admin-controller 보고 연동")로 staging Swagger `https://api-stag.toyvillage.kr/v3/api-docs/app` 를 기준으로 한다.
  - app-admin-controller: GET/POST `/app/admin/employees`, PATCH `/app/admin/employees/{appAdminId}/password`, DELETE `/app/admin/employees/{appAdminId}`
  - `EmployeeResponse { id int64, username, name, createAt(date) }` — `position` 없음, 비밀번호 변경 여부 없음
  - `EmployeeCreateRequest { username(minLength 1, required), name(minLength 1, required), position(0~30, optional) }`
  - 성공: GET 200 배열, POST/PATCH/DELETE 200 `MessageResponse { message }`
  - 단, 실제 서버는 POST 성공에 201 을 준다(2026-09-29 개발자 확인). Notion 도 201 이라 이 Contract 는 201 을 쓴다.
  - 오류: 403(body 없음), 404 `APP_ADMIN_NOT_FOUND`(PATCH·DELETE), 409 `APP_ADMIN_EXIST`(POST), 405, 500 — 공통 오류 바디
- 문서만 읽었고 API 엔드포인트는 호출하지 않았다.

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| APP_ADMIN_EMPLOYEE_CREATE | 직원 계정 생성 | POST | /app/admin/employees | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| --- | --- | --- |
| true | Bearer | ADMIN |

- 역할은 Swagger 에 없어 Notion `APP_ADMIN_EMPLOYEE_CREATE`(ADMIN)와 맞췄다.

## Path Parameters

없음

## Query Parameters

없음

## Request Body

| Name | Type | Required | Constraints |
| --- | --- | --- | --- |
| username | string | true | — |
| name | string | true | — |
| position | string | false | maxLength 30 |

## Success Responses

- `201` — 직원이 생성되었습니다.: `message` string

## Error Responses

공통 오류 바디: `message`, `status`, `timestamp`, `description`

| Status | Description |
| --- | --- |
| 400 | 아이디 또는 이름을 비워둘 수 없습니다. |
| 401 | 만료된 토큰입니다. |
| 401 | 유효하지 않은 토큰입니다. |
| 403 | 접근할 수 있는 권한이 없습니다. |
| 409 | 이미 사용 중인 앱 관리자 아이디입니다. |
| 500 | 내부 서버 오류가 발생했습니다. |
