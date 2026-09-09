# API Test Scenarios — reservations-admin-query-all

대상 페이지: `/notices/reservations` (`NoticeReservationsPage`). 모든 mock은 `page.route()` 기반, 실제 서버 요청 없음. 요청은 `size=10` 을 포함한다(개발자 결정, 한 페이지 10건).

## Mock S1 — 정상 목록 + 상태 카운트

- 목적: API 결과를 테이블과 상태 카드에 표시한다.
- Mock request: `GET /api/reservation?status=BEFORE_SITE_VISIT&sort=COUNSEL_DATE&page=0&size=10` (초기: active=pending)
- Mock response: HTTP 200, `beforeVisitSite/doneVisitSite/doneVisit` + `reservationAdminQueryListObjectResponse.content`(1건 이상), `totalPages`
- 사용자 동작: `/notices/reservations` 진입
- 기대 결과: 상태 카드 카운트가 beforeVisitSite/doneVisitSite/doneVisit 로 표시, 목록에 title(단체명)·location(지역)·counselDate·reservationDate·reservationTime·count 매핑 표시(날짜 `yyyy.MM.dd`, 시간 `HH : mm`)

## Mock S2 — 상태 필터 전환

- 목적: 상태 카드 선택이 `status` 파라미터로 서버에 반영된다.
- Mock request: `GET /api/reservation?status=SITE_VISIT_COMPLETED&sort=COUNSEL_DATE&page=0`
- Mock response: HTTP 200, 해당 상태 목록. 카운트는 필터와 무관하게 전체 기준 유지
- 사용자 동작: '사전답사 완료' 카드 클릭
- 기대 결과: 요청 query에 `status=SITE_VISIT_COMPLETED` 포함, 카운트 값은 불변, 목록만 교체

## Mock S3 — 검색(title)

- 목적: 검색어가 `title` 파라미터로 전달된다(공백뿐이면 미전송).
- Mock request: `GET /api/reservation?...&title=대구&page=0`
- Mock response: HTTP 200, 부분 일치 목록
- 사용자 동작: 검색창에 `대구` 입력(디바운스)
- 기대 결과: 요청 query에 `title=대구` 포함, 첫 페이지로 복귀

## Mock S4 — 정렬 전환

- 목적: 정렬 선택이 `sort` 파라미터로 반영된다.
- Mock request: `GET /api/reservation?...&sort=RESERVATION_DATE&page=0`
- Mock response: HTTP 200, 정렬 목록
- 사용자 동작: 정렬 '예약일순' 선택
- 기대 결과: 요청 query에 `sort=RESERVATION_DATE` 포함

## Mock S5 — 페이지네이션

- 목적: 페이지 이동이 0-based `page`로 전달되고 `totalPages`로 페이지 수를 계산한다.
- Mock request: page 0 → `page=0`, page 2 이동 → `page=1`
- Mock response: HTTP 200, `totalPages` >= 2
- 사용자 동작: 2페이지 이동
- 기대 결과: 요청 query에 `page=1`(0-based) 포함, 2페이지 목록 표시

## Mock S6 — 빈 목록

- 목적: 빈 성공 응답을 오류와 구분한다.
- Mock request: `GET /api/reservation?...`
- Mock response: HTTP 200, `content: []`, `totalPages: 0`, 카운트 0
- 사용자 동작: 진입
- 기대 결과: `아직 단체예약이 없습니다`(검색 중이면 `검색결과가 없습니다`) 표시, 카드 카운트 0

## Mock S7 — 서버 오류

- 목적: 오류를 빈 배열로 숨기지 않는다.
- Mock request: `GET /api/reservation?...`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: 진입
- 기대 결과: 오류 알림 표시, 목록은 빈 상태(오류를 정상 빈 목록으로 위장하지 않음)

## Mock S8 — 행 이동

- 목적: 기존 탐색 동작 유지.
- Mock request: `GET /api/reservation?...`
- Mock response: HTTP 200, 예약 1건(id=1)
- 사용자 동작: 행 클릭
- 기대 결과: `/notices/reservations/1` 로 이동

## Staging R1

- 실행 여부: disabled (`real_server.enabled=false`)
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
