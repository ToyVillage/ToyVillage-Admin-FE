---
feature: notice-list
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 1541:1442
requires_functional_test: true
paths: src/pages/notices/notice, src/features/create-notice, src/entities/notice
---

# 공지사항 목록 행동명세

## 목적

토이빌리지 공지사항 목록 화면. 상단 제목 + 생성 버튼, 분류 탭, 목록 테이블(분류/제목/날짜).

## 동작 (source of truth)

- "공지 생성하기" 버튼 클릭 → 공지 생성 페이지(`/notices/list/create`)로 이동.
- 분류 탭(전체 / 팀이름…) 클릭 → 선택 탭이 활성화되고 목록이 해당 분류로 필터.
- 목록의 행 클릭 → 해당 공지 상세로 이동(이번 슬라이스는 목록/생성 이동까지만).

## 데이터

- 서버 데이터: 공지 목록(분류, 제목, 날짜). 이번 슬라이스는 mock(entities/notice)로 대체, 추후 TanStack Query.

## 컴포넌트 구조/props (Figma flat → 여기서 명세)

- `NoticeListPage` (pages/notice) — 헤더 + 탭 + 테이블 조합
- `CreateNoticeButton` (features/create-notice) — `/notices/list/create`로 이동하는 버튼
- `NoticeTable` (entities/notice) — rows: `{ id, category, title, date }[]`
- `CategoryTabs` — `categories: string[]`, `active`, `onSelect`

## 비고

- 색/폰트는 tokens.ts에 개발자가 명명해 반영(핑크 강조 #FF8181 등). 폰트 Wanted Sans(폴백 포함).
