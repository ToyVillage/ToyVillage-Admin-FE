# API Test Scenarios — close-dat-query-all

## Mock S1 — 정상 목록

- 목적: API 결과를 기존 달력과 휴관 일정 목록에 표시한다.
- Mock request: `GET /api/close-day`
- Mock response: HTTP 200, `id`, `title`, `startCloseTime`,
  `endCloseTime`을 가진 배열
- 사용자 동작: `/notices/guide` 진입
- 기대 결과: Query String 없는 GET 요청 1회, 일정 제목·날짜와 달력 휴관 표시

## Mock S2 — 빈 목록

- 목적: 빈 성공 응답을 오류와 구분한다.
- Mock request: `GET /api/close-day`
- Mock response: HTTP 200, `[]`
- 사용자 동작: `/notices/guide` 진입
- 기대 결과: `아직 추가된 휴관일이 없습니다` 표시

## Mock S3 — 서버 오류

- 목적: 오류를 mock 또는 빈 배열로 숨기지 않는다.
- Mock request: `GET /api/close-day`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: `/notices/guide` 진입
- 기대 결과: `휴관일을 불러오지 못했습니다. 다시 시도해 주세요.` alert 표시,
  빈 상태 문구는 표시하지 않음

## Mock S4 — 카드 이동

- 목적: 기존 탐색 동작을 유지한다.
- Mock request: `GET /api/close-day`
- Mock response: HTTP 200, 휴관일 1건
- 사용자 동작: 일정 카드 클릭
- 기대 결과: `/notices/guide/:id/edit`로 이동

## Mock S5 — 잘못된 성공 응답

- 목적: Contract 밖의 응답을 UI 데이터로 사용하지 않는다.
- Mock request: `GET /api/close-day`
- Mock response: HTTP 200, 필수 필드가 누락된 배열
- 사용자 동작: `/notices/guide` 진입
- 기대 결과: 조회 실패 alert 표시, 잘못된 일정은 표시하지 않음

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
- 승인 Contract 밖의 필드 없음
- loading/error/success 상태가 숨겨지지 않음
