# API Test Scenarios — reservations-admin-employee-query-all

대상: `/notices/reservations/:id` (`ReservationDetailPage` 권한 섹션). mock은 `page.route()` 기반, 실제 서버 요청 없음. 상세(`/reservation/{id}`)와 직원(`/reservation/{id}/employee`) 두 라우트를 건다.

## Mock S1 — 배정됨/배정가능 표시

- 목적: 응답의 assigned/assignable를 권한 섹션에 표시한다.
- Mock request: `GET /api/reservation/1/employee`
- Mock response: HTTP 200, `assigned:[{appAdminId:3,name:"이승현"}]`, `assignable:[{appAdminId:7,name:"김직원"}]`
- 사용자 동작: `/notices/reservations/1` 진입
- 기대 결과: 요청 path `/reservation/1/employee` 확인. 배정됨에 "이승현", 배정가능에 "김직원" 표시.

## Mock S2 — 이름 검색(name)

- 목적: 권한 검색어가 `name` 파라미터로 서버 전달(디바운스).
- Mock request: `GET /api/reservation/1/employee?name=이승`
- Mock response: HTTP 200, 필터된 목록
- 사용자 동작: 권한 검색창에 `이승` 입력
- 기대 결과: 요청 query에 `name=이승` 포함.

## Mock S3 — 빈 목록

- 목적: 빈 성공 응답 처리.
- Mock request: `GET /api/reservation/1/employee`
- Mock response: HTTP 200, `assigned:[]`, `assignable:[]`
- 사용자 동작: 진입
- 기대 결과: 두 목록 모두 빈 상태(오류 아님).

## Mock S4 — 서버 오류(비-404)

- 목적: 오류를 정상 빈 목록으로 위장하지 않는다.
- Mock request: `GET /api/reservation/1/employee`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: 진입(상세는 200 정상)
- 기대 결과: 권한 목록 조회 실패가 성공 빈 목록과 구분됨(오류 숨김 없음).

## Staging R1

- 실행 여부: disabled (`real_server.enabled=false`)
- 실제 request/사용자 동작/결과/데이터/정리: 없음

## 공통 확인

- Mock 시나리오는 실제 서버 요청 없음
- 승인 Contract 밖의 필드 없음
- loading/error/success 상태가 숨겨지지 않음
