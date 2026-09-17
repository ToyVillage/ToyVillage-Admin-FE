# Implementation Plan — notice-query-all

## 승인 기준

- 사용자 결정으로 보완한 Contract가 validator를 통과한다.
- 응답은 `{ notices, totalPageSize }` 객체, `page`는 1부터, 날짜 키는 `createdAt`(사용자 결정 2026-09-17)이다.
- 실제 서버 테스트는 disabled이다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`
- TanStack Query `useQuery`
- 기존 `['notices']` query key prefix
- `NoticeTable`과 DataTable 빈 상태

## 변경 파일

- `src/entities/notice/model/types.ts`
- `src/entities/notice/api/types.ts`
- `src/entities/notice/api/noticeApi.ts`
- `src/entities/notice/index.ts`
- `src/entities/notice/ui/NoticeTable.tsx`
- `src/pages/notices/notice/NoticeListPage.tsx`
- `tests/e2e/api/notice-query-all.spec.ts`

## 타입과 API 함수

- Contract 그대로의 `NoticeQueryAllRequest`, `NoticeQueryAllResponseItem`을 분리한다.
- UI에는 `NoticeListItem`을 사용한다.
- `id`는 API `number`에서 라우트용 `string`으로 변환한다.
- `kind`는 category, `createdAt`은 date로 매핑한다.

## Query/Mutation과 캐시

- 조회이므로 `useQuery`를 사용한다.
- 화면의 분류 탭·검색·정렬이 전체 목록 기준이므로 `page=1..totalPageSize`를 순서대로 조회해 합친다.
- query key는 `['notices', 'all', { size: 10 }]`이다.
- query function은 공통 Axios 인스턴스로 `/notice`를 호출한다.
- 오류 시 기본 배열이나 mock으로 대체하지 않는다.

## UI 연결

- 로딩 중 상태 문구를 표시한다.
- 오류 시 `role="alert"`로 실패를 드러낸다.
- 성공한 빈 배열은 기존 빈 상태 UI를 표시한다.
- 검색, 정렬, 클라이언트 화면 페이지네이션, 행 이동은 유지한다.

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
- access token 저장/주입 계층은 현재 저장소에 없어 후속 인증 연동이 필요하다.
- 백엔드가 enum 또는 필드명을 확정하면 Contract 재승인 후 수정한다.

## 2026-09-17 변경 (#112)

- Notion 최신 명세(09-16)와 스테이징 응답이 배열에서 `{ notices, totalPageSize }`로 바뀌었다.
- `page` 시작 번호는 명세 본문·스테이징 동작대로 1(명세 기본값 0 표기와 충돌 → 사용자 결정).
- 날짜 키는 스테이징 실제 응답 `createdAt`(명세 예시 `createAt`과 충돌 → 사용자 결정).
- 응답 형식이 Contract와 다르거나 중복 ID·페이지 크기 초과면 오류로 드러낸다(빈 목록으로 숨기지 않음).
- 함께 갱신: `tests/e2e/api/notice-query-all-pagination.spec.ts`, `notice-query-all-invalid-response.spec.ts`, 퍼블리싱 mock `tests/e2e/support/notice-api.ts`.
