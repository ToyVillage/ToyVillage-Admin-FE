---
feature: documents-create
api_id: DOCUMENTS_CREATE
target_page: src/features/create-resource/ui/ResourceForm.tsx
notion_page: https://app.notion.com/p/e58e8d82a450822f885e01958a22bd25
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

자료실(Resource)에 새 자료를 등록하는 `DOCUMENTS_CREATE` API를 프론트엔드에 연동한다.
현재 `ResourceForm`은 mock 함수(`createMockResource`)로 생성 처리를 하고 있으며, 이를 실제 API 호출로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/features/create-resource/ui/ResourceForm.tsx` (생성 경로: `initialResource`가 없을 때)
- 호출 트리거: `ResourceListPage` → `CreateResourceButton` → `ResourceForm` 제출

# 연동할 API

- API ID: `DOCUMENTS_CREATE`
- `POST /documents`
- 인증: Bearer access token 필요, 접근권한 `ADMIN`
- Request Body: `{ title: string, type: enum, files: string[] }`

# 기대 성공 동작

- HTTP 201 수신 시 `['resources']` 쿼리 무효화 후 `onCompleted()` 호출로 목록 복귀

# 기대 오류 동작

- 400: 제목 없음 / 타입 미선택 / 파일 없음 → 생성 실패 다이얼로그
- 401: 만료된 토큰
- 404: 존재하지 않는 파일
- 500: 서버 오류

# 캐시 갱신 기대

- 성공 시 `queryClient.invalidateQueries({ queryKey: ['resources'] })`

# 페이지 이동 또는 사용자 알림

- 성공: `onCompleted()`로 목록 화면 복귀
- 실패: 기존 `ErrorDialog` 재사용

# 비고 및 제약

- 실제 서버 테스트는 하지 않는다 (`real_server.enabled: false`). Mock 기반 Playwright 테스트만 수행.
- `files`는 "file key" 문자열 목록이다. 폼은 파일 첨부 즉시 FILE_CREATE(`uploadFile`)로 업로드해 얻은 `fileKey`를 보관했다가, 생성 요청 시 그 키 목록을 전송한다.
