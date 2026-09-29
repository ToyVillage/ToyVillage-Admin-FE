# API Test Scenarios — app-work-report-query-all

공통 사전 조건: `accessToken`을 localStorage에 넣고 `/task-reports`로 진입한다.
`GET /work-report`는 `page.route()`로 가로채고, 요청 query의 `status`·`page`에
따라 아래 데이터로 응답한다. 한 페이지는 `size=10`이다.

| 탭 | `status` | 건수 필드 | 데이터 | `totalPageSize` |
| --- | --- | --- | --- | --- |
| 심사대기 | `PENDING` | `pendingCount: 3` | 3건 | 1 |
| 완료 | `APPROVED` | `approvedCount: 12` | 1페이지 10건, 2페이지 2건 | 2 |
| 반려 | `REJECTED` | `rejectedCount: 2` | 2건 | 1 |

모든 응답의 건수 필드는 필터와 무관하게 `3`/`12`/`2`로 같다.
조회 오류는 공통 QueryClient `retry: 1`로 한 번 더 요청한 뒤 오류 화면이 뜬다.
오류 시나리오의 요청 횟수는 2회까지 허용한다.

`심사대기` 1페이지 `reports`

```json
[
  { "id": 32, "taskId": 12, "name": "이승현", "title": "9월 정기 안전점검", "status": "PENDING", "priority": "HIGH", "finishDate": "2026-07-03" },
  { "id": 35, "taskId": 13, "name": "김수인", "title": "사료 재고 정리", "status": "PENDING", "priority": "LOW", "finishDate": "2026-07-01" },
  { "id": 36, "taskId": 14, "name": "이지아", "title": "급수설비 점검", "status": "PENDING", "priority": "MEDIUM", "finishDate": "2026-07-28" }
]
```

## Mock S1 — 진입 요청과 목록 표시

- 목적: 진입 시 한 번 조회하고 서버 목록을 표에 그린다.
- Mock request: `GET /work-report?page=1&size=10&status=PENDING`
- Request headers: `Authorization: Bearer …`
- Request body: 없음. `sort` query 없음
- Mock response: HTTP 200, 위 `심사대기` 1페이지 body
- 사용자 동작: `/task-reports` 진입
- 기대 결과: 요청 1회, query가 정확히 `page=1`, `size=10`, `status=PENDING`. 표 3행에 담당자 `이승현`·`김수인`·`이지아`, 상태 배지 `심사대기`, 우선순위 배지, 완료기한 `2026-07-03` 등 표시. `title`은 표에 없음

## Mock S2 — 탭 건수는 응답 건수를 그대로 쓴다

- Mock response: S1 body (`pendingCount: 3`, `approvedCount: 12`, `rejectedCount: 2`)
- 기대 결과: 탭 라벨 `심사대기 3`, `완료 12`, `반려 2`. `완료` 건수는 `심사대기` 목록에 없는 값이므로 응답에서 온 것이다

## Mock S3 — 페이지 이동은 서버 page를 보낸다

- 사전 동작: `완료` 탭 클릭 → `GET /work-report?page=1&size=10&status=APPROVED`, 10행 표시, 페이지 버튼 1·2
- 사용자 동작: 페이지네이션 `2` 클릭
- Mock request: `GET /work-report?page=2&size=10&status=APPROVED`
- Mock response: HTTP 200, `APPROVED` 2건, `totalPageSize: 2`
- 기대 결과: 요청 query `page=2`, 2페이지 2행 표시, 페이지 2 활성

## Mock S4 — 탭 전환은 status 필터로 재요청하고 1페이지로 돌아간다

- 사전 동작: S3처럼 `완료` 2페이지로 이동
- 사용자 동작: `반려` 탭 클릭
- Mock request: `GET /work-report?page=1&size=10&status=REJECTED`
- Mock response: HTTP 200, `REJECTED` 2건, `totalPageSize: 1`
- 기대 결과: 요청 query `page=1`·`status=REJECTED`, 표 배지 `반려`, 페이지 1개

## Mock S5 — 페이지 전환 중 직전 결과 유지

- Mock response: `완료` 2페이지 요청을 1초 지연
- 사용자 동작: `완료` 탭에서 페이지네이션 `2` 클릭 직후
- 기대 결과: `업무보고를 불러오는 중입니다.` 전체 로딩 화면이 뜨지 않고 탭과 1페이지 10행이 남아 있음. 응답 후 2페이지 2행으로 바뀜

## Mock S6 — 빈 목록

- Mock response: HTTP 200, `{ "reports": [], "totalPageSize": 0, "pendingCount": 0, "approvedCount": 0, "rejectedCount": 0 }`
- 기대 결과: `등록된 업무보고가 없습니다.`, 탭 `심사대기 0`·`완료 0`·`반려 0`, 페이지 1개

## Mock S7 — 행 클릭 이동

- 사용자 동작: `이승현` 행 클릭
- 기대 결과: `/task-reports/32`로 이동

## Mock S8 — 유효하지 않은 요청

- Mock response: HTTP 400 Contract 오류 body
- 기대 결과: `업무보고를 불러오지 못했습니다. 다시 시도해 주세요.` 오류 화면. mock 데이터·빈 표로 대체하지 않음

## Mock S9 — 인증 오류

- 사전 조건: `refreshToken` 없음
- Mock response: HTTP 401 Contract 오류 body
- 기대 결과: 공통 세션 처리(`app-auth-reissue` 승인 시나리오 S6)에 따라 재발급 요청 없이 `/login`으로 이동, 표 없음

## Mock S10 — 서버 오류

- Mock response: HTTP 500 Contract 오류 body
- 기대 결과: 오류 화면, 표 없음

## Mock S11 — 응답 형식 위반

- Mock response: HTTP 200, `reports[0].status: "MISSING"` (허용값 밖)
- 기대 결과: 오류 화면
- 추가: HTTP 200, `pendingCount` 누락 → 오류 화면

## Mock S12 — 로딩 상태

- Mock response: 최초 요청을 1초 지연
- 기대 결과: 응답 전 `업무보고를 불러오는 중입니다.` 표시, 응답 후 표 표시

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
- 승인 Contract 밖의 request/response 필드 없음(`sort` 미전송)
- 조회는 공통 Axios와 기존 인증 interceptor 사용
- 오류 시 localStorage mock 목록으로 fallback하지 않음
- loading/error/success 상태가 숨겨지지 않음
- Staging 실제 서버 테스트는 실행하지 않음
