---
feature: permissions
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 3830:25854
  relatedNodeIds:
    - 3830:25855 # 권한 관리 · 목록
    - 3830:25856 # 권한 관리 · 지정
    - 3830:25857 # 권한 관리 · 해제
requires_functional_test: true
paths: src/pages/settings/permissions, src/features/assign-middle-manager, src/entities/employee, src/shared/ui, src/app, src/features/sidebar, src/features/export-excel
---

# 권한 관리 행동명세

## 상태와 근거

- Status: Draft
- Last refreshed: 2026-11-03
- 이슈: #289 권한 관리(중간 관리자) 퍼블리싱
- 기준 섹션: Figma yot `3830:25854`(`권한 관리`). 하위 3개 섹션이 **한 페이지의 상태 분기**다.
  - 목록 `3830:25855` — 기본(`3830:25860`), 빈 상태(`3832:25857`)
  - 지정 `3830:25856` — 모달 기본(`3832:25934`), 2명 선택(`3832:26069`), 성공 토스트(`3832:26206`)
  - 해제 `3830:25857` — 확인 모달(`3832:26328`), 성공 토스트(`3832:26429`)
- 부모 섹션의 다른 형제를 확인했다. `권한 관리 · 토스트` 같은 별도 섹션은 없고, 토스트는 지정·해제 섹션 안의 프레임 2개가 전부다.
- 파일 안의 `중간 관리자` 섹션(`3156:25524`)은 iPhone 앱 화면이라 이 범위가 아니다.
- 추출 캐시: `harness/artifacts/publishing/permissions.figma.txt`(`get_design_context` 원문)
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`
- 개발자 결정(2026-11-03):
  - 목록은 페이지네이션 없이 전체를 한 번에 보인다. Figma 푸터의 숨김 페이지네이션(`3832:26267`)은 쓰지 않는다.
  - 공용 변경 3건(`Checkbox` 이동, `OutlinedSearchField`·`EmployeeIdentity` 추출)을 승인했다.
  - Figma 에 없는 문구 3개(실패 토스트 2개, 지정 가능 직원 없음)를 이 명세의 문구대로 쓴다.
  - 해제 확인 모달은 공용 모달을 그대로 쓴다(시각 차이는 비고 참고).
  - 시나리오는 페이지네이션 항목(옛 S17)을 뺀 나머지를 승인하고, 승인 스크립트 실행을 AI 에게 맡겼다.

## 목적

운영 관리자가 토이빌리지 직원 중 중간 관리자를 지정하고 해제하는 화면이다.

## 범위

- 포함: `/settings/permissions` 라우트, 중간 관리자 목록(이름·아이디·지정일·해제 버튼·총 인원)과 빈 상태,
  이름/아이디 검색, 지정 모달(검색·다중 선택), 해제 확인 모달, 결과 토스트, 사이드바 연결
- 제외: 실제 API 연동(`/api` 스킬 담당), 중간 관리자 권한에 따른 메뉴·기능 제한, 행 클릭 상세 화면(Figma 없음),
  목록 페이지네이션

## 라우트와 진입

- `/settings/permissions` → 권한 관리 화면을 표시한다.
- 인증이 필요한 관리자 화면이므로 `RequireAuth` 와 전역 레이아웃 안에 둔다.
  Figma 좌상단 `ic:twotone-menu` 는 기존 `SidebarToggleButton` 이다.
- 사이드바 `설정 > 권한 관리` 의 이동 대상을 `/settings/permissions` 로 연결한다.
  이 경로에서는 해당 하위 항목이 활성이다. 사이드바 동작 계약은 `sidebar.spec.md` 를 따른다.

## 동작 (behavioral spec — source of truth)

### 진입과 목록

- 화면 진입 → 제목 `권한 관리`, 부제 `토이빌리지 중간 관리자 지정 및 해제`,
  오른쪽 `＋ 중간 관리자 지정` 버튼, 그 아래 검색 입력(placeholder `이름 또는 아이디 검색`), 목록 카드가 보인다.
- 목록 머리행은 `이름` / `지정일` 과 라벨 없는 해제 열이다.
- 각 행은 다음을 보인다.
  - 아바타(이름 첫 글자, 파란 원) + 이름 + 그 아래 아이디
  - 지정일 `YYYY.MM.DD`
  - `해제` 버튼
- 카드 하단 왼쪽에 `총 N명`(검색 조건에 맞는 전체 인원)이 있다.
- 목록은 지정일이 오래된 순서다. 새로 지정한 사람은 맨 아래에 붙는다(Figma `3832:26206`).
- 페이지를 나누지 않고 중간 관리자 전체를 한 번에 보인다.

### 빈 상태

- 중간 관리자가 한 명도 없고 검색어도 없으면 머리행 아래에
  `지정된 중간 관리자가 없어요` / `중간 관리자 지정 버튼으로 직원을 지정해 보세요` 두 줄을 가운데에 보인다.
  이때 `총 N명` 푸터는 없다(Figma `3832:25857`).
- `＋ 중간 관리자 지정` 버튼과 검색 입력은 그대로 보인다.

### 검색

- 검색 입력에 글자를 넣으면 **이름 또는 아이디**에 그 글자가 든 사람만 남는다(대소문자 무시, 앞뒤 공백 무시).
- 입력은 기존 목록 화면과 같이 200ms 디바운스 후 반영한다.
- 검색어는 URL 쿼리(`keyword`)에 둔다. 빈 검색어는 URL 에서 뺀다. 새로고침·뒤로가기 시 같은 검색 결과를 복원한다.
- 결과가 없으면 표에 `검색결과가 없습니다` 를 보이고 `총 0명` 이다(다른 목록 화면과 같은 문구).

### 중간 관리자 지정

- `＋ 중간 관리자 지정` 클릭 → 모달이 열린다.
  제목 `중간 관리자 지정`, 부제 `중간 관리자로 지정할 직원을 선택하세요`,
  검색 입력(placeholder `이름 또는 아이디 검색`), 직원 목록, `취소` / `지정하기` 버튼.
- 모달이 열리면 검색 입력에 포커스가 간다. 검색어와 선택은 비어 있다.
- 직원 목록은 **아직 중간 관리자가 아닌 직원**만 보인다. 각 행은 체크박스 + 아바타 + 이름 + 아이디다.
- 목록은 5행까지 한 번에 보이고, 더 많으면 목록 안에서 세로로 스크롤한다(모달 높이는 늘지 않는다).
- 행 어디를 눌러도 선택이 토글된다. 선택된 행은 체크박스가 켜지고 배경이 회색(`#F5F5F7`)이다.
- 버튼 문구와 상태는 선택 인원을 따른다.
  - 0명: `지정하기`, 비활성(회색 `#848491`)
  - N명: `N명 지정하기`, 활성(`#36363F`)
- 모달 검색은 이름 또는 아이디로 직원 목록을 바로 거른다(대소문자·앞뒤 공백 무시, URL 에 두지 않는다).
  걸러져 안 보이는 직원의 선택도 유지되고 인원에 포함되며 함께 지정된다.
- 검색 결과가 없으면 목록 자리에 `검색결과가 없습니다` 를 보인다.
- 지정할 수 있는 직원이 한 명도 없으면 목록 자리에 `지정할 수 있는 직원이 없습니다` 를 보인다.
- 직원 목록 조회가 실패하면 "직원 없음"으로 보이지 않게 목록 자리에 `직원 목록을 불러오지 못했습니다. 다시 시도해 주세요.` 를 보인다.
- `N명 지정하기` 클릭 → 모달이 닫히고 성공 토스트 `권한 부여에 성공했습니다` 가 뜬다.
  지정한 직원이 목록 맨 아래에 오늘 날짜로 추가되고(모달 목록 순서대로) `총 N명` 이 늘어난다.
- 제출 중에는 버튼을 비활성화하고 `aria-busy` 로 알리며, 중복 제출을 막는다. 제출 중에는 닫지 않는다.
- 실패하면 모달과 선택을 그대로 두고 실패 토스트 `권한 부여에 실패했습니다` 를 띄운다.
- `취소` / 딤 바깥 클릭 / `Escape` → 아무도 지정하지 않고 모달이 닫힌다. 다시 열면 검색어·선택은 비어 있다.
- 모달이 닫히면 포커스는 `＋ 중간 관리자 지정` 버튼으로 돌아간다.

### 중간 관리자 해제

- 행의 `해제` 클릭 → 확인 모달이 열린다.
  제목 `중간 관리자를 해제하시겠습니까?`, 설명 `해제하면 {이름}님은` / `직원 권한으로 돌아갑니다` 두 줄,
  `취소` / `해제` 버튼. 모양은 공통 삭제 확인 모달과 같다.
- `취소` / `Escape` → 아무것도 바꾸지 않고 닫히며, 포커스는 그 행의 `해제` 버튼으로 돌아간다.
- `해제` → 모달이 닫히고 그 행이 목록에서 사라지며 `총 N명` 이 1 줄고,
  성공 토스트 `권한 해제에 성공했습니다` 가 뜬다.
- 실패하면 실패 토스트 `권한 해제에 실패했습니다` 가 뜨고 행은 그대로다.
- 해제된 직원은 다시 지정 모달의 직원 목록에 나타난다.
- 마지막 한 명을 해제하면 빈 상태로 바뀐다.

### 로딩과 조회 실패

- 첫 조회 중에는 공용 `DataTable` 로딩 표시(3행, Figma 기본 프레임 행 수)를 쓴다.
- 조회 실패는 `중간 관리자 목록을 불러오지 못했습니다. 다시 시도해 주세요.` 상태 카드를 보인다(다른 목록 화면과 같다).

## 데이터와 API 경계

```ts
interface MiddleManager {
  id: number
  name: string
  username: string
  /** ISO 날짜(YYYY-MM-DD). 화면은 YYYY.MM.DD 로 표시한다. */
  assignedAt: string
}

interface AssignableEmployee {
  id: number
  name: string
  username: string
}
```

- 서버 데이터는 TanStack Query 로 다룬다. 쿼리키 후보 `['middle-managers', 'list']`, `['middle-managers', 'assignable']`.
- 퍼블리싱에서는 **mock 함수(Promise)** 를 경계로 둔다. 실제 API 연결과 교체는 `/api` 스킬이 한다.
  - `getMiddleManagers()`, `getAssignableEmployees()`, `assignMiddleManagers(ids)`, `releaseMiddleManager(id)`
  - 초기 데이터는 Figma 값이다. 중간 관리자 3명(김수인 `suin.kim` 2026-07-03 / 이승현 `seunghyun.lee` 2026-09-01 /
    이지아 `jia.lee` 2026-10-20), 지정 가능 직원 5명(박도현 `dohyun.park` / 최민지 `minji.choi` / 정하윤 `hayun.jung` /
    오세훈 `sehun.oh` / 한지민 `jimin.han`).
  - mock 상태는 메모리에만 있어 새로고침하면 초기값으로 돌아간다.
- 검색은 퍼블리싱 단계에서 클라이언트가 한다.
- 클라이언트 상태: 열린 모달, 해제 대상, 토스트, 모달 안 검색어·선택은 지역 상태. 목록 검색어는 URL.

## 컴포넌트 구조/props

- `PermissionsPage` (pages/settings/permissions) — `/settings/permissions` 화면. URL 상태·모달·토스트를 소유한다.
- `MiddleManagerTable { managers, total, showTotal, emptyLabel, emptyMinHeight, renderRowAction, loading }`
  (entities/employee/ui) — 공용 `DataTable` 에 열·외형을 입힌다. 열 폭은 이름 560 / 지정일 600 / 해제 160.
- `EmployeeIdentity { name, username }` (entities/employee/ui) — 아바타 + 이름 + 아이디. `StaffAccountTable` 안 코드를 옮겨 세 곳이 함께 쓴다.
- `AssignMiddleManagerDialog { employees, loading, onSubmit, onCancel, onAssigned, onError }` (features/assign-middle-manager/ui)
  — 검색·선택·제출을 자체 상태로 가진다.
- 재사용: `PageHeader`, `PillButton`, `DataTable`, `Toast`, `DeleteConfirmationDialog`(`title`·`description`·`confirmLabel`·`pendingLabel` 이미 있음), `trapTab`, `motion`.
- 공용 변경(2026-11-03 승인):
  - `Checkbox`: `features/export-excel/ui/ExportCheckbox` 와 에셋을 `shared/ui` 로 옮겨 이름을 바꾸고 엑셀 화면도 그것을 쓴다.
    Figma `checkbox / on`·`off` 28px 가 같고, feature 끼리는 import 할 수 없다.
  - `OutlinedSearchField { value, onChange, placeholder, ariaLabel, inputRef }`: `StaffAccountsPage` 안의 흰 테두리 검색 입력(높이 52, radius 8)을
    `shared/ui` 로 옮겨 직원 계정 관리·권한 관리 목록·지정 모달이 함께 쓴다. 폭은 호출부가 정한다(목록 400, 모달 꽉 차게).
    기존 `SearchBar` 는 높이 60·radius 44 라 규격이 달라 그대로 둔다.

## 접근성

- 검색 입력은 각각 `aria-label="이름 또는 아이디 검색"` 을 준다.
- `해제` 버튼은 `aria-label="{이름} 중간 관리자 해제"` 다.
- 지정 모달은 `role="dialog"` + `aria-modal` + 제목·부제 연결, 포커스를 모달 안에 가둔다.
- 직원 행은 네이티브 체크박스를 쓰고 `label` 로 이름과 연결한다. `Space` 로 토글할 수 있다.
- 비활성 `지정하기` 는 `disabled` 다. 빈 상태·검색 결과 없음은 `role="status"` 다.

## 반응형

- 1920×1080 에서 콘텐츠 폭 1320px(좌 300px)을 기준으로 한다. 뷰포트가 좁으면 콘텐츠가 가용 폭으로 줄고
  표는 공용 `DataTable` 규칙을 따른다. 모바일 정밀 배치는 Figma 미제공.
- 모달 폭은 640px 이고 화면이 좁으면 좌우 40px 여백을 남기고 줄어든다.

## 비고 / 제약

- 스타일은 Emotion. solid color/font family 는 theme 의미 토큰, px·rgba 등은 styled 에 직접 쓴다.
- 토큰 대조 결과 신규 의미 토큰 후보는 없다(색 14개 모두 기존 값).
- Figma 의 `Inter` 는 디자인 파일 기본값 흔적이며 구현은 `Wanted Sans`(`theme.font.body`)를 쓴다.
- 해제 확인 모달은 공용 `DeleteConfirmationDialog` 를 그대로 쓴다. Figma 와 작은 차이가 남는다
  (Figma 는 `취소` 테두리·글자색 `#848491`, 높이 300이고, 공용은 테두리 `#C6C6CE`, 최소 높이 309다).
  공용을 바꾸면 다른 화면이 변하므로 공용을 따른다.
- 기존 `tests/e2e/sidebar.spec.ts` S9 는 `권한 관리` 를 화면 없는 항목의 예로 쓴다.
  화면이 생기므로 아직 화면이 없는 다른 하위 항목으로 바꾼다. `sidebar.spec.md` 의 표도 함께 고친다.
