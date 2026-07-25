---
feature: sidebar
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 1541:1408
requires_functional_test: true
paths: src/app, src/features/sidebar, src/shared/ui
---

# 사이드바 행동명세

## 목적

토이빌리지 앱의 전역 사이드바 내비게이션. 화면 좌측 메뉴 아이콘을 통해 열고 닫을 수 있으며, 공지사항 관련 하위 화면으로 이동하는 공통 진입점을 제공한다.

## 동작 (source of truth)

- 메뉴 아이콘 클릭 → 사이드바가 열린다.
- 열린 상태에서 닫기 버튼 또는 dim 영역 클릭 → 사이드바가 닫힌다.
- `Esc` 키 입력 → 사이드바가 닫힌다.
- 사이드바가 열린 동안 본문 스크롤은 잠긴다.
- 메뉴 항목 클릭 → 해당 라우트로 이동하고 사이드바가 닫힌다.
- 현재 라우트와 일치하는 메뉴 항목은 활성 상태로 표시한다.
- 데스크톱/모바일 모두 동일한 메뉴 목록을 사용한다. 화면 폭이 좁을 때는 오버레이 형태로 본문 위에 표시한다.

## 메뉴

- 공지사항 → `/notices/list`
- 운영안내 → `/notices/guide`
- 자료실 → `/notices/resources`
- 단체예약현황 → `/notices/reservations`

## 데이터

- 서버 데이터: 없음.
- 클라이언트 상태: 사이드바 열림/닫힘 상태. 전역 UI 상태가 필요하면 Zustand를 사용한다.

## 컴포넌트 구조/props (Figma flat → 여기서 명세)

- `SidebarToggleButton` — 메뉴 아이콘 버튼. 클릭 시 사이드바를 연다.
- `Sidebar` — 열린 상태의 내비게이션 패널. 메뉴 목록, 닫기 버튼, 활성 메뉴 표시를 담당한다.
- `SidebarNavItem` — `label`, `to`, `active`, `onClick`을 받아 메뉴 항목을 렌더링한다.
- `SidebarOverlay` — dim 영역. 클릭 시 사이드바를 닫는다.

## 접근성

- 메뉴 아이콘은 버튼 요소로 구현하고 `aria-label="사이드바 열기"`를 제공한다.
- 사이드바 닫기 버튼은 `aria-label="사이드바 닫기"`를 제공한다.
- 사이드바 패널은 `aria-modal` 또는 동등한 modal/dialog 접근성 처리를 적용한다.
- 키보드 포커스는 열린 사이드바 내부에서 이동 가능해야 하며, 닫힌 뒤에는 메뉴 아이콘으로 돌아간다.

## 비고 / 제약

- 스타일은 Emotion을 사용한다. solid color/font family는 theme 의미 토큰을 쓰고, px·rgba·spacing·radius 등 구현값은 styled 블록에 직접 작성한다.
- 라우팅은 React Router의 `Link` 또는 `NavLink`를 사용한다.
- 현재 `NoticeListPage` 안에 임시로 있는 햄버거 아이콘은 사이드바 구현 시 공통 토글 컴포넌트로 대체한다.
- Figma 사이드바 프레임 nodeId가 확정되면 frontmatter의 `figma.nodeId`를 갱신한다.
