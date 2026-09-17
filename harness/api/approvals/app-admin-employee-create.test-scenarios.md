# API Test Scenarios — app-admin-employee-create

공통 사전 조건: localStorage에 `accessToken` 저장 후 `/settings/accounts/create` 진입.
`POST **/app/admin/employees`를 `page.route()`로 mock 한다. 성공 body
`{ "message": "직원이 생성되었습니다." }`(201). 오류 body는 Contract 형식
`{ message, status, timestamp, description }`을 쓴다. 그 외 https 요청은 abort 한다.

## Mock S1 — 생성 성공

- 사용자 동작: 이름 `  김직원 `, 아이디 ` employee01 ` 입력 → `계정 생성`
- Mock request: `POST /app/admin/employees` body `{ "username": "employee01", "name": "김직원" }`, `Authorization: Bearer <token>`
- Mock response: HTTP 201
- 기대 결과: POST 1회, `계정이 생성되었습니다` 토스트, 두 입력 비움, 이름 포커스

## Mock S2 — 아이디 중복(409)

- Mock response: HTTP 409(`이미 사용 중인 앱 관리자 아이디입니다.`)
- 기대 결과: `이미 사용 중인 아이디입니다` 토스트, 입력 유지

## Mock S3 — 입력 오류(400)·서버 오류(500)

- 기대 결과: `계정 생성에 실패했습니다` 토스트, 입력 유지

## Mock S4 — 201이 아닌 성공 status

- Mock response: HTTP 200 성공 body
- 기대 결과: S3과 같은 실패 표시(Contract status 201만 성공)

## Mock S5 — 형식이 다른 성공 응답

- Mock response: HTTP 201 body `{}`
- 기대 결과: S3과 같은 실패 표시

## Mock S6 — 중복 제출 방지

- Mock response: 지연된 HTTP 201
- 사용자 동작: Enter 연타 + 버튼 클릭
- 기대 결과: POST 1회, 성공 토스트

## Mock S7 — 필수값 미입력

- 사용자 동작: 빈 값으로 `계정 생성`
- 기대 결과: POST 없음

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
- 승인 Contract의 status와 body만 사용(밖의 필드 없음)
- 공통 Axios와 기존 인증 interceptor 사용
- 실패 시 mock으로 fallback하지 않음
- Staging 실제 서버 테스트는 실행하지 않음
