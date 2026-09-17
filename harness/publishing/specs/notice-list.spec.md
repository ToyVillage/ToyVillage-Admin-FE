---
feature: notice-list
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1:2721
  relatedNodeIds:
    - 219:11929
    - 219:11946
    - 221:12619
    - 223:12279
requires_functional_test: true
paths: src/pages/notices/notice, src/features/create-notice, src/entities/notice
---

# 공지사항 목록 행동명세

## 목적

토이빌리지 공지사항 목록 화면. 상단 제목 + 생성 버튼, 분류 탭, 목록 테이블(분류/제목/날짜).

## 동작 (source of truth)

- "공지 생성하기" 버튼 클릭 → 공지 생성 페이지(`/notices/list/create`)로 이동.
- 분류 탭(전체 / 팀이름…) 클릭 → 선택 탭이 활성화되고 목록이 해당 분류로 필터.
- 목록의 행 클릭 → 해당 공지의 읽기 전용 상세 `/notices/list/:id`로 이동한다(`notice-detail.spec.md`).
- 각 행 오른쪽 80px 칸에 케밥(⋮) 버튼을 둔다. 케밥 클릭은 행 이동을 일으키지 않는다.
- 케밥 클릭 → `수정`·`삭제` 메뉴(Figma `219:11929`)가 열린다. 한 번에 한 행의 메뉴만 열린다. 바깥 클릭·Escape로 닫힌다.
- `수정` → `/notices/list/:id/edit`로 이동한다(`notice-edit.spec.md`).
- `삭제` → 메뉴를 닫고 삭제 확인 dialog(Figma `219:11946`, 기존 `DeleteConfirmationDialog`)를 연다.
  - `취소`·Escape → 삭제하지 않고 닫는다.
  - `확인` → 해당 ID로 삭제 요청을 한 번 보낸다. 요청 중 중복 확인을 막는다.
  - 성공 → 공지 목록 query를 갱신해 행이 사라지고 성공 토스트 `데이터 삭제에 성공했습니다`를 보인다.
  - 실패 → dialog를 닫고 목록을 유지하며 오류 토스트 `데이터 삭제에 실패했습니다`(Figma `223:12279`)를 보인다.
- 기존 분류 탭·검색·정렬·페이지네이션 동작은 유지한다.

## 데이터

- 서버 데이터: 공지 목록(분류, 제목, 날짜). 이번 슬라이스는 mock(entities/notice)로 대체, 추후 TanStack Query.

## 컴포넌트 구조/props (Figma flat → 여기서 명세)

- `NoticeListPage` (pages/notice) — 헤더 + 탭 + 테이블 조합
- `CreateNoticeButton` (features/create-notice) — `/notices/list/create`로 이동하는 버튼
- `NoticeTable` (entities/notice) — rows: `{ id, category, title, date }[]`
- `CategoryTabs` — `categories: string[]`, `active`, `onSelect`

## 비고

- 2026-09-17: 기준 파일을 폐기된 `toyvillage-dev`(`fkbMQaiPeIufKzjXXoWAPS`)에서 `yot`로 교체. 섹션 `공지사항 · 목록`(`309:12757`).
- Figma 설명 "직원 권한에서는 케밥 자체를 숨김"은 저장소에 권한 구분이 아직 없어 이번 범위에서 제외한다.
- 삭제는 이미 연동된 `deleteNotice`를 재사용한다(새 API 연결 아님).

- 색/폰트는 tokens.ts에 개발자가 명명해 반영(핑크 강조 #FF8181 등). 폰트 Wanted Sans(폴백 포함).
