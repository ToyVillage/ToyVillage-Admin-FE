# API Contract — DOCUMENTS_CREATE

## Source

- API ID 검색 결과: exact match 1건
- Notion database/data source: `e58e8d82-a450-822f-885e-01958a22bd25` / `a34e8d82-a450-82f4-8abe-07079f4f2841` ("API 명세서 (1)")
- Resolved page: https://app.notion.com/p/bede8d82a450839b98d4816cd1afbdf5
- Requested page: 없음 (제공 URL은 데이터베이스 인덱스 뷰였으며 API ID 검색으로 상세 페이지 해석)
- Checked at: 2026-07-28
- Exact match count: 1

## Basic Information

| API ID           | Name                  | Description                | Method | Full Path  | Content-Type     |
| ---------------- | --------------------- | -------------------------- | ------ | ---------- | ---------------- |
| DOCUMENTS_CREATE | 자료실 자료 등록 기능 | 자료실에 자료를 등록하는 기능 | POST   | /documents | application/json |

## Authentication and Authorization

| Required | Type   | Roles |
| -------- | ------ | ----- |
| true     | Bearer | ADMIN |

## Request Headers

| Name          | Type   | Required | Nullable | Example                | Description |
| ------------- | ------ | -------- | -------- | ---------------------- | ----------- |
| Authorization | string | true     | false    | `Bearer <access-token>` | 액세스 토큰 |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

required: true

| Name  | Type          | Required | Nullable | Allowed Values                     | Example              | Description               |
| ----- | ------------- | -------- | -------- | ---------------------------------- | -------------------- | ------------------------- |
| title | string        | true     | false    | —                                  | `자료 제목`          | 자료 제목 (비어 있을 수 없음) |
| type  | enum          | true     | false    | `PDF`, `JPEG/JPG`, `PNG`, `OTHER`  | `PDF`                | 자료 저장 타입. 직접 지정   |
| files | array<string> | true     | false    | —                                  | `["file key1", ...]` | 파일 키 목록 (최소 1개)    |

## Request Example

```json
{
  "title": "자료 제목",
  "type": "PDF",
  "files": ["file key1", "file key2"]
}
```

## Success Responses

### HTTP 201 — 자료 등록 성공

```json
{ "message": "자료 등록 성공" }
```

## Error Responses

공통 바디: `{ message: string, status: integer, timestamp: datetime, description: string }`

| Status | 대표 message                     | 비고                                            |
| ------ | -------------------------------- | ----------------------------------------------- |
| 400    | 자료 제목은 비어있을 수 없습니다. | 그 외: 자료 종류 선택 필요 / 파일 1개 이상 필요 |
| 401    | 만료된 토큰입니다.               | 토큰 만료                                       |
| 404    | 존재하지 않는 파일입니다.        | 잘못된 file key                                 |
| 500    | 예상하지 못한 에러가 발생했습니다. | 서버 오류                                       |

## Validation and Constraints

- title: 비어 있을 수 없음
- type: 4개 enum 중 하나 필수 선택
- files: 최소 1개 이상

## Notes

- `files` 항목은 파일 업로드(FILE_CREATE, `uploadFile` → `POST /file`) 응답의 `fileKey`이다(파일 이름 아님). 폼은 파일 첨부 즉시 업로드해 얻은 `fileKey`를 보관했다가 생성 요청에 그 키 목록을 전송한다.
- `type` enum(`PDF`/`JPEG/JPG`/`PNG`/`OTHER`) ↔ 프론트 `FileType`(`pdf`/`jpg`/`png`/`etc`) 매핑 확정.

## Backend Questions

없음 (파일 키 확보 방식과 enum 매핑 모두 확정됨)
