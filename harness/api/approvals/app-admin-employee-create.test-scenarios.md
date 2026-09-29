# API Test Scenarios — app-admin-employee-create

공통 사전 조건: `support/employee-api` 가 GET `/app/admin/employees` 에 픽스처 12명(1번 김수인 `suin.kim` 2026-07-03 … 12번 임다은)을
응답하고 `/settings/accounts` 에 진입한다. 픽스처의 `passwordChanged` 는 1·2·4번 true, 3·5번 false 다(Figma 배지 값). 오류 body 는 Contract 형식 `{ message, status, timestamp, description }`, 그 밖의 https 요청은 abort.

## Mock S1 — 생성 성공
- 사용자 동작: `계정 생성하기` → 이름 ` 김직원 `, 아이디 ` employee01 ` → `계정 생성`
- Mock request: POST `/app/admin/employees` body `{ "username": "employee01", "name": "김직원" }`, Bearer
- Mock response: 201 `{ "message": "직원이 생성되었습니다." }`
- 기대 결과: POST 1회, 모달 닫힘, `계정 생성에 성공했습니다`, 목록 재조회 후 `김직원` 행이 보이고 `총 13명`

## Mock S2 — 아이디 중복(409)
- 기대 결과: 모달 유지, `이미 사용 중인 아이디예요`, 아이디 포커스, 목록 그대로

## Mock S3 — 400·500
- 기대 결과: 모달·입력 유지, `데이터 생성에 실패했습니다`

## Mock S4 — 201 이 아닌 성공 status(200)
- 기대 결과: S3 과 같은 실패 표시(실제 서버 응답대로 201 만 성공)

## Mock S5 — 형식이 다른 성공 응답(201 `{}`)
- 기대 결과: S3 과 같은 실패 표시

## Mock S6 — 검증 실패와 중복 제출
- 기대 결과: 빈 값이면 요청 없음. 응답 지연 중 연타해도 POST 1회
