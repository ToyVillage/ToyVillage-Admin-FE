# API Test Scenarios — app-admin-employee-password-reset

공통 사전 조건: `support/employee-api` 가 GET `/app/admin/employees` 에 픽스처 12명(1번 김수인 `suin.kim` 2026-07-03 … 12번 임다은)을
응답하고 `/settings/accounts` 에 진입한다. 픽스처의 `passwordChanged` 는 1·2·4번 true, 3·5번 false 다(Figma 배지 값). 오류 body 는 Contract 형식 `{ message, status, timestamp, description }`, 그 밖의 https 요청은 abort.

## Mock S1 — 초기화 성공
- 사용자 동작: `김수인` 케밥 → `비밀번호 초기화` → `초기화`
- 기대 결과: PATCH `/app/admin/employees/1/password` 1회(Bearer, 본문 없음), 모달 닫힘, `비밀번호 초기화에 성공했습니다`, 목록 재조회 후 `김수인` 배지가 `초기 비밀번호`

## Mock S2 — 취소
- 기대 결과: PATCH 없음

## Mock S3 — 404·500
- 기대 결과: 모달 닫힘, `비밀번호 초기화에 실패했습니다`, 초점은 그 행 케밥

## Mock S4 — 중복 방지
- 사전 조건: PATCH 응답 지연
- 기대 결과: `초기화` 연타해도 PATCH 1회, 응답 전 버튼 `초기화 중` 비활성
