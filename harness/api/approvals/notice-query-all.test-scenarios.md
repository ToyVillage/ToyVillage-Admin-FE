# API Test Scenarios — notice-query-all

## Mock S1 — 정상 목록

- 목적: API 결과를 기존 테이블에 표시한다.
- Mock request: `GET /api/notice?page=1&size=10`
- Mock response: HTTP 200, `{ "notices": [{ id, title, teams: [{id:1,"동물 관리팀"}], createdAt }], "totalPageSize": 1 }`
- 사용자 동작: `/notices/list` 진입
- 기대 결과: 요청 query `page=1`, `size=10` 확인, 제목·분류·날짜 표시, 추가 페이지 요청 없음

## Mock S2 — 빈 목록

- 목적: 빈 성공 응답을 오류와 구분한다.
- Mock request: `GET /api/notice?page=1&size=10`
- Mock response: HTTP 200, `{ "notices": [], "totalPageSize": 0 }`
- 사용자 동작: `/notices/list` 진입
- 기대 결과: `표시할 공지가 없습니다` 표시

## Mock S3 — 서버 오류

- 목적: 오류를 빈 배열로 숨기지 않는다.
- Mock request: `GET /api/notice?page=1&size=10`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: `/notices/list` 진입
- 기대 결과: `공지사항을 불러오지 못했습니다. 다시 시도해 주세요.` alert 표시, 빈 상태 문구는 표시하지 않음

## Mock S4 — 행 이동

- 목적: 기존 탐색 동작을 유지한다.
- Mock request: `GET /api/notice?page=1&size=10`
- Mock response: HTTP 200, 공지사항 1건
- 사용자 동작: 행 클릭
- 기대 결과: `/notices/list/:id` 읽기 전용 상세로 이동

## Mock S5 — 여러 페이지 합치기

- 목적: `totalPageSize`만큼 페이지를 조회해 전체 목록을 만든다.
- Mock request: `GET /api/notice?page=1&size=10`, `GET /api/notice?page=2&size=10`
- Mock response: 각 HTTP 200, `totalPageSize: 2`, 1페이지 10건 + 2페이지 1건(서로 다른 ID)
- 사용자 동작: `/notices/list` 진입
- 기대 결과: 요청이 page 1, 2 순서로 2회, 11건이 화면 페이지네이션에 반영

## Mock S6 — Contract 응답 형식 위반

- 목적: 배열 등 Contract와 다른 200 응답을 빈 목록으로 숨기지 않는다.
- Mock request: `GET /api/notice?page=1&size=10`
- Mock response: HTTP 200, `[]`(배열)
- 사용자 동작: `/notices/list` 진입
- 기대 결과: `공지사항을 불러오지 못했습니다. 다시 시도해 주세요.` alert 표시

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

## Mock S7 — 여러 팀 공지의 탭 필터 (2026-09-18 추가)

- 목적: `teams`가 여러 개인 공지가 각 팀 탭에 모두 나오고, 분류 칸에 팀 이름을 이어 표시한다. `teams`가 비면 `전체`.
- 선행 Mock request: `GET /api/team` → `동물 관리팀`, `창고팀`
- Mock request: `GET /api/notice?page=1&size=10`
- Mock response: `두 팀 공지`(teams 2개), `전체 공지`(teams 빈 배열)
- 사용자 동작: `창고팀` 탭 클릭 → `동물 관리팀` 탭 클릭
- 기대 결과: 첫 행 분류 `동물 관리팀, 창고팀`, 두 탭 모두 `두 팀 공지` 1건만 표시
- 비고: 서버 `teamId` 필터는 쓰지 않는다. 목록은 전체를 받아 프론트에서 거른다(검색·정렬·페이지가 전체 기준이라 기존 구조 유지).
- 테스트: `tests/e2e/api/notice-query-all.spec.ts` S7
