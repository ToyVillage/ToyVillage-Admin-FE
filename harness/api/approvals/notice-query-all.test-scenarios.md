# API Test Scenarios — notice-query-all

## Mock S1 — 정상 목록

- 목적: API 결과를 기존 테이블에 표시한다.
- Mock request: `GET /api/notice?page=0&size=10`
- Mock response: HTTP 200, `id`, `title`, `kind`, `createAt`을 가진 배열
- 사용자 동작: `/notices/list` 진입
- 기대 결과: 요청 query 확인, 제목·분류·날짜 표시

## Mock S2 — 빈 목록

- 목적: 빈 성공 응답을 오류와 구분한다.
- Mock request: `GET /api/notice?page=0&size=10`
- Mock response: HTTP 200, `[]`
- 사용자 동작: `/notices/list` 진입
- 기대 결과: `표시할 공지가 없습니다` 표시

## Mock S3 — 서버 오류

- 목적: 오류를 빈 배열로 숨기지 않는다.
- Mock request: `GET /api/notice?page=0&size=10`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: `/notices/list` 진입
- 기대 결과: `공지사항을 불러오지 못했습니다. 다시 시도해 주세요.` alert 표시, 빈 상태 문구는 표시하지 않음

## Mock S4 — 행 이동

- 목적: 기존 탐색 동작을 유지한다.
- Mock request: `GET /api/notice?page=0&size=10`
- Mock response: HTTP 200, 공지사항 1건
- 사용자 동작: 행 클릭
- 기대 결과: `/notices/list/:id`로 이동

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
