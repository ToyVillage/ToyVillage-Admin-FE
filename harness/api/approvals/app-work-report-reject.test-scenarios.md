# API Test Scenarios — app-work-report-reject

공통 사전 조건: `accessToken`을 localStorage에 넣는다. 목록
`GET /work-report`와 상세 `GET /work-report/detail/{id}`는 각 승인
시나리오의 body 형태로 route mock 한다(`size=10`, 시작 건수
`pendingCount: 7`, `approvedCount: 3`, `rejectedCount: 2`). 목록 mock은 반려된 id를 기억해
재조회 시 `심사대기` 행에서 빼고 `pendingCount`를 1 줄이고
`rejectedCount`를 1 늘린다.

## Mock S1 — 목록 케밥에서 반려 성공

- 목적: 공백을 제거한 사유를 body로 한 번 보내고 목록에 머문다.
- Mock request: `PATCH /work-report/reject/32`
- Request headers: `Authorization: Bearer …`, `Content-Type: application/json`
- Request body: `{"rejectionReason":"근거 자료가 빠졌습니다."}`
- Request query: 없음
- Mock response: HTTP 200, `{"message":"업무 보고가 반려되었습니다."}`
- 사용자 동작: `/task-reports` → `이승현` 행 `⋮` → `반려하기` → 사유 `  근거 자료가 빠졌습니다.  ` 입력 → `확인`
- 기대 결과: PATCH 1회, body가 정확히 위 JSON(앞뒤 공백 제거, 다른 필드 없음). 모달 닫힘, `반려에 성공했습니다` 토스트, 목록 재조회 후 탭 `심사대기 6`·`반려 3`

## Mock S2 — 상세에서 반려 성공과 이동

- Mock request: `PATCH /work-report/reject/32`, body `{"rejectionReason":"안전 점검 항목 일부가 누락되었습니다."}`
- Mock response: HTTP 200 성공 body
- 사용자 동작: `/task-reports/32` → `반려하기` → 사유 입력 → `확인`
- 기대 결과: PATCH 1회, `/task-reports`로 이동, `반려에 성공했습니다` 토스트

## Mock S3 — 빈 사유는 요청하지 않는다

- 사용자 동작: 모달에서 공백만 입력
- 기대 결과: `확인` 비활성, PATCH 0회

## Mock S4 — 1000자 제한

- 사용자 동작: 모달에 1001자 붙여넣기
- 기대 결과: 입력란 값 길이 1000. `확인` 시 body `rejectionReason` 길이 1000

## Mock S5 — 모달 이탈 시 요청 없음

- 사용자 동작: 목록·상세 각각 모달을 열고 `Esc` 또는 바깥 클릭
- 기대 결과: 모달 닫힘, PATCH 0회, 행·배지 유지

## Mock S6 — 사유 누락 400

- Mock response: HTTP 400, `message: "반려 사유를 입력해주세요."` Contract 오류 body
- 사용자 동작: 상세에서 사유 입력 후 `확인`
- 기대 결과: 모달 닫힘, 상세 유지, `반려에 실패했습니다` 토스트. 서버 message는 표시하지 않음

## Mock S7 — 1000자 초과 400

- Mock response: HTTP 400, `message: "반려 사유를 1000자 이하로 입력해주세요."` Contract 오류 body
- 사용자 동작: 목록 케밥 반려
- 기대 결과: 모달 닫힘, `반려에 실패했습니다` 토스트, 행 유지

## Mock S8 — 인증 오류

- 사전 조건: `refreshToken` 없음
- Mock response: HTTP 401 Contract 오류 body
- 사용자 동작: 상세에서 사유 입력 후 `확인`
- 기대 결과: 공통 세션 처리(`app-auth-reissue` 승인 시나리오 S6)에 따라 재발급 요청 없이 `/login`으로 이동. `반려에 성공했습니다` 토스트 없음

## Mock S9 — 존재하지 않는 보고

- Mock response: HTTP 404 Contract 오류 body
- 기대 결과: `반려에 실패했습니다` 토스트

## Mock S10 — 이미 반려된 보고

- Mock response: HTTP 409, `message: "이미 반려된 업무관리입니다."` Contract 오류 body
- 기대 결과: `반려에 실패했습니다` 토스트

## Mock S11 — 서버 오류와 재시도

- Mock response: 첫 요청 HTTP 500 Contract 오류 body, 두 번째 HTTP 200
- 사용자 동작: 목록 케밥 반려 → 실패 → 다시 반려
- 기대 결과: 첫 번째 `반려에 실패했습니다`, 두 번째 `반려에 성공했습니다`, PATCH 총 2회

## Mock S12 — 처리 중 중복 확인 차단과 초점 유지

- Mock response: 1초 지연된 HTTP 200 성공 body
- 사용자 동작: 모달 `확인` 연속 클릭
- 기대 결과: 처리 중 입력란 읽기 전용, `확인` 비활성, 초점이 모달 안에 머묾, PATCH 1회

## Mock S13 — Contract 응답 형식 위반

- Mock response: HTTP 200, `{"result":"ok"}`
- 기대 결과: 성공 처리하지 않음, `반려에 실패했습니다` 토스트

## Mock S14 — 승인되지 않은 성공 Status 거부

- Mock response: HTTP 201, `{"message":"업무 보고가 반려되었습니다."}`
- 기대 결과: 성공 처리하지 않음, `반려에 실패했습니다` 토스트

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
- 승인 Contract 밖의 request/response 필드 없음(body는 `rejectionReason`만)
- 반려 API는 공통 Axios와 기존 인증 interceptor 사용
- 실패 시 localStorage mock 성공으로 fallback하지 않음
- 반려 사유를 localStorage에 저장하지 않음
- Staging 실제 서버 테스트는 실행하지 않음
