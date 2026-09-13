# API Test Scenarios — team-query-tree

공통 사전 조건: `accessToken`을 localStorage에 넣고 `page.route()`로
`GET **/team/tree`를 mock 한 뒤 `/tasks/create`로 진입한다. 실제 서버는
호출하지 않는다.

기본 성공 body

```json
{
  "totalMemberCount": 5,
  "teams": [
    {
      "id": 1,
      "name": "동물 관리팀",
      "memberCount": 2,
      "members": [
        { "id": 3, "name": "이승현", "position": "사원" },
        { "id": 4, "name": "홍길동", "position": "과장" }
      ]
    },
    {
      "id": 2,
      "name": "창고팀",
      "memberCount": 1,
      "members": [{ "id": 5, "name": "이지아", "position": "대리" }]
    }
  ],
  "unassigned": {
    "id": null,
    "name": "미배정",
    "memberCount": 2,
    "members": [
      { "id": 6, "name": "배준영", "position": null },
      { "id": 7, "name": "김수인", "position": "사원" }
    ]
  }
}
```

오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 생성 화면 진입 시 트리 조회

- 목적: 진입 시 팀 구조를 한 번 조회하고 트리를 렌더한다.
- Mock request: `GET /api/team/tree`
- Request headers: `Authorization: Bearer …`
- Request query/body: 없음
- Mock response: HTTP 200, 기본 성공 body
- 사용자 동작: `/tasks/create` 진입
- 기대 결과: GET 정확히 1회, `전체 직원 0/5명` 행, 팀 행
  `동물 관리팀 0/2명` · `창고팀 0/1명` · `미배정 0/2명`(마지막),
  진입 시 모든 팀이 접혀 있음

## Mock S2 — 직원 행 표기

- 사용자 동작: `동물 관리팀` 펼치기 → `미배정` 펼치기
- 기대 결과: `이승현 사원`, `홍길동 과장`, `배준영`(직급 없음 — 이름만),
  `김수인 사원`

## Mock S3 — 팀 단위 선택과 3상태

- 사용자 동작: `동물 관리팀` 체크박스 클릭
- 기대 결과: 소속 2명 선택, 팀 행 `2/2명`·체크 상태 `on`,
  `전체 직원` 행 `2/5명`·상태 `mixed`

## Mock S4 — 미배정 그룹 단위 선택

- 사용자 동작: `미배정` 체크박스 클릭
- 기대 결과: `id: null` 그룹도 팀 행과 같이 동작해 소속 2명 선택,
  `미배정 2/2명`, `전체 직원 2/5명`

## Mock S5 — 전체 선택

- 사용자 동작: `전체 직원` 체크박스 클릭
- 기대 결과: 모든 팀·미배정 직원 5명 선택, `전체 직원 5/5명` 상태 `on`,
  모든 팀 행 `on`. 다시 클릭하면 전체 해제

## Mock S6 — 직원 없음(빈 상태)

- Mock response: HTTP 200,
  `{"totalMemberCount":0,"teams":[],"unassigned":{"id":null,"name":"미배정","memberCount":0,"members":[]}}`
- 기대 결과: 오류 문구 없이 `전체 직원 0/0명`과 `미배정 0/0명` 행만 표시,
  제출 시 `담당자를 선택해주세요` 검증 다이얼로그

## Mock S7 — 인증 오류

- Mock response: HTTP 401 오류 body
- 기대 결과: `담당자 목록을 불러오지 못했습니다. 다시 시도해 주세요.`
  (`role="alert"`), 제출 버튼 비활성, 트리 행 없음, mock 데이터 미표시

## Mock S8 — 조회 실패(404)

- Mock response: HTTP 404 오류 body
- 기대 결과: S7과 같은 오류 표시와 제출 차단

## Mock S9 — 서버 오류

- Mock response: HTTP 500 오류 body
- 기대 결과: S7과 같은 오류 표시와 제출 차단

## Mock S10 — Contract 응답 형식 위반

- Mock response: HTTP 200, `{ "teams": [] }` (`totalMemberCount`·`unassigned`
  누락)
- 기대 결과: 성공 처리하지 않고 오류 표시, 제출 차단

## Mock S11 — 수정 화면에서 같은 캐시 사용

- Mock request: `GET /api/tasks/12`(상세, `assignees` 3·6) +
  `GET /api/team/tree`
- 사용자 동작: `/tasks/12/edit` 진입
- 기대 결과: 트리 GET 1회, `이승현`(id 3)과 `배준영`(id 6)만 체크,
  팀 행 카운트 `동물 관리팀 1/2명` · `미배정 1/2명`,
  진입 시 팀은 접힌 상태

## Mock S12 — 업무지시 캐시와 분리

- 사용자 동작: 생성 화면에서 담당자 선택 후 제출(`POST /api/tasks` 200)
- 기대 결과: 목록으로 이동하며 `GET /api/tasks`는 재요청되지만
  `GET /api/team/tree`는 재요청되지 않음

## Staging R1

- 실행 여부: disabled
- 실제 request: 미실행
- 사전 조건/테스트 계정: 없음
- 사용자 동작: 없음
- 기대 status와 결과: 없음
- 생성 데이터 식별자: 없음
- 정리 절차: 없음

## 공통 확인

- Mock 시나리오는 실제 서버 요청 없음
- 승인 Contract 밖의 request/response 필드 없음
- 조회 실패를 빈 트리나 하드코딩 mock으로 숨기지 않음
- 공통 Axios와 기존 인증 interceptor 사용
- query key `['teams','tree']`가 `['tasks']` 무효화에 걸리지 않음
- Staging 실제 서버 테스트는 실행하지 않음
