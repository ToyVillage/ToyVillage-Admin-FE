# Implementation Plan — notice-update

## 승인 기준

- Content-Type은 `application/json`으로 동결한다.
- Path `id`는 required, nullable false인 양의 integer로 동결한다.
- `title`, `kind`, `content`는 모두 required, nullable false로 동결한다.
- `kind`는 백엔드 enum `ALL(kindName: "전체")` 확인을 재사용해 `ALL` 단일
  값을 사용한다.
- 성공·오류 response body와 필드는 required 또는 nullable false로 동결한다.
- 실제 서버 테스트는 disabled이다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`
- `src/shared/api/auth.ts`의 기존 인증 interceptor
- TanStack Query `useMutation`과 기존 `['notices']` 캐시 무효화
- `NoticeForm`의 입력 검증, 중복 제출 방지, 오류 상태, 생성·수정·삭제 분기
- `NoticeDetailPage`의 route ID 검증, 성공 이동과 이탈 방지 해제
- 기존 notice API runtime response 검증 패턴

## 변경 파일

- `src/entities/notice/api/types.ts`
- `src/entities/notice/api/noticeApi.ts`
- `src/entities/notice/index.ts`
- `src/features/create-notice/ui/NoticeForm.tsx`
- `tests/e2e/api/notice-update.spec.ts`

## 타입과 API 함수

- Contract 그대로 `NoticeUpdateRequest`, `NoticeUpdateResponse`,
  `NoticeUpdateErrorResponse`를 분리해 정의한다.
- `updateNotice({ id, input })`은 `id`를 양의 integer로 검증하고 공통 Axios
  인스턴스로 `PUT /notice/{id}`를 호출한다.
- body는 `title`, `kind`, `content`만 포함한다.
- HTTP 200 response를 `unknown`으로 받은 뒤 non-null string `message`를
  검증해 `NoticeUpdateResponse`로 반환한다.
- 응답 형식이 Contract와 다르면 명시적 오류를 발생시킨다.

## Query/Mutation과 캐시

- 수정이므로 기존 `useMutation`을 유지한다.
- 수정 분기에서 `updateMockNotice` 대신 `updateNotice`를 호출한다.
- path ID는 기존 상세 조회에서 검증된 양의 integer 값을 사용한다.
- request는 trim된 `title`, 고정 `kind: 'ALL'`, trim된 `content`만 전달한다.
- `category`와 `attachments`는 Contract 밖이므로 request에서 제외한다.
- 성공 시 기존 `['notices']` prefix를 무효화해 목록과 상세 query를 갱신하고
  목록으로 이동한다.
- 실패 시 입력 상태를 유지하고 재제출할 수 있게 한다.

## UI 연결

- 입력 검증과 오류 문구를 변경하지 않는다.
- 중복 submit은 기존 `submittingRef`와 mutation pending 상태로 한 번만 요청한다.
- 성공 시 `NoticeDetailPage`의 기존 완료 callback을 재사용한다.
- 실패 시 `저장하지 못했습니다. 다시 시도해 주세요.`를 유지한다.
- 팀 추가와 첨부 UI는 유지하지만 이번 Contract request에는 포함하지 않는다.
- 생성 API 분기와 삭제 mock 분기는 변경하지 않는다.

## 검증 순서

1. `yarn harness:api:validate notice-update`
2. `yarn harness:api:gate notice-update`
3. 변경 소스 대상 `yarn harness:api:policy notice-update ...`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api notice-update`
8. 기존 공지 수정 UI의 표적 회귀 테스트

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- `kind`의 실제 enum이 `ALL`과 다르면 Contract와 승인을 갱신한다.
- 팀 분류를 실제 API에 전달해야 하면 팀/분류 식별자 Contract를 먼저 확정한다.
- 첨부파일 수정은 별도 API ID와 Contract 없이는 연결하지 않는다.
- 구현 중 승인 Contract 밖의 request 또는 response 필드가 필요하면 중단하고
  ⑧ 승인 단계로 돌아간다.
