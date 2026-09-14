# API Test Scenarios — app-work-report-approve

공통 사전 조건: `accessToken`을 localStorage에 넣는다. 목록
`GET /work-report`와 상세 `GET /work-report/detail/{id}`는 각 승인
시나리오의 body 형태로 route mock 한다(`size=10`, 시작 건수
`pendingCount: 7`, `approvedCount: 3`, `rejectedCount: 2`). 목록 mock은 승인된 id를 기억해
재조회 시 `심사대기` 행에서 빼고 `pendingCount`를 1 줄이고
`approvedCount`를 1 늘린다.

## Mock S1 — 목록 케밥에서 승인 성공

- 목적: 행 id로 한 번 승인하고 목록에 머물며 결과를 보인다.
- Mock request: `PATCH /work-report/approve/32`
- Request headers: `Authorization: Bearer …`
- Request query/body: 없음
- Mock response: HTTP 200, `{"message":"업무 보고가 승인되었습니다."}`
- 사용자 동작: `/task-reports` → `이승현` 행 `⋮` → `승인하기`
- 기대 결과: PATCH 1회, body 없음. `승인에 성공했습니다` 토스트. 목록 재조회(`GET /work-report` 추가 1회) 후 `이승현` 행이 사라지고 탭 `심사대기 6`·`완료 4`. 해당 행이 없어져 초점 복귀 대상이 없어도 오류 없음

## Mock S2 — 상세에서 승인 성공과 이동

- Mock request: `PATCH /work-report/approve/32`
- Mock response: HTTP 200 성공 body
- 사용자 동작: `/task-reports/32` → `승인하기`
- 기대 결과: PATCH 1회, `/task-reports`로 이동, `승인에 성공했습니다` 토스트, 탭 `심사대기 6`

## Mock S3 — 업무관리 캐시 무효화

- 사전 조건: `/tasks/12` 방문으로 `GET /tasks/12` 캐시 생성 후 `/task-reports/32`로 이동
- 사용자 동작: `승인하기` 성공 → 브라우저 뒤로 `/tasks/12` 재방문
- 기대 결과: `GET /tasks/12`가 다시 요청됨

## Mock S4 — 목록 승인 중 인증 오류

- 사전 조건: `refreshToken` 없음
- Mock response: HTTP 401 Contract 오류 body
- 사용자 동작: 목록 케밥 `승인하기`
- 기대 결과: 공통 세션 처리(`app-auth-reissue` 승인 시나리오 S6)에 따라 재발급 요청 없이 `/login`으로 이동. `승인에 성공했습니다` 토스트 없음, 목록 캐시 재요청 없음

## Mock S5 — 상세 승인 실패(존재하지 않음)

- Mock response: HTTP 404 Contract 오류 body
- 사용자 동작: `/task-reports/32` → `승인하기`
- 기대 결과: 상세 유지, `승인에 실패했습니다` 토스트, 버튼 다시 활성

## Mock S6 — 이미 승인된 보고

- Mock response: HTTP 409, `message: "이미 승인된 업무관리입니다."` Contract 오류 body
- 사용자 동작: 상세 `승인하기`
- 기대 결과: 상세 유지, `승인에 실패했습니다` 토스트. 서버 message는 표시하지 않음

## Mock S7 — 서버 오류

- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: 목록 케밥 `승인하기`
- 기대 결과: `승인에 실패했습니다` 토스트, 다시 시도하면 PATCH 2회째 전송

## Mock S8 — 처리 중 중복 요청 차단

- Mock response: 1초 지연된 HTTP 200 성공 body
- 사용자 동작: 상세 `승인하기` 연속 클릭
- 기대 결과: 처리 중 `반려하기`·`승인하기` 비활성, PATCH 1회, 응답 후 목록 이동

## Mock S9 — 목록 처리 중 다른 행 메뉴 차단

- Mock response: 1초 지연된 HTTP 200 성공 body
- 사용자 동작: 목록 케밥 `승인하기` 직후 다른 행 `⋮` 클릭
- 기대 결과: 메뉴가 열리지 않음, PATCH 1회

## Mock S10 — Contract 응답 형식 위반

- Mock response: HTTP 200, `{"result":"ok"}`
- 기대 결과: 성공 처리하지 않음, `승인에 실패했습니다` 토스트

## Mock S11 — 승인되지 않은 성공 Status 거부

- Mock response: HTTP 204, body 없음
- 기대 결과: 성공 처리하지 않음, `승인에 실패했습니다` 토스트

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
- 승인 Contract 밖의 request/response 필드 없음(요청 body 없음)
- 승인 API는 공통 Axios와 기존 인증 interceptor 사용
- 실패 시 localStorage mock 성공으로 fallback하지 않음
- localStorage 테스트 제어 키(`mutation-delay`, `mutation-log`, `fail`)를 쓰지 않음
- Staging 실제 서버 테스트는 실행하지 않음
