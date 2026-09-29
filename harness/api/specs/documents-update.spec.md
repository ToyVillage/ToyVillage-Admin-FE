---
feature: documents-update
api_id: DOCUMENTS_UPDATE
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

자료실 자료 수정을 실제 API(`PUT /documents/{id}`)로 연동한다. 현재 `ResourceForm`의 수정 경로는 mock(`updateMockResource`)이다.

# 대상 페이지 또는 컴포넌트

- `src/features/create-resource/ui/ResourceForm.tsx` (수정 경로: `initialResource` 존재)

# 연동할 API

- `PUT /documents/{id}`, 인증 Bearer/ADMIN
- Request `{ title, type(enum), files: string[] }` (create와 동일, files=file key)
- 성공 201 `{ message: "자료 수정 성공" }`

# 기대 성공 동작

- 201 → `['resources']` 무효화, 상세 캐시 제거, 목록 복귀(`onCompleted`).

# 기대 오류 동작

- 400 제목/타입/파일 / 401 토큰 / 404 자료·파일 없음 / 500 → 저장 실패 다이얼로그.

# 캐시 갱신 기대

- `invalidateQueries(['resources'])` + 상세 `['resources', id]` 제거.

# 페이지 이동 또는 사용자 알림

- 성공 시 목록 복귀. 실패 시 `ErrorDialog`.

# 비고 및 제약

- 실제 서버 테스트 없음(`real_server.enabled: false`).
- files 는 기존 파일 키(상세 조회 응답의 fileKey) + 새로 업로드한 키를 합쳐 전송한다.
