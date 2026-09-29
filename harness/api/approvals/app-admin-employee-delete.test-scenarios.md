# API Test Scenarios — app-admin-employee-delete

공통 사전 조건: `support/employee-api` 가 GET `/app/admin/employees` 에 픽스처 12명(1번 김수인 `suin.kim` 2026-07-03 … 12번 임다은)을
응답하고 `/settings/accounts` 에 진입한다. 픽스처의 `passwordChanged` 는 1·2·4번 true, 3·5번 false 다(Figma 배지 값). 오류 body 는 Contract 형식 `{ message, status, timestamp, description }`, 그 밖의 https 요청은 abort.

## Mock S1 — 삭제 성공
- 사용자 동작: `이승현` 케밥 → `삭제` → `확인`
- 기대 결과: DELETE `/app/admin/employees/2` 1회(Bearer), 모달 닫힘, `데이터 삭제에 성공했습니다`, 목록 재조회 후 `이승현` 행 없음, `총 11명`

## Mock S2 — 취소
- 기대 결과: DELETE 없음, 행 유지

## Mock S3 — 404·500
- 기대 결과: 모달 닫힘, `데이터 삭제에 실패했습니다`, 행 유지, 초점 복귀

## Mock S4 — 중복 방지
- 사전 조건: DELETE 응답 지연
- 기대 결과: DELETE 1회

## Mock S5 — 마지막 페이지를 비우면 앞 페이지로
- 사용자 동작: `?page=3`(2행)에서 두 행 삭제
- 기대 결과: DELETE 2회, 2페이지 5행, `총 10명`
