# Implementation Plan — open-time-query-by-date

## 승인 기준

- 승인 Contract의 `GET /open-time/{open-time-id}`만 사용한다.
- `{open-time-id}`에는 route의 유효한 `YYYY-MM-DD` 날짜를 전달한다.
- HTTP `201`과 필수 응답 객체만 성공으로 처리한다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 공통 `api`
- `src/entities/operating-hours/model/types.ts`의 `OperatingHours`
- `OperatingHoursForm`의 기존 TanStack Query와 폼 초기화 흐름

## 변경 파일

- `src/entities/operating-hours/api/types.ts`
- `src/entities/operating-hours/api/operatingHoursApi.ts`
- `src/entities/operating-hours/index.ts`
- `src/features/edit-operating-hours/ui/OperatingHoursForm.tsx`
- `tests/e2e/api/open-time-query-by-date.spec.ts`

## 타입과 API 함수

- 날짜 path request, 성공 response, 공통 error response 타입을 분리한다.
- 요청 날짜가 실제 달력 날짜인지 API 함수 경계에서 검증한다.
- 응답 status와 모든 필드의 타입·형식을 runtime에서 검증한다.
- 유효 응답을 기존 `OperatingHours` 화면 모델로 변환한다.

## Query/Mutation과 캐시

- query key `['operating-hours', date]`를 유지한다.
- query function을 mock 조회에서 `getOperatingHoursByDate`로 교체한다.
- 조회 API이므로 invalidation을 추가하지 않는다.
- 저장 mutation은 승인 범위 밖이므로 기존 mock 구현을 유지한다.

## UI 연결

- 조회된 `startOpenTime`, `endOpenTime`을 영업 시작·종료 초기값으로 표시한다.
- loading 상태는 접근 가능한 status로 표시한다.
- HTTP 오류와 잘못된 응답 형식은 기본값으로 숨기지 않고 alert로 표시한다.
- 잘못된 route date의 기존 replace 이동을 유지한다.

## 검증 순서

1. Contract validator
2. API 승인 gate
3. Mock Playwright 시나리오
4. API policy
5. lint
6. typecheck
7. build

## STOP 조건과 미해결 질문

- 승인 파일 해시가 불일치하면 구현을 중단한다.
- 서버가 path 날짜 또는 HTTP `201`과 다른 동작을 하면 Contract 재승인 전까지
  구현을 확장하지 않는다.
- Notion의 parameter 이름과 `404` 문구 정정은 백엔드 문서 후속 작업이다.
