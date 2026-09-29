# Implementation Plan — close-dat-query-all

## 승인 기준

- 사용자 결정으로 성공 Status Code를 `200`으로 동결한다.
- JSON 예시의 응답 필드를 required, nullable false로 동결한다.
- path/query/body 입력 없음과 빈 결과 `[]`를 승인 기준으로 동결한다.
- 실제 서버 테스트는 disabled이다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`
- `src/shared/api/auth.ts`의 Authorization interceptor
- TanStack Query `useQuery`
- 기존 `['close-schedules']` query key
- 기존 `CloseSchedule` 도메인 타입과 달력·목록 UI

## 변경 파일

- `src/entities/close-schedule/api/types.ts`
- `src/entities/close-schedule/api/closeScheduleApi.ts`
- `src/entities/close-schedule/index.ts`
- `src/pages/notices/guide/NoticeGuidePage.tsx`
- `tests/e2e/api/close-dat-query-all.spec.ts`

## 타입과 API 함수

- Contract 그대로의 `CloseDateQueryAllResponseItem`,
  `CloseDateQueryAllResponse`, `CloseDateQueryAllErrorResponse`를 작성한다.
- `getCloseSchedules()`는 공통 Axios 인스턴스로 `/close-day`를 조회한다.
- 런타임 응답이 배열인지, 각 필드가 Contract 타입인지 검증한다.
- API numeric `id`는 라우트용 string으로 변환한다.
- `startCloseTime`, `endCloseTime`은 `startDate`, `endDate`로 매핑한다.

## Query/Mutation과 캐시

- 조회이므로 `useQuery`를 사용한다.
- query key는 기존 `['close-schedules']`를 유지한다.
- 오류 시 기본 배열이나 mock으로 대체하지 않는다.
- 기존 생성·수정·삭제의 prefix invalidation 동작은 유지한다.

## UI 연결

- pending 중에는 휴관일 조회 중임을 표시한다.
- 오류 시 `role="alert"`로 조회 실패를 드러낸다.
- 성공한 빈 배열은 기존 빈 상태를 표시한다.
- 정상 목록은 기존 달력, 검색, 카드 링크에 그대로 전달한다.

## 검증 순서

1. `yarn harness:api:validate close-dat-query-all`
2. `yarn harness:api:gate close-dat-query-all`
3. `yarn harness:api:policy`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api close-dat-query-all`

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- Notion의 `201`과 승인 Contract의 `200` 차이는 백엔드 명세 정정이 필요하다.
- 구현 중 응답 wrapper 등 Contract 밖의 서버 구조가 발견되면 중단한다.
- 단일 조회/생성/수정/삭제는 각 API ID의 별도 연동 범위이다.
