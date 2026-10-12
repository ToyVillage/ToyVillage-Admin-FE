# API Input Contract

## 작업 입력

작업은 `harness/api/specs/<feature>.spec.md`를 사용한다. `api_id`가 필수이며 `notion_page`는 선택이다.

## 명세 상세 페이지 순서

1. Basic Information
2. Authentication and Authorization
3. Request Headers
4. Path Parameters
5. Query Parameters
6. Request Body
7. Request Example
8. Success Responses
9. Error Responses
10. Validation and Constraints
11. Notes

값이 없는 섹션도 삭제하지 않고 `없음`으로 명시한다. 하네스는 `없음`과 `명세 누락`을 다르게 처리한다.

## Notion 데이터베이스 인덱스

데이터베이스는 API를 찾고 상세 페이지와 비교하는 데 필요한 최소 속성만 둔다.

| 속성                    | 권장 타입            | 규칙                          |
| ----------------------- | -------------------- | ----------------------------- |
| API Name                | title                | 사람이 읽는 이름              |
| API ID                  | rich text            | `UPPER_SNAKE_CASE`, 중복 금지 |
| Method                  | select               | GET, POST, PUT, PATCH, DELETE |
| Path                    | rich text            | 전체 Path, Query String 금지  |
| Authentication Required | checkbox 또는 select | 공개 API도 명시               |
| Authentication Type     | select               | 실제 백엔드 값                |
| Roles                   | multi-select         | 실제 백엔드 역할 값           |
| Assignee                | people               | 담당자                        |
| Status                  | status               | 명세 작업 상태                |

Query Parameter 상세는 페이지의 구조화 표에서 관리한다. 필요하면 `Has Query Parameters`와 `Query Parameter Summary`만 인덱스에 추가한다.

API ID 검색은 exact match 결과 수를 Contract의 `source.apiIdMatchCount`에 기록하며 반드시 1이어야 한다. Path는 `/`로 시작하고 `?`와 `#`가 없어야 한다. 기존 데이터는 API ID와 전체 Path가 채워지고 중복·누락 검사가 끝난 행부터 순차적으로 사용한다.

## 공통 필드

Header, Path, Query, Body, Response 필드는 다음 속성을 사용한다.

```text
Name
Location
Type
Required
Nullable
Default
Example
Description
Constraints
```

Enum은 `Allowed Values`가 필수이다. 기본 타입 표기는 `string`, `integer`, `number`, `boolean`, `datetime`, `enum`, `array<string>`, `array<object>`, `object`이다.

## Contract의 명시적 없음

- Request Body 없음: `"requestBody": null`
- Response Body 없음: 해당 response에 `"body": null`, `"noContent": true`
- 공개 API: `"required": false`, `"type": null`, `"roles": []`
- 기본값 없음: `"default": null`

속성이 빠진 상태는 명시적 없음이 아니며 검증 실패이다.

## JSON Contract 구조

아래 값은 구조 예시이며 실제 값은 Notion 명세에서만 채운다.

```json
{
  "apiId": "API_ID_FROM_NOTION",
  "name": "API name from Notion",
  "description": "",
  "method": "GET",
  "path": "/full-path-from-notion",
  "authentication": {
    "required": false,
    "type": null,
    "roles": []
  },
  "contentType": "application/json",
  "headers": [],
  "pathParameters": [],
  "queryParameters": [],
  "requestBody": null,
  "responses": {
    "success": [
      {
        "status": 204,
        "description": "",
        "body": null,
        "noContent": true
      }
    ],
    "errors": []
  },
  "source": {
    "notionDatabase": "",
    "notionDataSource": null,
    "resolvedNotionPage": "",
    "requestedNotionPage": null,
    "checkedAt": "",
    "apiIdMatchCount": 1,
    "databaseValues": {
      "apiId": "",
      "method": "",
      "path": "",
      "authentication": {}
    },
    "detailValues": {
      "apiId": "",
      "method": "",
      "path": "",
      "authentication": {}
    }
  }
}
```

실제 Contract는 대표 오류 응답이 최소 하나 있어야 하므로 위 구조 예시의 빈 `errors`는 validator를 통과하지 않는다. 이는 값이 없는 예시를 서버 오류 값으로 오해해 복사하지 않도록 의도한 것이다.

## 출처 증명

Contract JSON의 `source`에는 다음을 기록한다.

```text
notionDatabase
notionDataSource
resolvedNotionPage
requestedNotionPage
checkedAt
apiIdMatchCount
databaseValues
detailValues
```

`databaseValues`와 `detailValues`는 최소한 API ID, Method, Path, 인증 정보를 각각 보존한다. validator가 두 값과 Contract를 비교한다.

## STOP 조건

- API ID 없음, 중복, 검색 결과 없음
- Method 또는 Full Path 없음
- Path에 Query String 포함
- 데이터베이스와 상세 페이지의 API ID, Method, Path, 인증 정보 불일치
- Authentication Required 없음
- 인증이 필요한데 Authentication Type 또는 Roles 없음
- Parameter의 Type, Required, Nullable 없음
- Enum Allowed Values 없음
- 성공 Status Code 없음
- 성공 Response Body 또는 명시적 No Content 없음
- 설명과 JSON 예시 충돌
- 동일 문서에 서로 다른 endpoint 존재

불완전한 값은 Contract에 추측해 넣지 않고 백엔드 질문 목록으로 반환한다.
