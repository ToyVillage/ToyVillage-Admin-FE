# Implementation Plan — DOCUMENTS_CREATE

승인 전에는 코드/테스트를 작성하지 않는다. 아래는 승인 대상 계획이다.

## 결정 (확정됨)

- **D1. file key 확보 방식**: develop에 머지된 FILE_CREATE(`uploadFile`, `POST /file`)를 사용한다. 파일을 **첨부하는 즉시** 업로드해 `fileKey`를 확보해 두고, **생성하기** 클릭 시 그 key 목록을 DOCUMENTS_CREATE `files`로 전달한다.
- **D2. type enum 매핑 확정**: `pdf→PDF`, `jpg→JPEG/JPG`, `png→PNG`, `etc→OTHER`.

## 변경/생성 파일 (D1=(a) 기준)

1. `src/entities/resource/api/createDocument.ts` (신규)
   - `import { api } from '@/shared/api/axios'`
   - request 타입: `interface CreateDocumentRequest { title: string; type: DocumentType; files: string[] }`
   - `type DocumentType = 'PDF' | 'JPEG/JPG' | 'PNG' | 'OTHER'`
   - response 타입: `interface CreateDocumentResponse { message: string }` (request/response 분리)
   - `export async function createDocument(body: CreateDocumentRequest): Promise<CreateDocumentResponse>` → `const { data } = await api.post<CreateDocumentResponse>('/documents', body); return data`
   - Contract에 없는 필드는 추가하지 않는다.
2. `src/entities/resource/model/types.ts` (수정)
   - `fileTypeToDocumentType: Record<FileType, DocumentType>` 매핑 추가 (D2).
3. `src/entities/resource/index.ts` (수정)
   - `createDocument`, 타입 `CreateDocumentRequest`/`CreateDocumentResponse`/`DocumentType`, 매핑 export.
4. `src/features/create-resource/ui/ResourceUploadField.tsx` (수정)
   - `uploadOnAttach` prop이 true면 파일 첨부 즉시 `uploadFile`로 업로드하고 `fileKey`를 각 파일에 저장한다. 실패한 파일은 목록에서 제거하고 오류 메시지를 띄운다.
   - `onFileKeysChange`(업로드된 key 목록), `onUploadingChange`(업로드 진행 여부)를 폼에 노출.
5. `src/features/create-resource/ui/ResourceForm.tsx` (수정)
   - 생성 경로(`!initialResource`)의 `mutationFn`: 이미 확보한 `fileKeys`로 `createDocument({ title, type, files: fileKeys })` 호출.
   - `uploadOnAttach={!isEditing}`로 필드에 전달. 업로드 중(`isUploading`)에는 제출 버튼 비활성(`업로드 중`) 및 `handleSubmit` 가드.
   - 성공 시 `invalidateQueries(['resources'])` + `onCompleted()`, 오류 시 `ErrorDialog`, `submittingRef` 중복 제출 차단(기존 유지). 수정/삭제는 mock 유지.

## 캐시/탐색 동작

- 성공: `queryClient.invalidateQueries({ queryKey: ['resources'] })` 후 `onCompleted()`로 목록 복귀.
- 실패: 화면 이동 없음, `ErrorDialog` 표시.

## 규칙 준수 체크

- 공통 `api` 인스턴스만 사용, 새 axios/fetch 없음.
- 등록 = `useMutation`, 조회 = 기존 `useQuery`.
- request/response 타입 분리, `any`/`@ts-ignore` 없음, `import type` 사용.
- Query Key 배열 패턴 유지.

## Contract 밖 (범위 제외)

- FILE_CREATE(파일 업로드) 연동, 실제 서버 테스트(`real_server.enabled: false`).
