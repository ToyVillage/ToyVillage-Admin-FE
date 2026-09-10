# API Test Scenarios — task-query-all

공통 사전 조건: `accessToken`을 localStorage에 넣고 `page.route()`로
`GET **/tasks*`를 mock 한 뒤 `/tasks`로 진입한다. 실제 서버는 호출하지 않는다.

기본 성공 body(항목 3건, `totalPageSize: 2`)

```json
{
  "tasks": [
    { "id": 12, "title": "9월 정기 안전점검", "assigneeName": "이승현",
      "assigneeCount": 4, "status": "IN_PROGRESS", "priority": "HIGH",
      "finishDate": "2026-09-05" },
    { "id": 13, "title": "사료 재고 정리", "assigneeName": "김수인",
      "assigneeCount": 1, "status": "COMPLETED", "priority": "LOW",
      "finishDate": "2026-08-20" },
    { "id": 14, "title": "급수설비 점검", "assigneeName": "이지아",
      "assigneeCount": 2, "status": "EXPIRED", "priority": "MEDIUM",
      "finishDate": "2026-07-01" }
  ],
  "totalPageSize": 2
}
```

오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 진입 시 첫 페이지 조회

- 목적: 진입 요청이 `page=0&size=10`이고 `status`가 없다.
- Mock request: `GET /api/tasks?page=0&size=10`
- Request headers: `Authorization: Bearer …`
- Mock response: HTTP 200, 기본 성공 body
- 사용자 동작: `/tasks` 진입
- 기대 결과: GET 1회, query에 `status`·`sort` 없음, 행 3개,
  담당자 셀 `이승현 외 3명` / `김수인`(외 N명 없음) / `이지아 외 1명`,
  상태 pill `진행중` / `완료` / `지연`, 페이지 버튼 1·2

## Mock S2 — 상태 탭이 status query로 전달

- 목적: 탭이 서버 필터로 전달되고 1페이지로 되돌아간다.
- 사용자 동작: 2페이지로 이동 → `진행중` 탭 → `완료` 탭 → `지연` 탭
- Mock request: 각각 `status=IN_PROGRESS`, `status=COMPLETED`,
  `status=EXPIRED`, 모두 `page=0`
- 기대 결과: 탭마다 GET 1회, 요청 query가 표와 일치, 탭 전환 후 항상
  `page=0`. `전체 업무`로 돌아오면 1페이지의 첫 조회(캐시)를 재사용하며
  `status`를 붙인 재요청이 없다

## Mock S3 — 페이지 이동

- 목적: 화면 2페이지가 서버 `page=1`이다.
- 사용자 동작: 페이지 `2` 클릭
- Mock request: `GET /api/tasks?page=1&size=10`
- Mock response: HTTP 200, 항목 1건, `totalPageSize: 2`
- 기대 결과: GET 2회째가 `page=1`, 행 1개, 페이지 버튼 유지

## Mock S4 — 총 페이지 수 반영

- Mock response: `totalPageSize: 3`
- 기대 결과: 페이지 버튼 1·2·3. `tasks` 길이로 페이지 수를 계산하지 않는다

## Mock S5 — 빈 목록

- Mock response: HTTP 200, `{ "tasks": [], "totalPageSize": 0 }`
- 기대 결과: `등록된 업무가 없습니다.` 빈 상태, 오류 화면 아님.
  총 페이지가 1 이하면 페이지 버튼을 그리지 않는 기존 표 동작을 유지한다

## Mock S6 — 로딩 상태

- Mock response: 지연된 HTTP 200 성공 body
- 기대 결과: 응답 전 `업무를 불러오는 중입니다.` 표시, 응답 후 표로 교체

## Mock S7 — 유효하지 않은 요청

- Mock response: HTTP 400 오류 body
- 기대 결과: `업무를 불러오지 못했습니다. 다시 시도해 주세요.` 오류 화면,
  빈 목록이나 mock 데이터로 대체하지 않음

## Mock S8 — 인증 오류

- Mock response: HTTP 401 오류 body
- 기대 결과: 오류 화면 표시, 자동 이동 없음

## Mock S9 — 서버 오류

- Mock response: HTTP 500 오류 body
- 기대 결과: 오류 화면 표시

## Mock S10 — Contract 응답 형식 위반

- Mock response: HTTP 200, `{ "items": [], "total": 1 }`
- 기대 결과: 성공 처리하지 않고 오류 화면

## Mock S11 — 허용값 밖의 status

- Mock response: HTTP 200, `tasks[0].status = "DONE"`
- 기대 결과: 성공 처리하지 않고 오류 화면(빈 라벨 pill을 그리지 않는다)

## Mock S12 — 삭제 후 목록 재조회

- Mock request: `DELETE /api/tasks/12` → 200 `{ "message": "..." }`,
  이후 `GET /api/tasks`
- 사용자 동작: 첫 행 케밥 → `삭제` → 다이얼로그 `확인`
- 기대 결과: 삭제 후 GET 재요청 1회, 재조회 응답(2건)이 표에 반영,
  `데이터 삭제에 성공했습니다` 토스트. localStorage 삭제 기록에 의존하지 않음

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
- 요청에 `sort`를 포함하지 않음
- 공통 Axios와 기존 인증 interceptor 사용
- loading / error / empty 상태가 서로 구분되어 표시됨
- 실패 시 localStorage mock 목록으로 fallback하지 않음
- Staging 실제 서버 테스트는 실행하지 않음
