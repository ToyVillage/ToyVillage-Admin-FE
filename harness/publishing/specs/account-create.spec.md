---
feature: account-create
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1830:17307
requires_functional_test: true
paths: src/pages/settings/accounts, src/features/create-account, src/shared/assets, src/pages/login, src/app, src/features/sidebar
---

# 계정 생성 행동명세

## 상태와 근거

- Status: Draft
- Last refreshed: 2026-09-17
- 이슈: #96 계정 생성 퍼블리싱
- 기준 프레임: Figma `1830:17307` "account make (empty)" — 빈 값으로 제출했을 때의 오류 상태 1920×1080.
  기본(오류 없음) 상태 프레임은 따로 없으므로 오류 행을 뺀 모습을 기본 상태로 본다.
- 추출 캐시: `harness/artifacts/publishing/account-create.figma.txt`
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`
- 개발자 위임 결정(2026-09-17): 개발자가 부재해 spec 작성·시나리오 승인을 AI에 위임했다. 아래 "위임 결정" 항목은 PR 리뷰에서 다시 확인한다.

## 목적

운영 관리자가 직원의 이름과 아이디를 입력해 새 직원 계정을 만든다.
초기 비밀번호는 서버가 아이디와 같게 설정하므로 화면에서 비밀번호를 받지 않는다.

## 범위

- 포함: `/settings/accounts/create` 라우트, 이름·아이디 입력, 필수값 검증과 인라인 오류, 초기 비밀번호 안내 문구, 제출 중 중복 방지, 성공·실패 결과 표시, 교체 가능한 mock 제출 경계
- 제외: 실제 계정 생성 API, 아이디 중복 확인, 권한·팀 지정, 직원 계정 목록 화면

## 라우트와 진입

- `/settings/accounts/create` 직접 진입 → 계정 생성 화면을 표시한다.
- 인증이 필요한 관리자 화면이므로 `RequireAuth` 와 전역 레이아웃(사이드바 토글 버튼) 안에 둔다. Figma 좌상단 `ic:twotone-menu` 는 기존 `SidebarToggleButton` 이다.
- 사이드바 `설정 > 직원 계정 관리` 를 이 화면(`/settings/accounts/create`)에 연결한다. 이 경로에서는 해당 메뉴가 활성으로 표시된다. 직원 계정 목록 화면이 생기면 목록으로 옮긴다.

## 화면 구조

1. 연한 회색 페이지 배경(`background`)
2. 가운데 흰 카드 720×843, radius 24, 그림자 `0 12px 40px rgba(20,26,23,0.1)`
3. 토이빌리지 로고 136×114 (로그인 화면과 같은 에셋)
4. 제목 `계정 생성` (h1, 40px Bold)
5. 안내 문구 `토이빌리지 직원 계정을 생성하세요` (24px Medium, `textGuide`)
6. `이름` 입력 필드
7. `아이디` 입력 필드
8. 안내 문구 `*초기 비밀번호는 입력한 아이디와 동일하게 설정됩니다.` (18px Medium, `danger`) — 항상 표시
9. 주요 버튼 `계정 생성` (640×77, radius 12, `textStrong` 배경, 흰 28px Medium)

## 입력 필드

공통 시각: label 22px SemiBold 검정 / 입력 박스 `background` 배경, 1px `dialogBorder`(#C6C6CE) 테두리, radius 8, padding 20px 16px, 20px Medium, placeholder `textGuide`.

### 이름

- label `이름`, placeholder `이름을 입력해주세요`
- 한 줄 텍스트, `autocomplete="off"`
- 제출 시 앞뒤 공백을 제거하고, 제거 후 빈 문자열이면 미입력으로 본다.
- 오류 문구: `이름을 입력해주세요!`

### 아이디

- label `아이디`, placeholder `아이디를 입력해주세요`
- 한 줄 텍스트, `autocomplete="off"`
- 제출 시 앞뒤 공백을 제거하고, 제거 후 빈 문자열이면 미입력으로 본다.
- 오류 문구: `아이디를 입력해주세요!`
- 아이디 형식·길이 규칙은 API 명세 전이라 검증하지 않는다.

## 동작

### 초기 상태

- 두 입력은 비어 있고 오류 행은 보이지 않는다.
- 초기 비밀번호 안내 문구와 `계정 생성` 버튼은 보인다.

### 필수값 검증

- `계정 생성` 클릭 또는 입력 중 Enter → 이름·아이디를 함께 검증한다.
- 비어 있는 모든 필드 아래에 Figma 오류 행(빨간 원 `!` 22px + 18px 빨간 문구)을 동시에 표시한다.
- 포커스는 비어 있는 첫 필드(이름 → 아이디 순)로 옮긴다.
- 오류가 있으면 제출 함수를 호출하지 않는다.
- 오류가 난 필드에 입력하면 그 필드의 오류만 사라진다.
- 오류 행이 나타나도 아래 요소(안내 문구·버튼) 위치가 밀리지 않게 오류 행 높이를 미리 확보한다.

### 제출 경계

- 두 값이 유효함 → `{ name, username }`(공백 제거 값)을 계정 생성 제출 함수에 한 번 전달한다.
- 제출 중에는 버튼을 비활성화하고 `aria-busy` 로 진행 상태를 알리며 중복 제출을 막는다.
- 성공 → 두 입력을 비우고 이름 입력으로 포커스를 옮기며 성공 토스트 `계정이 생성되었습니다` 를 띄운다(위임 결정: Figma 결과 프레임 없음, 기존 `Toast` 재사용).
- 실패 → 입력값을 유지하고 실패 토스트 `계정 생성에 실패했습니다` 를 띄운다(위임 결정).
- 퍼블리싱 단계에서는 실제 HTTP 요청을 만들지 않는다. 제출 함수는 mock 이며 `/api` 작업에서 교체한다.

## 데이터와 API 경계

```ts
interface CreateAccountInput {
  name: string
  username: string
}

type CreateAccountSubmit = (input: CreateAccountInput) => Promise<void>
```

- endpoint, 응답 필드, 아이디 중복 오류 코드는 API 연동 작업에서 확정한다.

## 컴포넌트 구조와 소유권

- `CreateAccountPage` (`pages/settings/accounts`) — 페이지 배경·카드·로고·제목과 토스트 조합
- `CreateAccountForm` (`features/create-account`) — 입력 상태, 검증, 제출 상태
- 오류 행은 `FormFieldCard` 의 `ErrorRow/ErrorMark` 와 같은 모양이지만 그 컴포넌트는 카드 레이아웃을 함께 가져서 그대로 쓰지 않는다. 폼 안 styled 로 둔다.
- 로고는 로그인 화면과 같은 파일이므로 `src/shared/assets/toyvillage-logo.png` 로 옮겨 두 페이지가 함께 쓴다.
- 새 shared 컴포넌트는 만들지 않는다.

## 접근성

- label 과 input 을 `htmlFor`/`id` 로 연결하고 두 input 에 `required` 를 준다.
- 오류 시 `aria-invalid="true"` 와 `aria-describedby` 로 오류 행을 연결하고 오류 행은 `role="alert"` 이다. `!` 마크는 `aria-hidden`.
- 오류는 문구로도 전달해 색에만 의존하지 않는다.
- 키보드 순서: 이름 → 아이디 → 계정 생성.
- focus-visible 시 입력 테두리·버튼 outline 을 `accent` 로 표시한다.

## 반응형

- 1920×1080 에서 720×843 카드와 640px 폼 폭을 기준으로 한다.
- 뷰포트가 카드보다 좁으면 카드와 폼이 가용 폭으로 줄고, 높이가 부족하면 세로 스크롤을 허용한다.
- 모바일 정밀 배치는 Figma 미제공.

## 기능 테스트 수용 기준

- S1: `/settings/accounts/create` 진입 → 로고, 제목, 안내 문구, 이름·아이디 입력, 초기 비밀번호 안내, 계정 생성 버튼이 보이고 오류 문구는 없다.
- S2: 빈 값으로 제출 → 두 오류 문구가 함께 보이고 이름 입력에 포커스, 제출 함수 미호출.
- S3: 이름만 입력하고 제출 → 아이디 오류만 보이고 아이디 입력에 포커스.
- S4: 유효 값으로 제출 → 공백 제거 값으로 제출 함수를 한 번 호출한다.
- S5: 아이디 입력에서 Enter → 버튼 클릭과 같게 제출한다.
- S6: 제출 성공 → 입력이 비고 이름에 포커스, 성공 토스트.
- S7: 오류 필드에 입력 → 그 필드 오류만 사라진다.
- S8: 공백만 입력 → 미입력으로 검증한다.
- S9: 제출 중 재제출 → 추가 호출 없음.
- S10: 제출 실패 → 입력값 유지, 실패 토스트.
- S11: 오류 행이 나타나도 계정 생성 버튼 위치가 변하지 않는다.
- S12: 키보드만으로 이름 → 아이디 → 계정 생성 순서로 이동하고 제출한다.

## 미결 사항

- 실제 계정 생성 API 와 아이디 중복·형식 오류 처리
- 성공·실패 결과의 제품 문구와 성공 후 이동 목적지(직원 계정 목록 화면 생기면 재검토)
- 권한(운영 관리자만 접근) 정책

## 비고 / 제약

- 스타일은 Emotion, 색은 기존 토큰(`background`, `surface`, `text`, `textStrong`, `textGuide`, `dialogBorder`, `danger`, `accent`)만 쓴다.
- 새 의존성을 추가하지 않는다.
