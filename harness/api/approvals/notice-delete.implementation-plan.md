# Implementation Plan — notice-delete

## 승인 기준

- Content-Type은 `application/json`으로 동결한다.
- Path `id`는 required, nullable false인 양의 integer로 동결한다.
- Query Parameters와 Request Body는 없음으로 동결한다.
- 성공·오류 response body와 필드는 required 또는 nullable false로 동결한다.
- 실제 서버 테스트는 disabled이다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`
- `src/shared/api/auth.ts`의 기존 인증 interceptor
- TanStack Query `useMutation`과 기존 `['notices']` 캐시 무효화
- `NoticeForm`의 삭제 확인 다이얼로그, pending 상태, 오류 상태와 캐시 처리
- `NoticeDetailPage`의 성공 이동과 이탈 방지 해제
- 기존 notice API runtime `message` response 검증 패턴

## 변경 파일

- `src/entities/notice/api/types.ts`
- `src/entities/notice/api/noticeApi.ts`
- `src/entities/notice/index.ts`
- `src/features/create-notice/ui/NoticeForm.tsx`
- `tests/e2e/api/notice-delete.spec.ts`

## 타입과 API 함수

- Contract 그대로 `NoticeDeleteRequest`, `NoticeDeleteResponse`,
  `NoticeDeleteErrorResponse`를 분리해 정의한다.
- `NoticeDeleteRequest`는 path parameter `id: number`만 가진다.
- `deleteNotice({ id })`는 `id`를 양의 safe integer로 검증하고 공통 Axios
  인스턴스로 `DELETE /notice/{id}`를 호출한다.
- DELETE request body와 query parameter는 보내지 않는다.
- HTTP 200 response를 `unknown`으로 받은 뒤 non-null string `message`를
  검증해 `NoticeDeleteResponse`로 반환한다.
- 응답 형식이 Contract와 다르면 명시적 오류를 발생시킨다.

## Query/Mutation과 캐시

- 삭제이므로 기존 `useMutation`을 유지한다.
- 삭제 분기에서 `deleteMockNotice` 대신 `deleteNotice`를 호출한다.
- path ID는 `Number(initialNotice.id)`로 변환하고 API 함수 경계에서 검증한다.
- 성공 시 기존 `['notices']` prefix를 무효화한다.
- 삭제된 상세 query `['notices', initialNotice.id]`를 제거한다.
- 실패 시 캐시를 성공 상태로 바꾸거나 localStorage mock 삭제로 fallback하지
  않는다.

## UI 연결

- 기존 삭제 확인 다이얼로그와 오류 문구를 변경하지 않는다.
- pending 중 확인 버튼과 삭제 버튼을 비활성화하고 기존 mutation guard로
  중복 요청을 막는다.
- 성공 시 `NoticeDetailPage`의 기존 완료 callback을 재사용해 목록으로 이동한다.
- 실패 시 `삭제하지 못했습니다. 다시 시도해 주세요.`를 유지한다.
- 생성·수정 mutation과 상세 조회 API는 변경하지 않는다.

## 검증 순서

1. `yarn harness:api:validate notice-delete`
2. `yarn harness:api:gate notice-delete`
3. 변경 소스 대상 `yarn harness:api:policy notice-delete ...`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api notice-delete`
8. 기존 공지 삭제 UI의 표적 회귀 테스트

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- 성공 응답이 HTTP 204 또는 body 없음이면 Contract와 승인을 갱신한다.
- DELETE request body나 query parameter가 필요하면 Contract를 먼저 보완한다.
- 구현 중 승인 Contract 밖의 request 또는 response 필드가 필요하면 중단하고
  ⑧ 승인 단계로 돌아간다.
