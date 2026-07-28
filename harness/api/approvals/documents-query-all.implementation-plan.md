# Implementation Plan — DOCUMENTS_QUERY_ALL

## 변경/생성 파일

1. `src/entities/resource/api/getDocuments.ts` (신규)
   - request 타입: `DocumentsQueryAllRequest { page: number; size: number; keyword?: string; orderDirection?: DocumentOrderDirection }`, `DocumentOrderDirection = 'ASC' | 'DESC'`.
   - `getDocuments(params)` → `api.get<unknown>('/documents', { params })` + 런타임 배열 검증(`id`/`title`) 후 해당 페이지 `Resource[]`로 매핑(서버 사이드 페이지네이션).
   - 매핑: `id`→String, `type`→`documentTypeToFileType` 역매핑(미지값 `etc`), `createdAt`→`YYYY.MM.DD`.
2. `src/entities/resource/model/types.ts` (수정)
   - `documentTypeToFileType: Record<DocumentType, FileType>` 추가(PDF→pdf, JPEG/JPG→jpg, PNG→png, OTHER→etc).
3. `src/entities/resource/index.ts` (수정)
   - `getDocuments`, `getAllDocuments`, 타입 `DocumentsQueryAllRequest`/`DocumentOrderDirection`, `documentTypeToFileType` export.
4. `src/pages/notices/resources/ResourceListPage.tsx` (수정)
   - 서버 사이드 페이지네이션: `useQuery({ queryKey: ['resources','list',{ page, size: 10, keyword }], queryFn: () => getDocuments({ page: page-1, size: 10, keyword, orderDirection: 'DESC' }), placeholderData: prev })`. page 이동 시 자동 재요청.
   - 응답에 총개수가 없어 `hasNextPage = pageItems.length === 10`로 다음 페이지 유무 판단, `pageCount = hasNextPage ? page+1 : page`(백엔드 총개수 확정 시 정식 번호로 전환).
   - keyword 는 서버 파라미터. 자료 타입 탭은 API 필터가 없어 현재 페이지 내 임시 클라이언트 필터('전체' 우선, 타입은 백엔드 파라미터 요청 대상).
   - 디자인에 로딩/오류 화면이 없으므로 상태 카드 없이 빈 목록만 렌더. 빈 상태 높이 `EMPTY_MIN_HEIGHT`.

## 규칙 준수

- 공통 `api`만 사용, `useQuery`로 조회, request/response 타입 분리, `any`/`@ts-ignore` 없음, Query Key 배열 유지.
- Contract 밖 필드 사용 안 함(응답 `id/title/type/createdAt`만 사용).

## 범위 제외

- 서버측 `keyword`/`orderDirection` 파라미터의 UI 배선(클라이언트 필터/정렬 유지).
- 상세/수정/삭제 조회 API. 실제 서버 테스트(`real_server.enabled: false`).
