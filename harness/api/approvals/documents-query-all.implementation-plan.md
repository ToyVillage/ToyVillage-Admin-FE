# Implementation Plan — DOCUMENTS_QUERY_ALL

## 변경/생성 파일

1. `src/entities/resource/api/getDocuments.ts`
   - request 타입: `DocumentsQueryAllRequest { page: number; size: number; keyword?: string; orderDirection?: DocumentOrderDirection; types?: DocumentType[] }`, `DocumentOrderDirection = 'ASC' | 'DESC'`.
   - response 타입: `DocumentsPage { resources: Resource[]; totalPageSize: number }`.
   - `getDocuments(params)` → `api.get<unknown>('/documents', { params, paramsSerializer: { indexes: null } })`.
     `indexes: null` 은 배열 파라미터를 `types[]=` 가 아니라 `types=PDF&types=JPG` 로 보내기 위한 설정이다.
   - 런타임 검증: 응답이 `{ documents: [...], totalPageSize: number }` 객체인지 확인하고, 아이템은 `id`/`title` 을 검사한다.
   - 매핑: `id`→String, `type`→`documentTypeToFileType`(미지값 `etc`), `createdAt`→`YYYY.MM.DD`.
2. `src/entities/resource/model/types.ts`
   - `DocumentType = 'PDF' | 'JPG' | 'PNG' | 'OTHER'`, `fileTypeToDocumentType`/`documentTypeToFileType` 매핑(PDF↔pdf, JPG↔jpg, PNG↔png, OTHER↔etc).
3. `src/entities/resource/index.ts`
   - `getDocuments`, 타입 `DocumentsQueryAllRequest`/`DocumentsPage`/`DocumentOrderDirection` export.
4. `src/pages/notices/resources/ResourceListPage.tsx`
   - 서버 사이드 페이지네이션 + 필터: `useQuery({ queryKey: ['resources','list',{ page, size: 10, keyword, types }], queryFn: () => getDocuments({ page: page-1, size: 10, keyword, orderDirection: 'DESC', types }), placeholderData: prev })`.
   - 파일 유형 탭 → `types` 파라미터. '전체' 탭이면 `types` 를 보내지 않는다. 탭·검색 변경 시 1페이지로 리셋.
   - `pageCount = max(1, totalPageSize)`. URL `?page=` 가 `pageCount` 를 넘으면 마지막 페이지로 `replace` 보정한다.
   - 디자인에 로딩/오류 화면이 없으므로 상태 카드 없이 빈 목록만 렌더. 빈 상태 높이 `EMPTY_MIN_HEIGHT`.

## 규칙 준수

- 공통 `api`만 사용, `useQuery`로 조회, request/response 타입 분리, `any`/`@ts-ignore` 없음, Query Key 배열 유지.
- Contract 밖 필드 사용 안 함(응답 `documents[].id/title/type/createdAt`, `totalPageSize` 만 사용).

## 이전 계획 대비 변경(2026-09-17)

- 응답이 배열 → `{ documents, totalPageSize }` 로 바뀌어, "배열 길이가 size 와 같으면 다음 페이지가 있다고 가정"하고
  "빈 응답이면 직전 페이지로 복귀"하던 추정 로직을 삭제했다.
- 자료 타입 탭의 임시 클라이언트 필터(현재 페이지 내에서만 거르던 방식)를 서버 `types` 필터로 교체했다.

## 범위 제외

- 정렬 방향 UI 배선(항상 `DESC` 고정).
- 상세/생성/수정/삭제 API. 실제 서버 테스트(`real_server.enabled: false`).
