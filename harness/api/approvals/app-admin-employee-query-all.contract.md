# API Contract — APP_ADMIN_EMPLOYEE_QUERY_ALL

## Source

- Notion 최신 명세 DB `b53e8d82-a450-8355-b0f9-8702915ee325` 에서 엔드포인트 `/app/admin` 검색(2026-09-28): `APP_ADMIN_EMPLOYEE_CREATE`(POST) 1건뿐.
- 개발자 지시(2026-09-28, "Swagger app-admin-controller 보고 연동")로 staging Swagger `https://api-stag.toyvillage.kr/v3/api-docs/app` 를 기준으로 한다.
  - app-admin-controller: GET/POST `/app/admin/employees`, PATCH `/app/admin/employees/{appAdminId}/password`, DELETE `/app/admin/employees/{appAdminId}`
  - `EmployeeResponse { id int64, username, name, createAt(date) }` — `position` 없음, 비밀번호 변경 여부 없음
  - `EmployeeCreateRequest { username(minLength 1, required), name(minLength 1, required), position(0~30, optional) }`
  - 성공: GET 200 배열, POST/PATCH/DELETE 200 `MessageResponse { message }`
  - 오류: 403(body 없음), 404 `APP_ADMIN_NOT_FOUND`(PATCH·DELETE), 409 `APP_ADMIN_EXIST`(POST), 405, 500 — 공통 오류 바디
- 문서만 읽었고 API 엔드포인트는 호출하지 않았다.

## Basic Information

| API ID | Name | Method | Full Path | Content-Type |
| --- | --- | --- | --- | --- |
| APP_ADMIN_EMPLOYEE_QUERY_ALL | 직원 전체 조회 | GET | /app/admin/employees | application/json |

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

없음

## Success Responses

- `200` — 직원 목록 (EmployeeResponse 배열): `id` integer, `username` string, `name` string, `createAt` date, `passwordChanged` boolean

## Error Responses

공통 오류 바디: `message`, `status`, `timestamp`, `description`

| Status | Description |
| --- | --- |
| 403 | 인증 토큰이 없거나 유효하지 않음, 또는 접근 권한 없음 (Swagger에 body 스키마 없음) |
| 405 | 지원하지 않는 메서드 형식입니다. |
| 500 | 내부 서버 오류가 발생했습니다. |
