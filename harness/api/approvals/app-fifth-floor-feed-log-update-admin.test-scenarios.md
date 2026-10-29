# API Test Scenarios — app-fifth-floor-feed-log-update-admin

공통 사전 조건: `support/feed-api`의 `mockFeedApi`가 5층 가짜 서버를 함께 띄운다. 5층 기본 데이터는 퍼블리싱 mock과 같다 —
오늘 12건(급여일지 id 1–12, 10번 = 오스카 · 오돌이, 개체 id 10, 펠렛 15 GML, 박도현) + 오돌이 어제 1건(id 101, 이서준).
나머지 개체 id는 500번대. 개체 조회는 `support/animal-manage-api`. 오류 body는 Contract 형식 `{ message, status, timestamp, description }`.

사용자는 `/feeds/fifth-floor/10/edit`로 바로 들어온다(저장 뒤 `/feeds/fifth-floor/10`로 돌아간다).

## Mock S1 — 수정 저장

- 사용자 동작: 먹이 종류 `냉동새우`, 급여량 `20` → 저장
- Mock request: PUT `/feed-log/fifth-floor/admin/10`, Bearer, body `{ "feedDate": "<오늘>", "feedType": "냉동새우", "feedAmount": 20, "feedUnit": "GML" }`
- 기대 결과: PUT 1회, `/feeds/fifth-floor/10`으로 이동, `데이터 수정에 성공했습니다` 토스트, 상세가 새 값(`냉동새우`, `20 g/ml`)을 보여준다(상세 GET 재요청).

## Mock S2 — 원본 단위·날짜 유지와 공백 제거

- 사전 조건: 상세 응답 `feedUnit: "KGL"`, `feedAmount: 1.2`, `feedDate: "2026-10-01"`
- 사용자 동작: 먹이 종류 `  펠렛 ` → 저장
- 기대 결과: body `{ feedDate: "2026-10-01", feedType: "펠렛", feedAmount: 1.2, feedUnit: "KGL" }`

## Mock S3 — 검증 실패

- 사용자 동작: 먹이 종류 비움 → 저장
- 기대 결과: PUT 요청 없음, `먹이 종류를 입력해주세요!`

## Mock S4 — 없는 기록(404)·서버 오류(500)·응답 형식 오류

- Mock response: 404 / 500 / 200 `{}`
- 기대 결과: 폼 유지, 입력 보존, `저장하지 못했습니다. 다시 시도해 주세요.`, 경로 그대로

## Mock S5 — 중복 제출 방지

- 사전 조건: PUT 응답 지연
- 사용자 동작: 저장 버튼 연속 클릭
- 기대 결과: PUT 1회, 응답 전까지 `저장 중` 비활성
