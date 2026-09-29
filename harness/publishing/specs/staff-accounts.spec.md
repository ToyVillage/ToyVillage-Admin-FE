---
feature: staff-accounts
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 2434:24498
  relatedNodeIds:
    - 2440:25583 # 직원 계정 관리 · 목록
    - 2440:25584 # 직원 계정 관리 · 생성
    - 2440:25585 # 직원 계정 관리 · 삭제
    - 2440:25586 # 직원 계정 관리 · 비밀번호 초기화
    - 1696:15473 # 사이드바 참고 (설정 > 팀 관리 / 직원 계정 관리 / 권한 관리)
requires_functional_test: true
paths: src/pages/settings/accounts, src/features/create-account, src/entities/employee, src/shared/ui, src/app, src/features/sidebar
---

# 직원 계정 관리 행동명세

## 상태와 근거

- Status: Draft
- Last refreshed: 2026-09-28
- 이슈: #192 직원 계정 관리 페이지
- 기준 프레임: Figma `2434:24498` ("직원 계정 관리" 섹션). 하위 4개 서브섹션이 **한 페이지의 상태 분기**다.
  - 목록 `2440:25583` — 기본(`2440:24771`), 케밥 열림(`2440:24928`)
  - 생성 `2440:25584` — 모달 기본(`2448:25023`), 빈 값 오류(`2448:25166`), 아이디 중복(`2448:25311`),
    서버 오류(`2448:25455`), 성공 토스트(`2448:25603`)
  - 삭제 `2440:25585` — 공통 삭제 확인 모달(`2440:25059`), 성공 토스트(`2440:25321`)
  - 비밀번호 초기화 `2440:25586` — 확인 모달(`2440:25190`), 성공 토스트(`2440:25452`)
- 사이드바 참고 프레임 `1696:15473`: `설정` 하위 항목이 `팀 관리` / `직원 계정 관리` / `권한 관리` 다.
- 추출 캐시: `harness/artifacts/publishing/staff-accounts.figma.txt`
  (Framelink `get_figma_data` 가 토큰 만료 403 이라 figma-remote `get_design_context` 로 추출했다)
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`
- 개발자 결정(2026-09-28):
  - 이 화면이 기존 단독 계정 생성 화면(`account-create`, `/settings/accounts/create`)을 **대체**한다.
    계정 생성은 이 화면의 모달로 옮기고, 기존 페이지와 라우트는 없앤다.
  - 사이드바 `설정 > 팀 설정` 라벨을 Figma 대로 `팀 관리` 로 바꾼다.
  - 개발자 위임 결정(2026-09-28): 개발자가 중간 게이트 초안(시나리오 S1–S18, 공용 prop 추가 3건,
    초기화 실패 문구, 케밥 폭 180 유지, 옛 화면 정리)을 그대로 승인하라고 지시해 AI 가 공식 승인 스크립트를 실행했다.

## 개정 (2026-09-28, API 연동)

- 직원 API(app-admin-controller) 연동: 목록 `APP_ADMIN_EMPLOYEE_QUERY_ALL`, 생성 `APP_ADMIN_EMPLOYEE_CREATE`(성공 200),
  비밀번호 초기화 `APP_ADMIN_EMPLOYEE_PASSWORD_RESET`, 삭제 `APP_ADMIN_EMPLOYEE_DELETE`(`harness/api/specs/app-admin-employee-*.spec.md`).
- `비밀번호` 열은 목록 응답에 필드가 없어 한때 뺐다가, 백엔드가 `passwordChanged`(boolean)를 추가해 원래대로 둔다.
  배지는 `passwordChanged` 가 true 면 `변경 완료`, false 면 `초기 비밀번호` 다. 시나리오는 S4 만 API 흐름에 맞춰 개정했다.
- 생성 성공 후 새 계정은 목록 맨 위에 끼워 넣지 않고 목록 재조회로 보인다(순서는 서버 응답 그대로).
- 조회 실패는 `직원 목록을 불러오지 못했습니다. 다시 시도해 주세요.` 상태 카드(다른 목록 화면과 같다).

## 목적

운영 관리자가 토이빌리지 직원 계정을 한눈에 보고, 새 계정을 만들고,
비밀번호를 초기화하거나 계정을 지우는 화면이다.

## 범위

- 포함: `/settings/accounts` 라우트, 목록 표(이름·아이디·비밀번호 상태·계정 생성일),
  이름/아이디 검색, 페이지네이션, 행 케밥 메뉴, 계정 생성 모달(검증·중복·서버 오류),
  비밀번호 초기화 확인 모달, 삭제 확인 모달, 결과 토스트, 사이드바 연결,
  `/settings/accounts/create` → `/settings/accounts` 리다이렉트
- 제외: 목록·삭제·비밀번호 초기화의 실제 API 연동(`/api` 스킬 담당), 권한별 케밥 숨김(권한 관리 화면 이후),
  행 클릭 상세 화면(Figma 없음), Figma 에 없는 로딩·에러·빈 목록 전용 화면

## 라우트와 진입

- `/settings/accounts` → 직원 계정 관리 화면을 표시한다.
- `/settings/accounts/create` → `/settings/accounts` 로 교체 이동(replace)한다.
- 인증이 필요한 관리자 화면이므로 `RequireAuth` 와 전역 레이아웃 안에 둔다.
  Figma 좌상단 `ic:twotone-menu` 는 기존 `SidebarToggleButton` 이다.
- 사이드바 `설정 > 직원 계정 관리` 의 이동 대상을 `/settings/accounts` 로 바꾼다.
  이 경로에서는 해당 하위 항목이 활성이다. 사이드바 동작 계약은 `sidebar.spec.md` 를 따른다.
- 사이드바 `설정 > 팀 설정` 라벨을 `팀 관리` 로 바꾼다(이동 대상 `/settings/teams` 는 그대로).

## 동작 (behavioral spec — source of truth)

### 진입과 목록

- 화면 진입 → 제목 `직원 계정 관리`, 부제 `토이빌리지 직원 계정 관리`,
  오른쪽 `＋ 계정 생성하기` 버튼, 그 아래 검색 입력(placeholder `이름 또는 아이디 검색`), 목록 카드가 보인다.
- 목록 머리행은 `이름` / `비밀번호` / `계정 생성일` 과 빈 케밥 열이다.
- 각 행은 다음을 보인다.
  - 아바타(이름 첫 글자, 파란 원) + 이름 + 그 아래 아이디
  - 비밀번호 상태 배지: 직원이 비밀번호를 바꿨으면 `변경 완료`(회색), 아니면 `초기 비밀번호`(주황)
  - 계정 생성일 `YYYY.MM.DD`
  - 케밥(⋮) 버튼
- 한 페이지에 **5행**을 보인다(Figma: 5행 · 총 12명 · 3페이지).
- 카드 하단 왼쪽에 `총 N명`(검색 조건에 맞는 전체 인원), 가운데에 페이지네이션이 있다.
  페이지가 1쪽뿐이면 페이지네이션은 숨긴다(공용 `DataTable` 동작).
- 목록 순서는 데이터가 준 순서를 그대로 쓴다(정렬 UI 없음).

### 검색

- 검색 입력에 글자를 넣으면 **이름 또는 아이디**에 그 글자가 든 계정만 남는다(대소문자 무시, 앞뒤 공백 무시).
- 입력은 기존 목록 화면과 같이 200ms 디바운스 후 반영하고, 반영 시 1페이지로 돌아간다.
- 검색어와 페이지는 URL 쿼리(`keyword`, `page`)에 둔다. 기본값(빈 검색어, 1페이지)은 URL 에서 뺀다.
  새로고침·뒤로가기 시 같은 검색 결과와 페이지를 복원한다.
- 결과가 없으면 표에 `검색결과가 없습니다` 를 보이고 `총 0명` 이다(다른 목록 화면과 같은 문구).

### 페이지네이션

- 페이지 번호 또는 좌우 chevron 클릭 → 그 페이지의 행으로 바뀌고 URL `page` 가 바뀐다.
- 첫 페이지에서 이전, 마지막 페이지에서 다음 chevron 은 비활성이다.
- 삭제 등으로 현재 페이지가 범위를 벗어나면 마지막 페이지로 옮긴다.

### 케밥 메뉴

- 행의 케밥 클릭 → 그 행 아래에 메뉴가 열린다. 항목은 `비밀번호 초기화`, `삭제`(빨간 글자) 순서다.
- 메뉴 바깥 클릭 / `Escape` → 메뉴가 닫힌다. 다른 행 케밥을 열면 앞 메뉴는 닫힌다.
- 메뉴 항목을 고르면 메뉴는 닫히고 해당 확인 모달이 열린다.

### 계정 생성

- `＋ 계정 생성하기` 클릭 → `계정 생성` 모달이 열린다.
  제목 `계정 생성`, 부제 `토이빌리지 직원 계정을 생성하세요`,
  `이름` 입력(placeholder `이름을 입력해주세요`), `아이디` 입력(placeholder `아이디를 입력해주세요`),
  파란 안내 `ⓘ 초기 비밀번호는 아이디와 같아요.`, `취소` / `계정 생성` 버튼.
- 모달이 열리면 이름 입력에 포커스가 간다. 두 입력은 비어 있고 오류는 없다.
- `계정 생성` 클릭 또는 입력 중 `Enter` → 이름·아이디를 함께 검증한다.
  - 앞뒤 공백을 뺀 값이 비어 있으면 미입력이다.
  - 미입력인 모든 필드에 빨간 테두리와 아래 오류 문구를 동시에 보인다
    (`이름을 입력해주세요` / `아이디를 입력해주세요`).
  - 포커스는 미입력인 첫 필드(이름 → 아이디)로 간다. 요청은 보내지 않는다.
- 오류가 난 필드에 입력하면 그 필드의 오류만 사라진다.
- 두 값이 유효하면 공백을 뺀 `{ name, username }` 으로 기존 계정 생성 API(`POST /app/admin/employees`)를 한 번 호출한다.
  제출 중에는 `계정 생성` 버튼을 비활성화하고 `aria-busy` 로 알리며, 중복 제출을 막는다.
- 성공 → 모달이 닫히고 성공 토스트 `계정 생성에 성공했습니다` 가 뜬다.
  새 계정이 목록 맨 위에 `초기 비밀번호` · 오늘 날짜로 추가되고 `총 N명` 이 1 늘어난다.
  (목록이 mock 인 동안의 로컬 반영이다. `/api` 연동 시 목록 재조회로 바꾼다.)
- 아이디 중복(409) → 모달을 유지하고 아이디 입력에 빨간 테두리와 `이미 사용 중인 아이디예요` 를 보이며,
  아이디 입력에 포커스를 둔다. 아이디를 고치면 이 오류는 사라진다. 토스트는 띄우지 않는다.
- 그 밖의 실패 → 모달과 입력값을 그대로 두고 실패 토스트 `데이터 생성에 실패했습니다` 를 띄운다.
- `취소` / 딤 바깥 클릭 / `Escape` → 계정을 만들지 않고 모달이 닫힌다. 다시 열면 입력·오류는 비어 있다.
  제출 중에는 닫지 않는다.
- 모달이 닫히면 포커스는 `＋ 계정 생성하기` 버튼으로 돌아간다.

### 비밀번호 초기화

- 케밥 메뉴 `비밀번호 초기화` → 확인 모달이 열린다.
  제목 `비밀번호를 초기화하시겠습니까?`, 설명 `초기화하면 비밀번호가 직원 아이디로 바뀝니다`,
  `취소` / `초기화` 버튼. 모양은 공통 삭제 확인 모달과 같다.
- `취소` / `Escape` → 아무것도 바꾸지 않고 닫힌다.
- `초기화` → 모달이 닫히고 그 행의 배지가 `초기 비밀번호` 로 바뀌며
  성공 토스트 `비밀번호 초기화에 성공했습니다` 가 뜬다.
  실패하면 실패 토스트 `비밀번호 초기화에 실패했습니다` 가 뜨고 배지는 그대로다
  (실패 문구는 Figma 에 없어 성공 문구에 맞춰 정했다 — 중간 게이트 확인 대상).
- 이미 `초기 비밀번호` 인 계정도 초기화할 수 있다(결과는 같다).

### 삭제

- 케밥 메뉴 `삭제` → 공통 삭제 확인 모달(`정말 삭제하시겠습니까?` /
  `삭제하신 뒤에는 영구삭제되며 복구 할 수 없습니다`)이 열린다.
- `취소` / `Escape` → 아무것도 지우지 않고 닫힌다.
- `확인` → 모달이 닫히고 그 행이 목록에서 사라지며 `총 N명` 이 1 줄고,
  성공 토스트 `데이터 삭제에 성공했습니다` 가 뜬다.
  실패하면 실패 토스트 `데이터 삭제에 실패했습니다` 가 뜨고 행은 그대로다.

## 데이터와 API 경계

```ts
interface StaffAccount {
  id: number
  name: string
  username: string
  /** 직원이 초기 비밀번호를 바꿨는지. false 면 `초기 비밀번호`. */
  passwordChanged: boolean
  /** ISO 날짜(YYYY-MM-DD). 화면은 YYYY.MM.DD 로 표시한다. */
  createdAt: string
}
```

- 목록: 현재 직원 조회 API 는 생성일·비밀번호 변경 여부를 주지 않으므로 **mock**(12명, 앞 5명은 Figma 값)으로 둔다.
  쿼리키 후보 `['staff-accounts', 'list']`. 검색·페이지 슬라이싱은 퍼블리싱 단계에서 클라이언트가 한다.
- 계정 생성: 이미 연동된 `features/create-account` 의 `createEmployee` / `isUsernameConflictError` 를 그대로 쓴다.
- 삭제·비밀번호 초기화: mutation 후보이며 퍼블리싱에서는 mock 함수(Promise)로 두고 로컬 상태만 갱신한다.
- 클라이언트 상태: 열린 케밥 행, 열린 모달과 대상 계정, 토스트는 페이지 지역 상태. 검색어·페이지는 URL.

## 컴포넌트 구조/props

- `StaffAccountsPage` (pages/settings/accounts) — `/settings/accounts` 화면. URL 상태·모달·토스트를 소유한다.
- `StaffAccountTable { accounts, pagination, total, emptyLabel, renderRowAction, loading }` (entities/employee/ui)
  — 공용 `DataTable` 에 열·외형을 입힌다. 아바타·비밀번호 배지는 이 파일 안 styled 셀로 둔다(컴포넌트맵 과분리 점검 결과).
- `CreateAccountDialog { onSubmit, onCancel, onCreated, onError }` (features/create-account/ui) — 입력·검증·제출·409 처리를 자체 상태로 가진다.
  제출 함수(`onSubmit`)는 페이지가 기존 `createEmployee` 로 넘긴다. 서버 오류는 `onError` 로 올려 페이지가 토스트를 띄운다.
  기존 `CreateAccountForm` 은 이 모달로 대체하고 지운다.
- 목록 표는 공용 `DataTable`, 케밥은 공용 `KebabMenu`, 삭제 확인은 공용 `DeleteConfirmationDialog`, 토스트는 공용 `Toast` 를 재사용한다.
- 공용 변경(중간 게이트 확인 대상, 기본값은 기존 동작 유지):
  - `DeleteConfirmationDialog` 에 선택 props `title` / `confirmLabel` / `pendingLabel` 추가 → 비밀번호 초기화 모달에 재사용
  - `DataTable` 에 선택 prop `footerStart`(카드 하단 왼쪽 `총 N명` 자리) 추가
  - `LinkButton` 과 같은 모양의 버튼형(`＋ 계정 생성하기` 는 이동이 아니라 모달을 연다) 추가

## 접근성

- 검색 입력은 `aria-label="이름 또는 아이디 검색"` 을 준다.
- 케밥 버튼은 `aria-label="<이름> 계정 메뉴"` 이고 메뉴는 공용 `KebabMenu` 의 키보드 동작을 따른다.
- 생성 모달은 `role="dialog"` + `aria-modal` + 제목 연결, 포커스를 모달 안에 가둔다.
  label↔input 은 `htmlFor`/`id`, 오류 시 `aria-invalid` 와 `aria-describedby` 로 오류 문구를 연결하고 오류 문구는 `role="alert"`.
- 비밀번호 배지는 텍스트로 상태를 전달해 색에만 의존하지 않는다.

## 반응형

- 1920×1080 에서 콘텐츠 폭 1320px(좌 300px)을 기준으로 한다. 뷰포트가 좁으면 콘텐츠가 가용 폭으로 줄고
  표는 공용 `DataTable` 규칙을 따른다. 모바일 정밀 배치는 Figma 미제공.

## 비고 / 제약

- 스타일은 Emotion. solid color/font family 는 theme 의미 토큰, px·rgba 등은 styled 에 직접 쓴다.
- 신규 의미 토큰 후보(중간 게이트 확인 대상): `#F0F0F3`(목록 구분선), `#B7740A`(`초기 비밀번호` 배지 글자).
- Figma 의 `Inter` 는 디자인 파일 기본값 흔적이며 구현은 `Wanted Sans`(`theme.font.body`)를 쓴다.
- 검색 입력은 Figma 에서 카드 바깥(위)에 있고 흰 배경 + 테두리(400×52, radius 8)라서
  `DataTable` 내장 검색(카드 안, radius 44)과 규격이 다르다. 이 화면 전용 styled 로 구현한다.
- 케밥 메뉴 폭은 Figma 220px, 공용 `KebabMenu` 는 180px 이다. 공용을 바꾸면 다른 화면이 변하므로 공용 폭을 쓴다(중간 게이트 확인 대상).
- 기존 `tests/e2e/account-create.spec.ts` 는 대체되는 화면의 테스트라 지운다.
  `account-create.spec.md` 는 Status 를 Superseded 로 바꾼다(approvals 는 건드리지 않는다).
- `tests/e2e/api/app-admin-employee-create.spec.ts`(API 하네스 산출물)는 옛 페이지·문구를 가리키므로
  이 퍼블리싱 후 `/api` 작업에서 모달 흐름으로 다시 맞춰야 한다. 퍼블리싱에서는 고치지 않는다.
