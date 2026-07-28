# Implementation Plan — file-create

## 상태

`READY_FOR_DEVELOPER_APPROVAL`

FILE_CREATE와 `files: string[]`을 추가한 NOTICE_CREATE가 함께 검토 가능한
상태다.

## 승인 기준

- FILE_CREATE `POST /file`은 요청당 browser `File` 하나를 `files` part로
  전송한다.
- UI에서 여러 파일을 선택하면 submit 시 파일 수만큼 요청을 순차 실행한다.
- response `key`, `fileUrl`은 required, nullable false string으로 검증한다.
- 파일 하나라도 실패하면 공지 생성 request를 실행하지 않는다.
- 자료실 업로드는 변경하지 않는다.
- 실제 서버 테스트는 disabled다.
- 갱신된 NOTICE_CREATE와 함께 승인돼야 구현을 시작한다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`
- 기존 Authorization interceptor
- `NoticeForm`의 `useMutation`, 중복 제출 방지, 입력 보존, 오류 상태
- `NoticeAttachmentField`의 `File` 보존, 중복 파일 제외, 50MB 검증
- 공지 생성 성공 시 기존 `['notices']` 무효화와 목록 이동

## 변경 파일

두 Contract 승인 후 다음 파일만 변경한다.

- `src/entities/file/api/types.ts` 신규
- `src/entities/file/api/fileApi.ts` 신규
- `src/entities/file/index.ts` 신규
- `src/features/create-notice/ui/NoticeAttachmentField.tsx`
- `src/features/create-notice/ui/NoticeForm.tsx`
- `src/entities/notice/api/types.ts` — NOTICE_CREATE 재승인 범위
- `tests/e2e/api/file-create.spec.ts` 신규
- `tests/e2e/api/notice-create.spec.ts` — NOTICE_CREATE 재승인 범위

## 타입과 API 함수

- `FileCreateRequest`: `files: File`
- `FileCreateResponse`: `key: string`, `fileUrl: string`
- `FileCreateErrorResponse`: `message`, `status`, `timestamp`, `description`
- `uploadFile({ files })`
  - `FormData` 생성
  - `formData.append('files', files)`
  - 공통 `api.post<unknown>('/file', formData)` 호출
  - `key`, `fileUrl` runtime 검증 후 반환
- multipart boundary 보존을 위해 `Content-Type`을 수동 설정하지 않는다.

## Query/Mutation과 캐시

- FILE_CREATE 전용 query cache는 만들지 않는다.
- 공지 create mutation에서 선택 파일을 순차 업로드한다.
- 모든 upload response의 `key`를 선택 순서대로 수집한다.
- NOTICE_CREATE에 `files: keys`를 생성 request에 포함한다.
- 업로드 또는 공지 생성 실패 시 `['notices']`를 무효화하지 않는다.
- 공지 생성 성공 시 기존 `['notices']` 무효화를 유지한다.

## UI 연결

- `NoticeAttachmentField`가 새로 선택된 browser `File[]`을 부모에 전달한다.
- 기존 파일명 chip, 중복 파일 처리, 50MB 오류, 제거 UI를 유지한다.
- 제거된 파일은 submit upload 대상에서도 제거한다.
- upload pending 동안 submit을 비활성화하고 중복 요청을 막는다.
- upload 실패 시 생성 화면과 제목·내용·파일 선택을 유지한다.
- 성공 이동은 기존 `/notices/list`를 유지한다.

## 검증 순서

두 Contract 승인 후:

1. `yarn harness:api:validate file-create`
2. `yarn harness:api:gate file-create`
3. 갱신된 NOTICE_CREATE validator/gate
4. 변경 소스 대상 `yarn harness:api:policy`
5. `yarn lint`
6. `yarn typecheck`
7. `yarn build`
8. `yarn verify:api file-create`
9. `yarn verify:api notice-create`
10. 기존 공지 생성/첨부 UI 표적 회귀 테스트

## STOP 조건과 미해결 질문

- 기존 승인된 NOTICE_CREATE에는 `files`가 없으므로 갱신된 Contract를 반드시
  재승인한다.
- 업로드 일부 성공 후 후속 업로드 또는 공지 생성이 실패했을 때 이미 업로드된
  파일을 삭제할 API가 없다. 서버의 미연결 파일 정리 정책이 없다면 잔여 위험으로
  최종 보고에 남긴다.
- 승인 Contract 밖의 field나 응답 사용이 필요하면 구현을 중단하고 승인 단계로
  돌아간다.
