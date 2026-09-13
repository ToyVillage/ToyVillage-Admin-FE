# API Contract — TEAM_QUERY_TREE

## Source

- API ID 검색 결과: `TEAM_QUERY_TREE` exact match 1건
- Notion database/data source: https://app.notion.com/p/3d67a4d614748030af5dc94e59b3d9b7 /
  `collection://65d7a4d6-1474-82e1-8615-07f152254595`
- Resolved page: https://app.notion.com/p/3ae7a4d61474828393b081e282c38f70
- Requested page: 없음
- Checked at: 2026-09-09T20:10:00+09:00
- Exact match count: 1

## Basic Information

| API ID            | Name                   | Description                           | Method | Full Path    | Content-Type       |
| ----------------- | ---------------------- | ------------------------------------- | ------ | ------------ | ------------------ |
| `TEAM_QUERY_TREE` | 팀 전체 구조 조회 기능 | 직원 목록을 트리 형태로 조회하는 기능 | `GET`  | `/team/tree` | `application/json` |

## Authentication and Authorization

| Required | Type   | Roles     |
| -------- | ------ | --------- |
| true     | Bearer | `ADMIN`   |

## Request Headers

| Name            | Type   | Required | Nullable | Default | Example                | Description     |
| --------------- | ------ | -------- | -------- | ------- | ---------------------- | --------------- |
| `Authorization` | string | true     | false    | null    | `Bearer <access-token>` | JWT 액세스 토큰 |

## Path Parameters

없음

## Query Parameters

없음

## Request Body

없음

## Request Example

없음

## Success Responses

### `200`

팀별 소속 직원과 미배정 직원을 트리 형태로 반환한다.

| Field                    | Type            | Required | Nullable | Example      | Description                  |
| ------------------------ | --------------- | -------- | -------- | ------------ | ---------------------------- |
| `totalMemberCount`       | integer         | true     | false    | `19`         | 전체 멤버의 사람 수          |
| `teams`                  | array\<object\> | true     | false    | —            | 팀과 소속 직원 목록          |
| `teams[].id`             | integer         | true     | false    | `1`          | 팀 id                        |
| `teams[].name`           | string          | true     | false    | `동물 관리팀` | 팀 이름                      |
| `teams[].memberCount`    | integer         | true     | false    | `5`          | 팀 소속 직원 수              |
| `teams[].members`        | array\<object\> | true     | false    | —            | 팀 소속 직원 목록(빈 배열 가능) |
| `…members[].id`          | integer         | true     | false    | `2`          | 직원 id — `assigneeIds`의 값 |
| `…members[].name`        | string          | true     | false    | `이승현`     | 직원 이름                    |
| `…members[].position`    | string          | true     | **true** | `사원`       | 직원 직급                    |
| `unassigned`             | object          | true     | false    | —            | 팀 미배정 직원 그룹          |
| `unassigned.id`          | integer         | true     | **true** | `null`       | 팀 id (미배정은 항상 null)   |
| `unassigned.name`        | string          | true     | false    | `미배정`     | 그룹 이름                    |
| `unassigned.memberCount` | integer         | true     | false    | `5`          | 미배정 직원 수               |
| `unassigned.members`     | array\<object\> | true     | false    | —            | 미배정 직원 목록             |

빈 상태는 `totalMemberCount: 0`, `teams: []`,
`unassigned: { id: null, name: "미배정", memberCount: 0, members: [] }`이다.

## Error Responses

| Status | Message                        | Body                                        |
| ------ | ------------------------------ | ------------------------------------------- |
| `401`  | 만료된 토큰입니다.             | `{ message, status, timestamp, description }` |
| `404`  | 존재하지 않는 자료입니다.      | `{ message, status, timestamp, description }` |
| `500`  | 예상하지 못한 에러가 발생했습니다. | `{ message, status, timestamp, description }` |

## Validation and Constraints

명세에 필드별 Required·Nullable 표기가 없다. 200 예시와 `값이 없을경우` 예시가
모든 키를 항상 포함하므로 전부 required로 두고, 예시에 실제로 `null`이 나타나는
`unassigned.id`와 `members[].position`만 nullable로 두었다. 추측이 아닌 예시
관측에 근거하며 아래 Backend Questions에 확인 항목으로 남긴다.

## Notes

- 이 API는 업무지시 담당자 선택 트리의 유일한 데이터 출처다.
  `TASK_CREATE`·`TASK_UPDATE`의 `assigneeIds`에 넣는 값이 `members[].id`다.
- 명세에 정렬 기준이 없다. 트리 표시 순서와 `외 N명`의 대표 담당자가 응답
  순서를 따른다.

## Backend Questions

1. 응답 필드의 Required·Nullable을 명세에 표기해 달라. 특히 `position`이
   `null` 가능한지(예시의 `배준영`), `unassigned`가 항상 존재하는지.
2. `totalMemberCount`가 `unassigned`를 포함하는가? 예시는 `19`이고
   `teams` 합계 14 + `unassigned` 5 = 19라 포함으로 보이나 명시가 없다.
   `전체 직원` 체크박스의 3상태 판정이 여기에 달려 있다.
3. `members[]`의 정렬 기준이 무엇인가?
4. `404` 응답 문구가 `존재하지 않는 자료입니다.`로 자료실 문구다. 전체
   조회에서 404가 실제로 발생하는가?
