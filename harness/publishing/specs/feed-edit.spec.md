---
feature: feed-edit
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 749:14863
  relatedNodeIds:
    - 2440:25662 # 먹이 급여 관리 · 목록 (케밥 2429:23891 / 케밥 열림 2429:24012)
    - 2440:25664 # 먹이 급여 관리 · 수정 (feeding correction 2429:24034)
    - 2440:25665 # 먹이 급여 관리 · 토스트 (2429:24115)
requires_functional_test: true
paths: src/pages/feeds, src/features/feed-form, src/entities/feed, src/app
---

# 먹이 급여 관리 · 수정·삭제 행동명세

## 상태와 근거

- Status: Draft
- Last refreshed: 2026-10-06
- 이슈: #198 먹이 급여 관리 수정 기능, #228 `잔량` 추가(2026-10-06)
- 기준 섹션: Figma `749:14863` ("먹이 급여 관리"). 수정 기능이 추가되며 다음이 생겼다.
  - 목록 행 오른쪽 케밥(⋮)과 `수정` / `삭제` 메뉴(`2429:24012`, 메뉴 main `39:8908` "수정·삭제")
  - 수정 화면 `feeding correction`(`2429:24034`)
  - 수정 성공 토스트(`2429:24115` — 배경은 목록 화면, 문구 `데이터 수정에 성공했습니다`)
- 목록 표 열 구성은 2026-09-28 에 Figma 를 코드(`FeedTable`)에 맞춰 고쳤고, 2026-10-06(#228)에 `잔량` 이 `먹이 종류 · 급여량` 뒤에 추가됐다 — `종 / 개체명 / 먹이 종류 · 급여량 / 잔량 / 급여자 / 급여날짜 / 급여시간 / 케밥`.
- 목록의 조회·탭·페이지네이션 계약은 `feed-list.spec.md`, 상세는 `feed-detail.spec.md` 가 그대로 담당한다.
  이 spec 은 **케밥 메뉴·삭제·수정 화면·결과 토스트**만 다룬다.
- 추출 캐시: `harness/artifacts/publishing/feed-edit.figma.txt`
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`
- 개발자 위임 결정(2026-09-28): 개발자가 게이트 ② 초안(S1–S15, 결정 1–5)을 그대로 승인하라고 지시해 AI 가 공식 승인 스크립트를 실행했다.
- 재승인(2026-09-28): 개발자 요청으로 급여량 칸을 '숫자만 + 고정 단위 `kg`' 로 바꾸며 S2·S6 을 고쳐 개발자 승인 후 재승인·재동결했다.
- 수정 폼 선례: `observation-edit.spec.md`(인라인 검증·이탈 확인·저장 실패 문구·저장 중 라벨)
- 단위 결정(2026-10-06, 개발자): 단위는 항상 kg 다. 수정 요청은 항상 `feedUnit: 'KGL'` 을 보내고 응답의 `feedUnit` 은 무시한다.
- Figma 근거 없음(저장소 선례로 채움): 검증 오류, 저장 실패, 이탈 확인, 삭제 확인 모달·삭제 토스트, 로딩.

## 목적

운영 관리자가 잘못 기록된 먹이 급여 기록의 먹이 종류·급여량·잔량·특이사항을 고치거나, 기록을 지운다.

## 범위

- 포함: 목록 행 케밥 메뉴(`수정` / `삭제`), 삭제 확인과 결과 토스트, `/feeds/:id/edit` 수정 화면
  (기존 기록 복원, 먹이 종류·급여량·잔량·특이사항 편집, 대상 개체·급여일시·급여자 읽기 전용, 인라인 검증, 저장, 이탈 보호),
  수정 성공 토스트
- 제외: 수정·삭제 API 연동(`/api` 스킬 담당 — 퍼블리싱에서는 mock 함수로 둔다), 급여 기록 생성,
  상세 화면 변경(Figma 상세 `749:14665` 에는 수정 진입점이 없다), 권한별 케밥 숨김(권한 관리 이후)

## 라우트와 진입

- `/feeds/:id/edit` → 급여 기록 수정 화면. `:id` 는 급여 기록 id 다.
- 진입: 목록 행 케밥 `수정` → 이 화면으로 이동하며 목록의 조회 조건(`location.search`)과 분류 탭을 state 로 넘긴다
  (상세 진입과 같은 `listSearch` / `species` 규약).
- `뒤로가기` → 진입 전 목록 조회 조건의 목록(`/feeds<listSearch>`)으로 돌아간다. state 가 없으면 `/feeds`.
- 저장 성공 → 같은 목록 주소로 이동하고 수정 성공 토스트를 띄운다.
- id 가 숫자가 아니거나 없는 기록(404)이면 → 목록으로 되돌린다(`FeedDetailPage` 와 같다).
  그 밖의 조회 실패 → 폼 대신 `급여 기록을 불러오지 못했습니다. 다시 시도해 주세요.` 안내를 보인다(상세와 같은 문구·모양).

## 동작 (behavioral spec — source of truth)

### 목록 케밥 메뉴

- 목록 각 행 오른쪽 끝에 케밥(⋮) 버튼이 있다. 머리행의 케밥 열은 비어 있다.
- 케밥 클릭 → 그 행 아래에 메뉴가 열린다. 항목은 `수정`, `삭제`(빨간 글자) 순서다. 행 클릭(상세 이동)은 일어나지 않는다.
- 메뉴 바깥 클릭 / `Escape` → 메뉴가 닫힌다. 다른 행 케밥을 열면 앞 메뉴는 닫힌다. 한 번에 하나만 열린다.
- `수정` → 그 기록의 수정 화면으로 이동한다.
- `삭제` → 공통 삭제 확인 모달(`정말 삭제하시겠습니까?` / `삭제하신 뒤에는 영구삭제되며 복구 할 수 없습니다`)이 열린다.
  - `취소` / `Escape` → 아무것도 지우지 않고 닫히며, 초점은 그 행 케밥으로 돌아간다.
  - `확인` → 삭제 요청을 한 번 보낸다. 요청 중에는 확인 버튼이 `삭제 중` 으로 비활성이다.
    성공하면 모달이 닫히고 목록을 다시 불러와 그 행이 사라지며 `데이터 삭제에 성공했습니다` 토스트가 뜬다.
    실패하면 모달이 닫히고 `데이터 삭제에 실패했습니다` 토스트가 뜨며 행은 그대로다.
  - 삭제로 현재 페이지가 비면 앞 페이지로 옮긴다(목록 페이지 보정 규약).

### 수정 화면 — 헤더와 복원

- 상단에 `뒤로가기`, 제목 `급여 기록 수정`, 부제 `<종> · <개체명>의 급여 기록을 수정합니다`(예: `표범 · 레오의 급여 기록을 수정합니다`).
- 진입 시 급여 기록 상세를 조회해 값을 채운다. 조회 중에는 같은 레이아웃의 빈 폼을 보이고(값·부제 자리 비움),
  화면이 위아래로 튀지 않게 한다. 진입 시 페이지 맨 위로 스크롤한다.
- 카드 순서와 값:
  1. `대상 개체` — `<종> · <개체명>` (읽기 전용)
  2. `급여일시` — `YYYY.MM.DD HH:mm` (읽기 전용)
  3. `급여자` — 급여자 이름 (읽기 전용)
  4. `먹이 종류` — 한 줄 입력, 기존 값
  5. `급여량` — 숫자만 입력하는 칸, 기존 값의 숫자(예: `1.2`). 바로 뒤에 지울 수 없는 단위 `kg` 가 붙어
     화면에는 `1.2kg` 로 보인다(2026-09-28 개발자 요청 — 입력칸에서 `kg` 를 지울 수 있던 문제).
  6. `잔량` — `급여량` 과 같은 고정 `kg` 숫자 입력칸. 기존 값의 숫자(예: `0`, `0.3`). 응답의 `remainingAmount` 가 null/없음(기능 추가 이전 기록)이면 빈 입력으로 시작하고, 저장 전에 채워야 한다.
  7. `특이사항` — 여러 줄 입력(최소 높이 160px, 내용이 늘면 박스도 늘어남), 기존 값(없으면 빈칸)
- 읽기 전용 세 항목은 값이 회색(`colors.textGuide`)이고 포커스는 받지만 바꿀 수 없다(`readOnly`).
  근거는 `observation-edit` 과 같다(Figma 값 색이 placeholder 색, 편집 칸은 `colors.textStrong`).
  저장 요청에 넣지 않는다.

### 수정 화면 — 검증과 저장

- 필수: `먹이 종류`, `급여량`, `잔량`. 앞뒤 공백을 제거한 값이 비면 빈 값이다. `특이사항` 은 선택이다.
- `급여량` 입력칸에는 숫자와 소수점 하나만 들어간다. 다른 글자(단위·문자·두 번째 소수점)는 입력하는 즉시 걸러진다
  (`2 kg` 를 붙여 넣으면 `2`). 0보다 큰 수여야 한다. 고치지 않고 저장하면 상세 응답의 원래 숫자를 그대로 보낸다.
- `잔량` 입력칸도 `급여량` 과 같이 숫자와 소수점 하나만 받는다. 단 **0 은 허용**한다(다 먹은 경우). 고치지 않고 저장하면 상세 응답의 원래 값을 그대로 보낸다.
- `저장하기` 를 누를 때만 전체를 검증한다. 실패한 **모든** 항목 카드 바로 아래에 오류 줄을 한꺼번에 보이고 요청하지 않는다.
  첫 오류 줄로 부드럽게 스크롤하고 포커스는 옮기지 않는다(`observation-edit` 규약).
  - 먹이 종류 빈 값 → `먹이 종류를 입력해주세요!`
  - 급여량 빈 값 → `급여량을 입력해주세요!`
  - 급여량이 0 이하이거나 소수점만 있음(`0`, `.`) → `급여량을 숫자로 입력해주세요!`
  - 잔량 빈 값 → `잔량을 입력해주세요!`
  - 잔량이 숫자가 아님(`.`) → `잔량을 숫자로 입력해주세요!` (`0` 은 오류가 아니다)
  - 값을 고쳐도 오류 줄은 다음 제출 때 다시 검증해야 사라진다.
- 모두 통과하면 수정 요청을 **한 번** 보낸다. 본문은 `{ feedLogId, feedType, feedAmount(숫자), remainingAmount(숫자), feedUnit('KGL'), significant }` 다
  (`significant` 는 앞뒤 공백 제거, 빈 값이면 빈 문자열). 변경이 없어도 저장할 수 있다.
- 요청 중에는 버튼을 비활성화하고 라벨을 `저장 중` 으로 바꿔 중복 제출을 막는다.
- 성공 → 목록·상세 query 를 갱신하고 목록으로 이동해 `데이터 수정에 성공했습니다` 토스트를 띄운다.
  토스트는 이동 state(`{ toast: 'edit-success' }`)로 넘기고, 목록이 닫힐 때 state 를 비워 새로고침·재방문 시 다시 뜨지 않는다.
- 실패 → 현재 URL 과 입력을 보존하고 버튼 위에 `저장하지 못했습니다. 다시 시도해 주세요.` 를 `role="status"` 로 보인다.
  버튼은 다시 누를 수 있다.

### 수정 화면 — 이탈 보호

- 먹이 종류·급여량·잔량·특이사항 중 하나라도 초기값과 다르면 `뒤로가기` / 사이드바 이동 / 브라우저 뒤로가기 시
  `LeaveConfirmationDialog`(`정말 나가시겠습니까?` / `저장하지 않고 돌아갈 시 입력된 정보가 삭제됩니다`)를 띄운다.
  `취소`·`Esc` → 머문다. `확인` → 이동한다. 원래 값으로 되돌리면 바뀌지 않은 것으로 본다.
- 저장 성공에 의한 이동은 확인하지 않는다. 새로고침·탭 닫기는 변경이 있으면 브라우저 기본 경고로 보호한다.

## 화면 구조와 시각 규격 (수정 화면, 1920 기준)

- 페이지 배경 `colors.background`, 본문 1320px(x=300). 좌상단 메뉴는 기존 사이드바 토글.
- `뒤로가기` @300,75 — 공용 `BackLink`.
- 제목 @300,144 40px Medium `colors.textStrong` / 부제 @300,200 24px Medium `colors.textGuide`.
  간격: 뒤로가기 하단 → 제목 33px, 제목 하단 → 부제 8px, 부제 하단 → 폼 31px.
- `잔량` 카드는 `급여량` 과 `특이사항` 사이에 같은 규격(라벨 32px, 입력 66px)으로 둔다. 로딩 스켈레톤에도 `잔량` 라벨이 있다.
- 폼 @300,260: 카드 세로 gap 16px. 카드 배경 `colors.surface`, radius 20, padding 28px 32px, 라벨↔입력 gap 12.
  라벨 32px Medium `colors.textStrong`(공용 `FormFieldCard` `labelSize={32}`).
  입력 66px, 배경 `colors.background`, radius 8, 좌우 padding 24, 24px Medium.
  특이사항 입력 최소 160px, padding 20px 24px, 22px Medium.
- `저장하기` — 폼 아래 40px, 오른쪽 정렬, 배경 `colors.text`, radius 8, padding 16px 20px, 24px SemiBold 흰 글자.
- 목록 케밥 열: 폭 80, 케밥 44×52(아이콘 32), 메뉴는 공용 `KebabMenu`(`below-trigger`, 180px) — Figma 와 같은 폭이다.

## 데이터와 API 경계

```ts
interface FeedUpdateInput {
  feedLogId: number
  feedType: string
  /** kg 단위 실수 */
  feedAmount: number
  /** kg 단위 실수, 0 허용 */
  remainingAmount: number
  significant: string
}
type UpdateFeed = (input: FeedUpdateInput) => Promise<void>
type DeleteFeed = (input: { feedLogId: number }) => Promise<void>
```

- 조회: 기존 `getFeedDetail`(이미 연동) — 수정 화면 복원에 그대로 쓴다. 쿼리키 `feedQueryKeys.detail(id)`.
- 수정·삭제: 퍼블리싱에서는 `entities/feed` 의 mock 함수(`updateFeed` / `deleteFeed`, 성공하는 Promise)로 둔다.
  `/api` 작업에서 feed-log-controller 명세로 교체한다.
- 성공 후 무효화: 목록(`['feeds', 'list']` 범위)과 그 기록의 상세(`feedQueryKeys.detail(id)`).
  삭제한 기록의 상세는 무효화 대신 제거한다(삭제 후 상세 재조회 404 방지).

## 컴포넌트 구조/props

- `FeedTable` (entities/feed/ui) — `renderRowAction?: (feed) => ReactNode` 를 받아 케밥 열(80)을 붙인다.
  `먹이 종류 · 급여량` 열은 남는 폭을 계속 채운다(최소 폭 합계 1320).
- `FeedListPage` (pages/feeds) — 케밥 열림 상태, 삭제 대상, 삭제 mutation, 토스트(자체 발생 + 이동 state)를 소유한다.
- `EditFeedPage` (pages/feeds) — `/feeds/:id/edit`. 조회·이동·토스트 전달을 소유한다.
- `FeedForm { feed, onCompleted, onDirtyChange }` (features/feed-form/ui) — 입력·검증·저장 mutation·변경 여부 알림
  (`ObservationForm` 과 같은 구조). `features/feed-form/model/validation.ts` 에 `validateFeedForm` / `parseFeedAmount` 를 둔다.
- 이탈 보호는 `pages/feeds/ui/useFormLeaveGuard`(개체관리와 같은 훅), 조회 중 빈 폼은 `pages/feeds/ui/FeedEditSkeleton`.
- 재사용: `BackLink`, `FormFieldCard`, `KebabMenu`, `DeleteConfirmationDialog`, `Toast`, `LeaveConfirmationDialog`(shared/ui).
  새 shared 컴포넌트는 만들지 않는다.

## 접근성

- 케밥 버튼 `aria-label="<종> · <개체명> 급여 기록 메뉴"`.
- 입력은 `FormFieldCard` 라벨과 `htmlFor`/`id` 로 연결하고, 오류 줄은 `role="alert"` + `aria-describedby` 로 연결한다.
- 읽기 전용 입력은 `readOnly` 로 두어 스크린리더가 값을 읽을 수 있게 한다.

## 비고 / 제약

- 스타일은 Emotion. 색은 기존 토큰만 쓴다(map-tokens 결과 신규 색 없음). 글꼴은 `theme.font.body`(Wanted Sans).
- Figma 라벨·값 일부가 `Inter` 로 지정돼 있는 것은 디자인 파일 흔적이며 구현은 통일한다.
