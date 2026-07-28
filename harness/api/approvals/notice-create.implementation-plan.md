# Implementation Plan — notice-create

## 승인 기준

- Content-Type은 `application/json`으로 동결한다.
- `title`, `kind`, `content`, `files`는 모두 required, nullable false로
  동결한다.
- `kind`는 백엔드 enum `ALL(kindName: "전체")` 확인 후 승인 Contract에서
  `ALL` 단일 값을 사용한다.
- 성공·오류 response body와 필드는 required 또는 nullable false로 동결한다.
- `files`는 FILE_CREATE response key 배열이며 첨부가 없으면 `[]`다.
- FILE_CREATE와 NOTICE_CREATE 승인을 모두 통과한 뒤 구현한다.
- 실제 서버 테스트는 disabled이다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`
- `src/shared/api/auth.ts`의 기존 인증 interceptor
- TanStack Query `useMutation`과 기존 `['notices']` 캐시 무효화
- `NoticeForm`의 입력 검증, 중복 제출 방지, 오류 상태, 수정·삭제 mock 분기
- `CreateNoticePage`의 성공 이동과 이탈 방지 해제
- 기존 notice API runtime response 검증 패턴

## 변경 파일

- `src/entities/notice/api/types.ts`
- `src/entities/notice/api/noticeApi.ts`
- `src/entities/notice/index.ts`
- `src/entities/file/api/types.ts`
- `src/entities/file/api/fileApi.ts`
- `src/entities/file/index.ts`
- `src/features/create-notice/ui/NoticeAttachmentField.tsx`
- `src/features/create-notice/ui/NoticeForm.tsx`
- `tests/e2e/api/file-create.spec.ts`
- `tests/e2e/api/notice-create.spec.ts`

## 타입과 API 함수

- Contract 그대로 `NoticeCreateRequest`, `NoticeCreateResponse`,
  `NoticeCreateErrorResponse`를 분리해 정의한다.
- `NoticeCreateRequest`는 `title`, `kind`, `content`, `files`를 포함한다.
- `createNotice(input)`은 공통 Axios 인스턴스로 `POST /notice`를 호출한다.
- HTTP 201 response를 `unknown`으로 받은 뒤 non-null string `message`를
  검증해 `NoticeCreateResponse`로 반환한다.
- 응답 형식이 Contract와 다르면 명시적 오류를 발생시킨다.
- FILE_CREATE 타입/API 함수는 file-create 승인 계획을 따른다.

## Query/Mutation과 캐시

- 등록이므로 기존 `useMutation`을 유지한다.
- 생성 분기에서 `createMockNotice` 대신 `createNotice`를 호출한다.
- 수정 분기는 기존 `updateMockNotice`를 유지한다.
- 생성 request는 trim된 `title`, 고정 `kind: 'ALL'`, trim된 `content`,
  FILE_CREATE response `key` 배열을 전달한다.
- 첨부파일명과 UI category 문자열은 Contract 밖이므로 request에서 제외한다.
- 첨부가 없으면 업로드 요청 없이 `files: []`로 NOTICE_CREATE를 호출한다.
- 새 파일은 선택 순서대로 순차 업로드하며 하나라도 실패하면 NOTICE_CREATE를
  호출하지 않는다.
- 성공 시 기존 `['notices']` prefix를 무효화하고 목록으로 이동한다.
- 실패 시 입력 상태를 유지하고 재제출할 수 있게 한다.

## UI 연결

- 입력 검증과 오류 문구를 변경하지 않는다.
- 중복 submit은 기존 `submittingRef`와 mutation pending 상태로 한 번만 요청한다.
- `NoticeAttachmentField`가 새로 선택한 browser `File[]`을 부모에 전달한다.
- chip에서 제거한 파일은 업로드 대상에서도 제거한다.
- 성공 시 `CreateNoticePage`의 기존 완료 callback을 재사용한다.
- 실패 시 `생성하지 못했습니다. 다시 시도해 주세요.`를 유지한다.
- 팀 추가 UI는 유지하지만 UI 문자열을 request에 포함하지 않는다.

## 검증 순서

1. `yarn harness:api:validate file-create`
2. `yarn harness:api:validate notice-create`
3. `yarn harness:api:gate file-create`
4. `yarn harness:api:gate notice-create`
5. 변경 소스 대상 `yarn harness:api:policy`
6. `yarn lint`
7. `yarn typecheck`
8. `yarn build`
9. `yarn verify:api file-create`
10. `yarn verify:api notice-create`
11. 기존 notice 생성 UI의 표적 회귀 테스트

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- `kind`의 실제 enum이 `ALL`과 다르면 Contract와 승인을 갱신한다.
- 팀 분류를 실제 API에 전달해야 하면 팀/분류 식별자 Contract를 먼저 확정한다.
- FILE_CREATE와 갱신 NOTICE_CREATE 중 하나라도 승인 gate가 실패하면 구현하지
  않는다.
- 일부 파일 업로드 성공 뒤 실패한 경우 서버 파일 정리 API가 없어 잔여 위험이
  있다.
- 구현 중 승인 Contract 밖의 request 또는 response 필드가 필요하면 중단하고
  ⑧ 승인 단계로 돌아간다.
