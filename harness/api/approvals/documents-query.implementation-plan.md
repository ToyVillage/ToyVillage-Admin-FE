# Implementation Plan — DOCUMENTS_QUERY

## 변경/생성 파일

1. `src/entities/resource/api/getDocuments.ts` (수정)
   - `DocumentQueryRequest { id: number }` 추가.
   - `getDocument({ id })` → `api.get<unknown>('/documents/${id}')` + 런타임 검증(id/title, files 선택 배열) 후 `Resource`로 매핑(`files`→`attachments` fileName 목록). 기존 `toFileType`/`toDisplayDate` 재사용. id 유효성(정수) 검증.
2. `src/entities/resource/index.ts` (수정)
   - `getDocument`, 타입 `DocumentQueryRequest` export.
3. `src/pages/notices/resources/ResourceDetailPage.tsx` (수정)
   - `getMockResource` → `getDocument({ id: Number(id) })`. `queryKey: ['resources', id]` 유지. `retry: false`.
   - 디자인에 없는 로딩/‘찾을 수 없습니다’ 화면은 두지 않는다. 로딩·오류 시 빈 폼(수정 레이아웃)만 유지하고, 진입 시 상단으로 스크롤한다.

## 규칙 준수

- 공통 `api` + `useQuery`, request/response 타입 분리, `any`/`@ts-ignore` 없음, Query Key 배열 유지.
- Contract 밖 필드 사용 안 함(`id/title/type/createdAt/files`만).

## 범위 제외

- 수정/삭제(DOCUMENTS_UPDATE/DELETE) 연동. 실제 서버 테스트(`real_server.enabled: false`).
