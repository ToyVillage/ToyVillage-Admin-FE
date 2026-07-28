---
feature: file-create
api_id: FILE_CREATE
target_page: src/features/create-notice/ui/NoticeAttachmentField.tsx
notion_page:
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

공지사항 생성 화면의 로컬 첨부파일 선택을 `FILE_CREATE` 업로드 API와 연결한다.

# 대상 페이지 또는 컴포넌트

- `src/features/create-notice/ui/NoticeAttachmentField.tsx`
- `src/features/create-notice/ui/NoticeForm.tsx`
- 신규 file API entity

자료실의 `ResourceUploadField`는 이번 범위에서 제외한다.

# 연동할 API

- API ID: `FILE_CREATE`
- Method/Path: `POST /file`
- Content-Type: `multipart/form-data`
- UI에서 여러 파일을 선택할 수 있지만 API 요청 한 번에는 `files` part로 파일
  하나만 전송한다.

# 기대 성공 동작

- 공지 생성 submit 시 선택한 파일마다 `POST /file`을 한 번씩 호출한다.
- 성공한 응답의 `key`와 `fileUrl`을 해당 파일에 보존한다.
- 모든 파일 업로드가 성공해야 공지 생성 후속 동작으로 넘어간다.
- 업로드된 key 목록을 공지 생성 request에 연결하려면 NOTICE_CREATE Contract의
  `files` 필드 승인이 선행되어야 한다.

# 기대 오류 동작

- 파일 하나라도 업로드에 실패하면 공지 생성을 호출하지 않는다.
- 실패한 파일과 사용자가 입력한 제목·내용을 유지해 다시 시도할 수 있어야 한다.
- HTTP 400/401/403/404/500 및 Contract에 맞지 않는 성공 응답을 성공으로
  숨기지 않는다.

# 캐시 갱신 기대

- FILE_CREATE 자체는 query cache를 생성하거나 무효화하지 않는다.
- 공지 생성이 승인 범위까지 연결되면 기존 `['notices']` 무효화를 유지한다.

# 페이지 이동 또는 사용자 알림

- FILE_CREATE 성공만으로 페이지를 이동하지 않는다.
- 업로드 실패 시 공지 생성 화면에 머물고 오류 상태를 표시한다.
- 공지 생성 성공 이동은 기존 `/notices/list` 동작을 유지한다.

# 비고 및 제약

- 파일당 50MB 제한을 유지한다.
- 요청 field 이름은 `files`를 사용한다.
- 자료실 업로드는 연결하지 않는다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
- 현재 승인된 NOTICE_CREATE Contract에는 `files`가 없으므로, 업로드 key를
  공지 생성 request에 포함하는 구현은 NOTICE_CREATE Contract 갱신과 재승인
  전에는 수행하지 않는다.
