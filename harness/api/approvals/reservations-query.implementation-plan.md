# Implementation Plan — RESERVATION_ADMIN_QUERY

## 변경/생성 파일

1. `src/entities/reservation/api/getReservation.ts` (수정)
   - 응답 런타임 타입을 개정 명세로 교체(counselDate/visitDate/visitTime/exitTime/reservationName/reservationCount/location/title/money/status/leaderCount/leaderPhoneNumber).
   - `getReservation({ id })` → `api.get('/reservation/${id}')`. 응답에 id가 없어 요청 id를 상세 식별자로 사용.
2. `src/pages/notices/reservations/ReservationDetailPage.tsx`
   - 변경 없음(기존 `getReservation({ id: Number(id) })` 배선 유지).

## 매핑

- counselDate→consultDate, visitDate→reserveDate, visitTime→reserveTime, exitTime→reserveTimeEnd, reservationName→reserverName, reservationCount→headcount, location→region/regionDetail, title→groupName, money→admissionFee, status→surveyStatus, leaderCount→guideCount, leaderPhoneNumber→guideContact.
- 이전 임시 매핑(B)의 빈 값 전부 해소.

## 규칙 준수

- 공통 `api` + `useQuery`, request/response 타입 분리, `any`/`@ts-ignore` 없음, Query Key 배열 유지.

## 범위 제외

- 직원용 상세(RESERVATION_EMPLOYEE_QUERY). 실제 서버 테스트(`real_server.enabled: false`).
