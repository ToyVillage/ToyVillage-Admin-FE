# API Test Scenarios — close-dat-query-by-date

## Mock S1 — 날짜별 정상 조회

- 목적: 상세 route date를 query parameter로 전달하고 휴관 정보를 표시한다.
- Mock request: `GET /api/close-day?date=2026-07-13`
- Mock response: HTTP 200, 휴관 일정 1건 배열
- 사용자 동작: `/notices/guide/hours/2026-07-13` 진입
- 기대 결과: `date=2026-07-13` GET 요청 1회,
  `7월 13일 영업시간`과 `휴관 일정: 정기 휴관` 표시

## Mock S2 — 빈 결과

- 목적: 휴관 일정이 없는 성공 응답을 오류와 구분한다.
- Mock request: `GET /api/close-day?date=2026-07-14`
- Mock response: HTTP 200, `[]`
- 사용자 동작: `/notices/guide/hours/2026-07-14` 진입
- 기대 결과: 기존 영업시간 상세 UI 표시, 휴관 일정 보조 정보 없음

## Mock S3 — 정의되지 않은 HTTP 404

- 목적: Contract에서 제거한 HTTP 404를 빈 결과로 해석하지 않는다.
- Mock request: `GET /api/close-day?date=2026-07-13`
- Mock response: HTTP 404
- 사용자 동작: 날짜 상세 화면 진입
- 기대 결과: 휴관일 조회 실패 alert 표시, 영업시간 입력 폼 미표시

## Mock S4 — 서버 오류

- 목적: 오류를 빈 배열로 숨기지 않는다.
- Mock request: `GET /api/close-day?date=2026-07-13`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: 날짜 상세 화면 진입
- 기대 결과: 휴관일 조회 실패 alert 표시, 영업시간 입력 폼 미표시

## Mock S5 — 잘못된 route date

- 목적: 유효하지 않은 날짜를 서버로 보내지 않는다.
- Mock request: 없음
- Mock response: 없음
- 사용자 동작: `/notices/guide/hours/2026-02-30` 진입
- 기대 결과: API 요청 없이 `/notices/guide`로 replace 이동

## Mock S6 — 잘못된 성공 응답

- 목적: Contract 밖의 응답을 상세 데이터로 사용하지 않는다.
- Mock request: `GET /api/close-day?date=2026-07-13`
- Mock response: HTTP 200, 필수 필드가 누락된 배열
- 사용자 동작: 날짜 상세 화면 진입
- 기대 결과: 조회 실패 alert 표시, 잘못된 휴관 정보와 영업시간 폼 미표시

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
- query parameter는 `date` 하나만 사용
- 승인 Contract 밖의 필드 없음
- loading/error/success 상태가 숨겨지지 않음
- 기존 운영시간 편집 동작은 유지
