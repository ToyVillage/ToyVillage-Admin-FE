# API Test Scenarios — app-feed-log-update-admin

공통 사전 조건: `support/feed-api` 기본 mock(급여 기록 1 = 표범·레오, 생닭 1.2, `feedDateTime` `<오늘>T09:30:00`,
특이사항 `평소보다 식욕이 왕성함. 잔반 없음.`)에 `PUT **/feed-log/admin/1`(200 `{ "message": "급여일지가 수정되었습니다." }`)을 더하고
`/feeds` 목록 → 1행 케밥 `수정` 으로 `/feeds/1/edit` 에 진입한다. 오류 body 는 Contract 형식 `{ message, status, timestamp, description }`.

## Mock S1 — 수정 저장

- 사용자 동작: 먹이 종류 `닭가슴살`, 급여량 `2.5kg`, 특이사항 `잔반 조금 남김` → 저장
- Mock request: PUT `/feed-log/admin/1`, Bearer 헤더, body
  `{ "feedDateTime": "<오늘>T09:30:00", "feedType": "닭가슴살", "feedAmount": 2.5, "significant": "잔반 조금 남김" }`
- 기대 결과: PUT 1회, 목록 이동, `데이터 수정에 성공했습니다` 토스트, 목록 GET 재요청

## Mock S2 — 급여량 표기 변환과 공백 제거

- 사용자 동작: 먹이 종류 `  생닭 `, 급여량 `2 kg`, 특이사항 비움 → 저장
- 기대 결과: body `feedType: "생닭"`, `feedAmount: 2`, `significant: ""`, `feedDateTime` 원본 유지

## Mock S3 — 변경 없이 저장

- 사용자 동작: 아무것도 바꾸지 않고 저장
- 기대 결과: 원래 값 그대로 PUT 1회(`feedAmount: 1.2`)

## Mock S4 — 검증 실패

- 사용자 동작: 먹이 종류 비움 → 저장
- 기대 결과: PUT 요청 없음, 기존 인라인 오류

## Mock S5 — 없는 기록(404)·서버 오류(500)

- 기대 결과: 폼 유지, 입력 보존, `저장하지 못했습니다. 다시 시도해 주세요.`, 목록 이동 없음
- 403 은 이 서버에서 만료 토큰 응답이라 공통 인터셉터(재발급 → 실패 시 `/login`) 규칙을 따른다. 화면 고유 동작이 아니어서 이 시나리오에서 뺀다
  (2026-09-28 구현 중 발견 — 승인 시나리오와 spec 의 403 규칙이 충돌해 시나리오를 고쳤다).

## Mock S6 — 응답 형식 오류

- Mock response: 200 `{}`(message 없음)
- 기대 결과: S5 와 같은 실패 표시

## Mock S7 — 중복 제출 방지

- 사전 조건: PUT 응답 지연
- 사용자 동작: 저장 버튼 연속 클릭
- 기대 결과: PUT 1회, 응답 전까지 버튼 `저장 중` 비활성

## Mock S8 — 수정 후 상세 재조회

- 사용자 동작: S1 저장 후 목록에서 1행을 눌러 상세로 이동
- 기대 결과: 저장(PUT) 이후 상세 GET 을 한 번 이상 다시 요청한다(캐시된 옛 값을 쓰지 않는다).
  재요청 시점은 저장 직후(수정 화면이 아직 떠 있을 때)일 수도, 상세 진입 시일 수도 있다.
