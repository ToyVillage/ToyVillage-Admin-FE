# API Test Scenarios — task-delete

공통 사전 조건: `accessToken`을 localStorage에 넣고 mock 상세 `/tasks/1`
(제목 `업무 제목`, id `1`)로 진입한다. 목록·상세 조회는 localStorage mock을
그대로 사용한다.

## Mock S1 — 삭제 성공과 이동

- 목적: route ID로 업무를 한 번 삭제하고 목록으로 이동해 성공 토스트를 본다.
- Mock request: `DELETE /api/tasks/1`
- Request headers: `Authorization: Bearer …`
- Request query/body: 없음
- Mock response: HTTP 200, `{"message":"업무지시가 삭제되었습니다."}`
- 사용자 동작: `삭제하기` → 다이얼로그 `확인`
- 기대 결과: DELETE 정확히 1회, body null, query 없음, `/tasks`로 이동,
  `데이터 삭제에 성공했습니다` 토스트 표시

## Mock S2 — 유효하지 않은 요청

- Mock response: HTTP 400 Contract 오류 body
- 기대 결과: `/tasks/1` 유지, 다이얼로그 닫힘,
  `데이터 삭제에 실패했습니다` 토스트, `삭제하기` 다시 활성. 다시 확인하면
  DELETE 2회째 전송

## Mock S3 — 인증 오류

- Mock response: HTTP 401 Contract 오류 body
- 기대 결과: 상세 화면과 입력값(제목 `업무 제목`) 유지, 실패 토스트

## Mock S4 — 권한 없음

- Mock response: HTTP 403, `message: ""` 포함 Contract 오류 body
- 기대 결과: 상세 화면 유지, 실패 토스트, 목록 이동 없음

## Mock S5 — 존재하지 않는 업무

- Mock request: `DELETE /api/tasks/2` (`/tasks/2`에서 진행)
- Mock response: HTTP 404 Contract 오류 body
- 기대 결과: 삭제 성공으로 처리하지 않고 실패 토스트

## Mock S6 — 서버 오류

- Mock response: HTTP 500 Contract 오류 body
- 기대 결과: 상세 화면 유지, 실패 토스트, 재시도 가능

## Mock S7 — 중복 삭제 방지

- Mock response: 지연된 HTTP 200 성공 body
- 사용자 동작: 확인 버튼 연속 클릭
- 기대 결과: DELETE 요청 1회, 응답 후 `/tasks` 이동

## Mock S8 — Contract 응답 형식 위반

- Mock response: HTTP 200, `{"result":"ok"}`
- 기대 결과: 성공 처리하지 않음, 상세 화면 유지, 실패 토스트

## Mock S9 — 승인되지 않은 성공 Status 거부

- Mock response: HTTP 201, `{"message":"업무지시가 삭제되었습니다."}`
- 기대 결과: 성공 처리하지 않음, 상세 화면 유지, 실패 토스트

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
- 삭제 API는 공통 Axios와 기존 인증 interceptor 사용
- 실패 시 localStorage mock 삭제로 fallback하지 않음
- 생성·수정·조회 mock 동작은 변경하지 않음
- Staging 실제 서버 테스트는 실행하지 않음
