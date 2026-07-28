# API Test Scenarios — notice-query

## Mock S1 — 정상 상세 조회

- 목적: route ID로 API를 호출하고 상세 폼에 응답을 표시한다.
- Mock request: `GET /api/notice/7`
- Mock response: HTTP 200, `id`, `title`, `kind`, `content`, `createAt`
- 사용자 동작: `/notices/list/7` 진입
- 기대 결과: 요청 path 확인, 제목·분류·내용 표시

## Mock S2 — 존재하지 않는 공지

- 목적: HTTP 404를 일반 오류와 구분한다.
- Mock request: `GET /api/notice/999`
- Mock response: HTTP 404 Contract 오류 body
- 사용자 동작: `/notices/list/999` 진입
- 기대 결과: `공지사항을 찾을 수 없습니다.`와 목록 복구 링크 표시

## Mock S3 — 서버 오류

- 목적: 오류를 not-found나 mock 데이터로 숨기지 않는다.
- Mock request: `GET /api/notice/7`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: `/notices/list/7` 진입
- 기대 결과: `공지사항을 불러오지 못했습니다. 다시 시도해 주세요.` alert 표시, not-found 문구는 표시하지 않음

## Mock S4 — 잘못된 route ID

- 목적: Contract 밖 ID로 API를 호출하지 않는다.
- Mock request: 없음
- Mock response: 없음
- 사용자 동작: `/notices/list/not-a-number` 진입
- 기대 결과: API 요청 없이 not-found 복구 UI 표시

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
