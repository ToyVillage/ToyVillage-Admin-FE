# Implementation Plan — notice-query

## 승인 기준

- HTTP 500 backtick 무시와 백엔드 PR #94의 `createdAt`,
  `files: FileResponse[]` 상세 응답을 사용자 승인 기준으로 동결한다.
- 실제 서버 테스트는 disabled이다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`
- TanStack Query `useQuery`
- 기존 `['notices', id]` query key
- 기존 상세 loading·복구 UI와 `NoticeForm`
- 목록 조회의 응답 검증·카테고리 정규화 패턴

## 변경 파일

- `src/entities/notice/api/types.ts`
- `src/entities/notice/api/noticeApi.ts`
- `src/entities/notice/index.ts`
- `src/pages/notices/notice/NoticeDetailPage.tsx`
- `tests/e2e/api/notice-query.spec.ts`

## 타입과 API 함수

- Contract 그대로 `NoticeQueryRequest`, `NoticeQueryResponse`, `NoticeQueryErrorResponse`를 정의한다.
- `getNotice({ id })`는 공통 Axios 인스턴스로 `/notice/{id}`를 호출한다.
- unknown 응답을 Contract 필드로 검증한 뒤 기존 `Notice`로 매핑한다.
- `id`는 API integer에서 라우트·도메인용 string으로 변환한다.
- `kind`는 category, `createdAt`은 date로 매핑한다.
- `files` 각 항목의 `fileName`, `fileKey`를 검증하고 `fileName` 목록을
  `Notice.attachments`로 매핑한다.

## Query와 오류

- 조회이므로 `useQuery`를 사용한다.
- query key는 `['notices', id]`를 유지한다.
- route id가 양의 integer일 때만 query를 활성화한다.
- HTTP 404는 기존 not-found UI, 그 외 오류는 alert UI로 표시한다.
- 오류를 mock이나 기본 객체로 대체하지 않는다.

## UI 연결

- 첨부파일명을 포함한 조회 결과를 기존 `NoticeForm`의 `initialNotice`로
  전달해 첨부 chip을 표시한다.
- 이탈 방지, 목록 이동, 수정·삭제 mock mutation은 유지한다.

## 검증 순서

1. API Contract validator
2. API approval gate
3. API policy
4. ESLint
5. Typecheck
6. Build
7. Mock Playwright API scenario

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- `kind` 실제 enum이 확인되면 Contract 재승인 후 수정한다.
- 수정·삭제 실제 API는 별도 API ID와 Contract로 연동한다.
