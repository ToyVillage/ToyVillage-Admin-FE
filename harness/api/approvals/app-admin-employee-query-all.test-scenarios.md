# API Test Scenarios — app-admin-employee-query-all

공통 사전 조건: `support/employee-api` 가 GET `/app/admin/employees` 에 픽스처 12명(1번 김수인 `suin.kim` 2026-07-03 … 12번 임다은)을
응답하고 `/settings/accounts` 에 진입한다. 픽스처의 `passwordChanged` 는 1·2·4번 true, 3·5번 false 다(Figma 배지 값). 오류 body 는 Contract 형식 `{ message, status, timestamp, description }`, 그 밖의 https 요청은 abort.

## Mock S1 — 목록 표시
- 기대 결과: GET 1회(Bearer), 첫 행 `김수인` · `suin.kim` · `변경 완료` · `2026.07.03`, 3번째 행 `이지아` 는 `초기 비밀번호`, 5행, `총 12명`, 머리행 `이름` / `비밀번호` / `계정 생성일`

## Mock S2 — 검색·페이지는 화면에서 거른다
- 사용자 동작: 2페이지 이동, 검색어 `jia`
- 기대 결과: GET 추가 요청 없음, 각각 6~10번째 행 / `이지아` 1행

## Mock S3 — 조회 실패(500)·형식 오류
- 기대 결과: 표 대신 `직원 목록을 불러오지 못했습니다. 다시 시도해 주세요.`

## Mock S4 — 빈 목록
- Mock response: `[]`
- 기대 결과: `총 0명`, 페이지네이션 없음
