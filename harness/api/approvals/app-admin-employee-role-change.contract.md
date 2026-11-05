# API Contract — APP_ADMIN_EMPLOYEE_ROLE_CHANGE

## Source

- Notion 명세 없음, Swagger 기준. 명세 DB `API 명세서 토빌`(`collection://9df7a4d6-1474-839c-abb2-070e88bf667e`)에서 엔드포인트·API ID·이름 검색 0건(2026-11-04).
- Swagger: `https://api-stag.toyvillage.kr/v3/api-docs`, operation `changeEmployeeRole`, 확인 2026-11-04.
- 백엔드 코드 대조: `ToyVillage/ToyVillage-BE` #259(`develop` f53dbea). `AppAdminController`, `EmployeeRoleChangeRequest`, `EmployeeRoleChangeService`, `AppAdmin.changeRole`, `ErrorCode`, `SecurityConfig`.
- API ID 와 접근 권한은 개발자가 정했다(2026-11-04). 실제 API 는 호출하지 않았다.

## Basic Information

| API ID | Name | Description | Method | Full Path | Content-Type |
| ------ | ---- | ----------- | ------ | --------- | ------------ |
| APP_ADMIN_EMPLOYEE_ROLE_CHANGE | 직원 권한 변경 | 직원을 중간 관리자로 지정하거나 중간 관리자를 직원으로 되돌린다 | PATCH | /app/admin/employees/{appAdminId}/role | application/json |

## Authentication and Authorization

| Required | Type | Roles |
| -------- | ---- | ----- |
| true | Bearer | ADMIN |

Swagger 에 권한 값이 없어 개발자가 정했다. 백엔드 `SecurityConfig` 는 `/app/admin/**` 를 `APP_ADMIN` 만 허용한다.

## Request Headers

| Name | Type | Required | Nullable | Description |
| ---- | ---- | -------- | -------- | ----------- |
| Authorization | string | true | false | `Bearer <access-token>` |

## Path Parameters

| Name | Type | Required | Nullable | Example | Constraints |
| ---- | ---- | -------- | -------- | ------- | ----------- |
| appAdminId | integer | true | false | 3 | int64 |

## Query Parameters

없음

## Request Body

| Name | Type | Required | Nullable | Allowed Values | Description |
| ---- | ---- | -------- | -------- | -------------- | ----------- |
| role | enum | true | false | APP_ADMIN, MIDDLE_ADMIN, EMPLOYEE | 지정은 `MIDDLE_ADMIN`, 해제는 `EMPLOYEE`. `APP_ADMIN` 은 400 이라 화면에서 보내지 않는다 |

## Request Example

```json
{ "role": "MIDDLE_ADMIN" }
```

## Success Responses

- `200` `{ "message": "직원 권한이 변경되었습니다." }`

## Error Responses

| Status | 내용 | Body |
| ------ | ---- | ---- |
| 400 | `APP_ADMIN_ROLE_INVALID` 직원 계정에 부여할 수 없는 권한입니다. role 이 없으면 권한을 비워둘 수 없습니다 | 공통 오류 바디 |
| 403 | 인증 토큰이 없거나 유효하지 않음, 또는 접근 권한 없음 | 없음 |
| 404 | `APP_ADMIN_NOT_FOUND` 존재하지 않는 앱 관리자입니다. 삭제된 직원과 `APP_ADMIN` 계정도 여기에 해당한다 | 공통 오류 바디 |
| 405 | 지원하지 않는 메서드 형식입니다 | 공통 오류 바디 |
| 500 | 내부 서버 오류가 발생했습니다 | 공통 오류 바디 |

공통 오류 바디: `message` string, `status` integer, `timestamp` datetime, `description` string.

## Validation and Constraints

- 한 번에 직원 한 명만 바꾼다.
- 대상은 삭제되지 않은 `EMPLOYEE` 또는 `MIDDLE_ADMIN` 이다. 이미 같은 역할이어도 오류 없이 200 이다(백엔드에 중복 검사 없음).

## Notes

- 응답 `message` 의 필수 여부는 Swagger 에 없어 백엔드 `MessageResponse.of(...)` 기준으로 필수로 둔다.
- Swagger 는 성공을 200 으로 적었고 백엔드도 `ResponseEntity.ok` 다.
- 지정일을 저장하지 않는다. 백엔드 #259 는 역할만 바꾼다.

## Backend Questions

1. Notion 명세 DB 에 이 API 행을 추가해 달라.
2. 해제된 사람이 만든 업무지시를 승인할 수 없는 문제는 #259 에 "일단 유지"로 적혀 있다. 처리 계획이 있는지 확인이 필요하다.
