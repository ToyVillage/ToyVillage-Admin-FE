# Implementation Plan — close-dat-query-by-date

## 승인 기준

- 요청은 `GET /close-day?date=YYYY-MM-DD`이다.
- `/logs`는 사용자 결정으로 Notion 오타로 처리한다.
- 성공 status는 `200`, 결과 없음은 `[]`이다.
- HTTP `404`는 Contract에 정의하지 않으며, 반환되면 빈 결과가 아닌 조회
  오류로 처리한다.
- 응답과 오류 필드는 required, nullable false이다.
- 실제 서버 테스트는 disabled이다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`
- `src/shared/api/auth.ts`의 Authorization interceptor
- 기존 `CloseSchedule` 도메인 타입
- 전체 조회의 응답 item runtime validator와 mapper
- TanStack Query `useQuery`
- 기존 날짜 route 검증과 상세 화면

## 변경 파일

- `src/entities/close-schedule/api/types.ts`
- `src/entities/close-schedule/api/closeScheduleApi.ts`
- `src/entities/close-schedule/index.ts`
- `src/pages/notices/guide/OperatingHoursPage.tsx`
- `tests/e2e/api/close-dat-query-by-date.spec.ts`

## 타입과 API 함수

- `CloseDateQueryByDateRequest`를 `{ date: string }`으로 작성한다.
- 응답과 오류 body는 기존 전체 조회의 item/error 구조를 재사용하되 API
  이름이 드러나는 별도 response alias를 제공한다.
- `getCloseSchedulesByDate({ date })`는 공통 Axios로 `/close-day`를
  조회하고 Axios `params`에 `date`만 전달한다.
- request date는 HTTP 호출 전에 실제 달력 날짜의 `YYYY-MM-DD`인지
  검증한다.
- 성공 status와 body를 Contract대로 검증하고 `CloseSchedule[]`로 매핑한다.

## Query/Mutation과 캐시

- 조회이므로 `useQuery`를 사용한다.
- query key는 `['close-schedules', 'by-date', date]`이다.
- 잘못된 route date에서는 query를 만들지 않고 기존 redirect를 유지한다.
- 오류를 빈 배열이나 기본 객체로 대체하지 않는다.

## UI 연결

- 상세 화면 pending 중에는 접근 가능한 조회 중 상태를 표시한다.
- 오류 시 `role="alert"`로 조회 실패를 표시하고 영업시간 폼을 숨긴다.
- 성공 시 기존 날짜 제목과 `OperatingHoursForm`을 유지한다.
- 결과가 있으면 첫 일정의 제목을 `휴관 일정: {title}` 보조 정보로 표시한다.
- 빈 배열이면 보조 정보 없이 기존 상세 UI를 표시한다.

## 검증 순서

1. `yarn harness:api:validate close-dat-query-by-date`
2. `yarn harness:api:gate close-dat-query-by-date`
3. `yarn harness:api:policy`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api close-dat-query-by-date`

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- 응답 wrapper, 다른 query 이름, `[]`가 아닌 결과 없음 동작이 발견되면
  중단한다.
- 상세 화면에 여러 휴관 일정이 반환되면 모든 제목을 표시하지 않고 첫 일정만
  표시한다. 중복 일정 표시 요구가 생기면 승인 기준을 갱신한다.
- 운영시간 조회·수정 API 연동은 별도 API ID 범위이다.
