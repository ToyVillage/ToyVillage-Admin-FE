# API Test Scenarios — open-time-query-by-date

## Mock S1 — 정상 조회

- 목적: route 날짜 조회 결과가 폼 초기값에 표시되는지 확인
- Mock request: `GET /api/open-time/2026-07-01`
- Mock response: HTTP `201`, 승인된 운영시간 객체
- 사용자 동작: `/notices/guide/hours/2026-07-01` 진입
- 기대 결과: 영업 시작 `09:00`, 영업 종료 `18:00` 표시

## Mock S2 — 서버 오류

- 목적: 조회 오류를 기본 영업시간으로 숨기지 않는지 확인
- Mock request: `GET /api/open-time/2026-07-01`
- Mock response: HTTP `500`, 승인된 공통 오류 객체
- 사용자 동작: 운영시간 상세 route 진입
- 기대 결과: 접근 가능한 오류 alert 표시, 폼 미표시

## Mock S3 — 잘못된 성공 응답

- 목적: Contract 필수 필드가 누락된 응답을 거부하는지 확인
- Mock request: `GET /api/open-time/2026-07-01`
- Mock response: HTTP `201`, `endOpenTime` 누락 객체
- 사용자 동작: 운영시간 상세 route 진입
- 기대 결과: 접근 가능한 오류 alert 표시, 응답 값을 폼에 사용하지 않음

## Mock S4 — 잘못된 route date

- 목적: 유효하지 않은 날짜가 API path로 전달되지 않는지 확인
- Mock request: 없음
- Mock response: 없음
- 사용자 동작: `/notices/guide/hours/2026-02-30` 진입
- 기대 결과: `/notices/guide`로 replace 이동, 운영시간 API 호출 0회

## Staging R1

- 실행 여부: disabled
- 실제 request: 미실행
- 사전 조건/테스트 계정: 없음
- 사용자 동작: 미실행
- 기대 status와 결과: 미검증
- 생성 데이터 식별자: 해당 없음
- 정리 절차: 해당 없음

## 공통 확인

- 모든 Mock 시나리오는 `page.route()`로 휴관일과 운영시간 요청을 제어한다.
- 실제 서버 요청 없음
- 승인 Contract 밖의 request/response 필드 없음
- loading/error/success 상태를 기본값으로 숨기지 않음
