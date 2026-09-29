# Implementation Plan — DOCUMENTS_UPDATE

## 변경/생성 파일

1. `src/entities/resource/api/updateDocument.ts` (신규)
   - `UpdateDocumentRequest { title: string; type: DocumentType; files: string[] }`, `UpdateDocumentResponse { message: string }`.
   - `updateDocument({ id, body })` → `api.put('/documents/${id}', body)` + 메시지 응답 검증. id 정수 검증.
2. `src/entities/resource/model/types.ts` (수정)
   - `Resource.attachmentFiles?: { fileName: string; fileKey: string }[]` 추가(수정 시 기존 파일 키 전달용).
3. `src/entities/resource/api/getDocuments.ts` (수정)
   - `getDocument`가 `attachmentFiles`(name+key)도 채운다.
4. `src/entities/resource/index.ts` (수정): `updateDocument`, 타입 export.
5. `src/features/create-resource/ui/ResourceUploadField.tsx` (수정)
   - `initialFiles?: { fileName; fileKey }[]` prop 추가 → 기존 파일을 키와 함께 초기화(업로드 불필요). `uploadOnAttach`는 생성·수정 모두 true 로 사용(신규 파일만 업로드).
6. `src/features/create-resource/ui/ResourceForm.tsx` (수정)
   - 수정 경로 `mutationFn`을 `updateDocument({ id: Number(initialResource.id), body: { title, type, files: fileKeys } })`로 교체.
   - `ResourceUploadField`에 `initialFiles={initialResource?.attachmentFiles}` 전달, `uploadOnAttach` 항상 true.
   - 성공 시 `invalidateQueries(['resources'])` + 상세 캐시 제거 + `onCompleted`(기존 유지). 오류 시 `ErrorDialog`.

## 규칙 준수
- 공통 `api` + `useMutation`, 타입 분리, `any`/`@ts-ignore` 없음.

## 범위 제외
- 실제 서버 테스트(`real_server.enabled: false`).
