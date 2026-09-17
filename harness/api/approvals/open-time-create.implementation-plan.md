# Implementation Plan — open-time-create

## 승인 기준

- `POST /open-time`, body `{ openDate, startOpenTime, endOpenTime }`, 시간 `HH:mm:ss`, 성공 HTTP 201 + `message` string.
- 조회 응답 `id`가 `null`인 날짜에서만 호출한다.
- 실제 서버 테스트는 disabled이다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`, 기존 인증 interceptor
- `src/entities/operating-hours/api/operatingHoursApi.ts`의 날짜·시간 검증 패턴
- `a0767b6` 이전 `OperatingHoursForm`의 시간 검증·pending guard·Enter 저장 로직(읽기 전용 전환 전 구현) 복원
- TanStack Query `useMutation`, `['operating-hours', date]` 캐시

## 변경 파일

- `src/entities/operating-hours/api/types.ts` — `OpenTimeCreateRequest`, `OpenTimeCreateResponse`
- `src/entities/operating-hours/api/operatingHoursApi.ts` — `createOperatingHours`, 조회 결과에 `id` 포함
- `src/entities/operating-hours/model/types.ts` — `OperatingHours.id: number | null`
- `src/entities/operating-hours/index.ts`
- `src/features/edit-operating-hours/ui/OperatingHoursForm.tsx` — 편집·저장 UI 복원, id 유무로 등록/수정 분기
- `src/features/edit-operating-hours/ui/OperatingTimeField.tsx` — 편집 가능 상태 복원
- `tests/e2e/api/open-time-create.spec.ts`

## UI 연결

- Figma yot `1:7101`: 카드 426×184 두 개, `저장하기`(1497, 464) 123×61.
- 저장 중 `저장 중` 라벨과 disabled, 성공 시 `/notices/guide` 이동, 실패 시 입력 유지 + `저장하지 못했습니다. 다시 시도해 주세요.`

## 검증 순서

1. `yarn harness:api:validate open-time-create`
2. `yarn harness:api:gate open-time-create`
3. `yarn harness:api:policy open-time-create <변경 파일>`
4. `yarn verify`
5. `yarn verify:api open-time-create`
