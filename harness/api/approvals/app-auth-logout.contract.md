# API Contract — APP_AUTH_LOGOUT

## Source

- Notion 최신 명세 DB(`3dd7a4d6…`, `collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) 검색 결과: 0건
  (인증 카테고리는 APP_AUTH_LOGIN, APP_AUTH_REISSUE, APP_AUTH_PASSWORD_CHANGE 3건뿐)
- 개발자 지시로 staging Swagger `https://api-stag.toyvillage.kr/v3/api-docs` 의 `POST /app/auth/logout`(operationId `logout`)을 기준으로 삼는다.
- `source.notionDatabase`/`resolvedNotionPage` 에는 Swagger 문서 URL을 기록했다.
- Checked at: 2026-09-17
- Exact match count: 1 (Swagger paths 중 `/app/auth/logout` 1건)

## Basic Information

| API ID          | Name                    | Description                                                     | Method | Full Path        | Content-Type     |
| --------------- | ----------------------- | --------------------------------------------------------------- | ------ | ---------------- | ---------------- |
| APP_AUTH_LOGOUT | 앱 관리자·직원 로그아웃 | 로그인한 앱 슈퍼관리자 또는 직원의 refresh token을 서버에서 무효화 | POST   | /app/auth/logout | application/json |

## Authentication and Authorization

| Required | Type   | Roles       |
| -------- | ------ | ----------- |
| true     | Bearer | USER, ADMIN |

- Swagger 전역 security `bearerAuth` 적용. 역할은 Swagger에 없어 같은 컨트롤러의 APP_AUTH_PASSWORD_CHANGE(Notion: USER, ADMIN)와 맞췄다.

## Request Headers

| Name          | Type   | Required | Example                 |
| ------------- | ------ | -------- | ----------------------- |
| Authorization | string | true     | `Bearer <access-token>` |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

없음 (Swagger operation에 `requestBody` 없음)

## Request Example

없음

## Success Responses

### HTTP 200 — 로그아웃 성공 (`MessageResponse`)

| Name    | Type   | Required | Nullable | Description |
| ------- | ------ | -------- | -------- | ----------- |
| message | string | true     | false    | 결과 메시지 |

## Error Responses

| Status | 설명                                               | Body                                                    |
| ------ | -------------------------------------------------- | ------------------------------------------------------- |
| 403    | 인증 토큰이 없거나 유효하지 않음, 또는 접근 권한 없음 | Swagger 스키마 없음                                     |
| 405    | Method Not Allowed                                 | `{ message, status, timestamp, description }`           |
| 500    | Internal Server Error                              | `{ message, status, timestamp, description }`           |

## Validation and Constraints

- 요청 바디 없이 access token 만으로 사용자를 식별한다.

## Notes

- 서버 실패 여부와 무관하게 프론트는 로컬 세션을 비운다(task spec).

## Backend Questions

- Notion 명세 DB에 APP_AUTH_LOGOUT 행 추가 요청 (현재 Swagger에만 존재).
- 401(만료 access token) 응답 여부가 Swagger에 명시돼 있지 않다. 현재는 공통 인터셉터 규칙(재발급 후 재시도)을 따른다.
