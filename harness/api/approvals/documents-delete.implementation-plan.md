# Implementation Plan — DOCUMENTS_DELETE

## 변경/생성 파일

1. `src/entities/resource/api/deleteDocument.ts` (신규)
   - `DeleteDocumentResponse { message: string }`.
   - `deleteDocument({ id })` → `api.delete('/documents/${id}')` + 메시지 응답 검증. id 정수 검증.
2. `src/entities/resource/index.ts` (수정): `deleteDocument`, 타입 export.
3. `src/features/create-resource/ui/ResourceForm.tsx` (수정)
   - 삭제 `deleteMutation`의 `mutationFn`을 `deleteDocument({ id: Number(initialResource.id) })`로 교체.
   - 성공 시 `invalidateQueries(['resources'])` + 상세 캐시 제거 + `onCompleted`(기존 유지). 실패 시 다이얼로그 닫고 `ErrorDialog`.

## 규칙 준수
- 공통 `api` + `useMutation`, 타입 분리, `any`/`@ts-ignore` 없음.

## 범위 제외
- 실제 서버 테스트(`real_server.enabled: false`).
