---
feature: sidebar
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1:2720
  relatedNodeIds:
    - 1:12061
    - 1:12062
    - 1692:14930
    - 1692:14978
    - 1692:15026
    - 1692:15074
    - 1692:15122
    - 1694:14943
requires_functional_test: true
paths: src/app, src/features/sidebar, src/shared/ui
---

# 사이드바 행동명세

## 상태와 근거

- Status: Active
- Last refreshed: 2026-09-15
- 기준: Figma `P7Jhnu8qV5m9q2QJNzkwAN` 의 컴포넌트셋 `sidebar`(`1:12061`).
  화면에 놓인 인스턴스는 `1:2720`(`열린메뉴=없음`)이다.
- variant 는 펼쳐진 대분류를 나타낸다: `열린메뉴=없음 / 공지사항 / 업무관리 / 개체관리 / 시설관리 / 재고관리 / 설정`.
  즉 **한 번에 하나의 대분류만 펼쳐진다.**
- 2026-09-15 작업 도중 `1:2720` 이 아코디언 구조로 재설계됐다. 이전에 승인했던
  "대시보드 + 점선 바로가기 4개 + 최상위 7개" 구성은 폐기한다.
- 추출 캐시: `harness/artifacts/publishing/sidebar.figma.txt`

## 목적

토이빌리지 앱의 전역 사이드바 내비게이션. 화면 좌측 메뉴 아이콘으로 열고 닫으며,
대분류 아코디언을 펼쳐 하위 화면으로 이동한다.

## 동작 (source of truth)

- 메뉴 아이콘 클릭 → 사이드바가 열린다.
- 열린 상태에서 닫기 버튼 또는 dim 영역 클릭 → 사이드바가 닫힌다.
- `Esc` 키 입력 → 사이드바가 닫힌다.
- 사이드바가 열린 동안 본문 스크롤은 잠긴다.
- `대시보드` 는 아코디언이 아니라 바로 이동하는 단일 메뉴다. 클릭 → `/` 로 이동하고 사이드바가 닫힌다.
  현재 경로가 정확히 `/` 일 때만 활성(blue 텍스트/아이콘 + blue 배경 밴드, radius 12px)으로 표시한다.
- 대분류 헤더 클릭 → 그 대분류가 펼쳐지고, 이미 펼쳐져 있었다면 접힌다.
  다른 대분류를 펼치면 앞서 펼쳐져 있던 대분류는 접힌다(한 번에 하나).
- **대분류 헤더는 이동하지 않는다.** 화면 이동은 하위 항목만 한다.
- 대분류 헤더 우측의 chevron 은 접힘일 때 아래, 펼침일 때 위를 향한다.
- 하위 항목 클릭 → 해당 라우트로 이동하고 사이드바가 닫힌다.
- 사이드바를 열 때 현재 경로가 속한 대분류를 자동으로 펼친다.
  상세/생성 같은 하위 경로(`/tasks/:id` 등)도 같은 항목의 범위로 본다.
- 화면이 없는 하위 항목은 링크가 아닌 `aria-disabled` 항목으로 렌더링하고, 화면이 생기면 `to`만 채운다.
- Figma 에 하위 항목의 활성 상태가 없으므로 하위 항목에는 활성 표시를 하지 않는다.
- 데스크톱/모바일 모두 동일한 메뉴 목록을 사용한다. 화면 폭이 좁을 때는 오버레이 형태로 본문 위에 표시한다.

## 메뉴

### 단일 메뉴

| 라벨 | 아이콘(Figma) | 이동 |
|------|---------------|------|
| 대시보드 | `boxicons:blocks-filled` | `/` |

### 대분류 아코디언 (순서 고정)

| 대분류 | 아이콘 | 하위 항목 → 이동 |
|--------|--------|------------------|
| 공지사항 | `majesticons:megaphone` | 공지사항 → `/notices/list` · 휴관일 관리 → `/notices/guide` · 자료실 → `/notices/resources` · 단체예약 → `/notices/reservations` |
| 업무관리 | 클립보드 | 업무지시 → `/tasks` · 업무보고 → `/task-reports` · 업무일지관리 → `/work-logs` |
| 개체관리 | paw | 개체 카드 → 화면 미구현 · 먹이 급여 관리 → `/feeds` |
| 시설관리 | 계단 | 점검 · 보수요청 / 공통 · 3층 / 4층 / 5층 / 6층 → 모두 화면 미구현 |
| 재고관리 | 상자 | 식음료 / 동물 먹이 / 사육용품 / 비품 / 소모품 / 기타 → 모두 화면 미구현 |
| 설정 | `mdi:cog` | 팀 설정 / 직원 계정 관리 / 권한 관리 → 모두 화면 미구현 |

## 치수 (Figma)

- 패널 400 × 1080, radius `0 20px 20px 0`, shadow `4px 0 10px rgba(0,0,0,0.1)`
- 닫기 버튼 (36,32) 36×36 / 프로필 y=92, avatar 64, gap 12, 이름 26px Medium
- 메뉴 묶음 x=20, y=222, width 360, 세로 gap 8
- 대분류·대시보드 항목: padding `12px 36px`, gap 12, 아이콘 32, 라벨 22px SemiBold, radius 12px
- chevron 24×24(선 `#858591`), 항목 왼쪽 기준 x=300 y=16 절대 위치
- 하위메뉴 묶음: padding `4px 0`, gap 4
- 하위 항목: padding `11px 36px 11px 92px`, radius 12px, 라벨 20px Medium `#5C5C69`
  (선택 상태는 배경 `#E8E9FF` + 텍스트 `#4952FF`)

## 데이터

- 서버 데이터: 없음.
- 클라이언트 상태: 사이드바 열림/닫힘은 Zustand(`useSidebarStore`), 펼쳐진 대분류는 `Sidebar` 지역 상태.

## 컴포넌트 구조/props

- `SidebarGroup` / `SidebarSubItem` / `SidebarDashboardItem` — 컴포넌트가 아니라 메뉴 데이터 타입.
- `SidebarToggleButton` — 메뉴 아이콘 버튼. 클릭 시 사이드바를 연다.
- `Sidebar` — 패널. 프로필, 대시보드 항목, 대분류 목록, 닫기 버튼, dim 영역, 펼침 상태를 담당한다.
- `SidebarItem { item, active, onClick }` — 대시보드 단일 메뉴 한 줄.
- `SidebarGroupSection { group, open, activeItemId, onToggle, onNavigate }` — 대분류 헤더 + 하위 목록.
- `SidebarIcon { name }` — 아이콘 mask.
- dim 영역은 별도 공개 컴포넌트가 아니라 `Sidebar` 내부 요소로 두고, 클릭 시 사이드바를 닫는다.

## 접근성

- 메뉴 아이콘은 버튼 요소로 구현하고 `aria-label="사이드바 열기"`를 제공한다.
- 사이드바 닫기 버튼은 `aria-label="사이드바 닫기"`를 제공한다.
- 사이드바 패널은 `aria-modal` 또는 동등한 modal/dialog 접근성 처리를 적용한다.
- 대분류 헤더는 `button` 으로 만들고 `aria-expanded` 와 `aria-controls` 를 제공한다.
- 키보드 포커스는 열린 사이드바 내부에서 이동 가능해야 하며, 닫힌 뒤에는 메뉴 아이콘으로 돌아간다.

## 비고 / 제약

- 스타일은 Emotion을 사용한다. solid color/font family는 theme 의미 토큰을 쓰고,
  px·rgba·spacing·radius 등 구현값은 styled 블록에 직접 작성한다.
- 라우팅은 React Router의 `Link` 를 사용한다.
- 신규 토큰: `color.subMenuText`(`#5C5C69`) — 하위 메뉴 텍스트, `color.menuChevron`(`#858591`) — 펼침 chevron.
- chevron 은 Figma 내보내기 SVG 의 viewBox 가 어긋나 있어 24×24 인라인 SVG 로 직접 그린다.
- `업무관리 > 업무지시` 를 `/tasks` 로 본다(업무관리 화면의 기존 라우트). 다른 매핑이 필요하면 spec 을 고친다.
- 패널 높이는 항상 화면 높이(`100dvh`)에 맞춘다. 메뉴가 펼쳐져 길어지면 패널이 화면 밖으로 밀려나지 않고
  메뉴 영역만 세로로 스크롤한다. 닫기 버튼과 프로필은 스크롤과 무관하게 제자리에 남는다.

## 개정 이력

- 2026-09-15: 활성 표시를 대분류가 아닌 **하위 항목**으로 옮기고(`1702:15280` 신규 컴포넌트셋),
  `설정` 대분류에 `mdi:cog` 아이콘을 넣었다. 하위 항목 radius 를 8px → 12px 로 바꿨다.
  패널이 화면 밖으로 나가지 않도록 높이를 `100dvh` 로 고정하고 메뉴 영역만 스크롤하게 했다.

- 2026-09-15: 기준 Figma 파일을 `P7Jhnu8qV5m9q2QJNzkwAN` 로 옮기고(구 `fkbMQaiPeIufKzjXXoWAPS` 폐기),
  메뉴 체계를 아코디언(단일 `대시보드` + 대분류 6개)으로 재편했다.
  `먹이 급여 관리` 는 `개체관리` 하위로 들어간다.
