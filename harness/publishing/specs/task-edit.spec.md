---
feature: task-edit
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 3350:3402
requires_functional_test: true
paths: src/pages/tasks, src/features/create-task, src/entities/task
---

# 업무 수정·삭제 행동명세

## 상태와 근거

- Status: Active
- Last refreshed: 2026-08-11
- 수정 화면 기준: Figma `3350:3402` ("task make", 기존 값이 채워진 폼)
- 삭제 확인 모달: `3878:4522` ("delete task")
- 이탈 확인 모달: `3878:4640` ("really exit?")
- 토스트: `4293:7572`
- 추출 캐시: `harness/artifacts/publishing/task-edit.figma.txt`
- 필드·검증 계약: `harness/publishing/specs/task-create.spec.md`
- 목록 계약: `harness/publishing/specs/task-list.spec.md`

## 목적

운영 관리자가 이미 등록한 업무 지시를 열어 내용을 확인하고 수정하거나 삭제한다. 저장·삭제 실패나 실수로 인한
이탈에도 입력과 기존 데이터를 잃지 않아야 한다.

## 범위

- 포함: 기존 업무 조회, 필드 편집, 첨부 확인·다운로드·추가·제거, 저장, 삭제(확인 모달 포함), 이탈 보호,
  삭제 실패 토스트
- 제외: 실제 API 연동(`/api` 스킬 담당), 업무 보고 상세 화면, 상태(`진행중/완료/반려`) 변경, 수정 이력

## 라우트와 진입

- 목록의 행 클릭 → `/tasks/:id` 로 이동한다.
- `/tasks/:id` → 해당 ID 업무의 수정 화면을 표시한다.
- `뒤로가기` → `/tasks` 로 돌아간다(변경이 있으면 이탈 확인을 거친다).
- 저장 또는 삭제 성공 → `/tasks` 로 이동한다.
- 존재하지 않는 ID → 입력 폼 대신 `업무를 찾을 수 없습니다.` 와 목록 복귀 링크를 표시한다.

## 초기 데이터

- 진입 시 ID 로 업무를 조회하고 우선순위·완료기한·공개범위·담당자·제목·상세 내용·첨부 파일명을 초기값으로 채운다.
- 기본 mock ID 는 Figma 기준 상태를 재현한다.
  - 우선순위: `상`(선택 상태 — 배경 `colors.accentBg`, 글자 `colors.accent`)
  - 완료기한: `2026.07.05`
  - 공개범위: `전체 직원`
  - 담당자: Figma 는 placeholder 로 남아 있으나 담당자는 필수값이므로 mock 은 저장된 담당자(`이승현 사원`)를 채운다
  - 제목: `업무 제목`
  - 상세 업무 내용: `상세 업무 내용이 입력되어있음`
  - 첨부: `당일 지침.pdf`, `휴관안내.png`, `휴관안내.jpg`
- 기존 첨부는 파일명과 유형을 표시하고 다운로드 컨트롤을 제공한다.

## 동작 (behavioral spec — source of truth)

- 목록의 행 클릭 → `/tasks/:id` 로 이동하고 해당 업무의 값이 채워진 폼이 보인다.
- 필드 편집 동작(우선순위·완료기한·공개범위·담당자·제목·상세 내용·첨부)은 생성 화면과 동일하다.
  `task-create.spec.md` 의 "동작"과 "검증"을 그대로 따른다.
- `저장하기` 클릭 시 필수값이 비어 있으면 → 요청 없이 생성 화면과 같은 검증 모달을 띄우고
  확인 후 해당 필드로 포커스를 옮긴다.
- 필수값이 채워진 상태에서 `저장하기` → 현재 ID 와 정규화한 입력으로 수정 요청을 한 번만 보낸다.
  요청 중에는 중복 제출을 막는다.
- 저장 성공 → 업무 query 를 갱신하고 `/tasks` 로 이동한다. 목록에는 같은 ID 가 하나만 있고 수정값이 보인다.
- 저장 실패 → 현재 URL 과 모든 입력을 보존하고 실패를 알린다.
- 변경사항이 없어도 `저장하기` 는 사용할 수 있으며 현재 값으로 한 번만 요청한다.
- `삭제하기` 클릭 → 삭제 확인 모달 `정말 삭제하시겠습니까?` / `삭제하신 뒤에는 영구삭제되며 복구 할 수 없습니다`
  를 띄운다.
- 삭제 모달의 `취소` 또는 `Esc` → 삭제하지 않고 닫히며 `삭제하기` 로 포커스가 복귀한다.
- 삭제 모달의 `확인` → 해당 ID 삭제 요청을 한 번 보낸다.
- 삭제 성공 → 업무 query 를 갱신하고 `/tasks` 로 이동한다. 삭제된 업무는 목록과 직접 URL 에서 사라지고,
  목록에 `데이터 삭제에 성공했습니다` 토스트가 표시된다(`task-list.spec.md`).
- 삭제 실패 → 현재 화면과 입력을 유지하고 `데이터 삭제에 실패했습니다` 토스트를 표시한다.
- 초기값에서 한 필드라도 바뀐 뒤 `뒤로가기` / 사이드바 이동 / 브라우저 뒤로가기 → 이탈 확인 모달
  `정말 나가시겠습니까?` / `저장하지 않고 돌아갈 시 입력된 정보가 삭제됩니다` 를 띄운다.
  `취소` 또는 `Esc` 는 현재 URL 과 입력을 유지하고, `확인` 은 시도한 경로로 이동한다.
- 저장·삭제 성공에 의한 이동은 이탈 확인 대상에서 제외한다.
- 새로고침과 탭 닫기는 브라우저 기본 이탈 경고로 보호한다.
- `업무 보고 상세조회` 버튼은 Figma 대로 **표시만 하고 동작하지 않는다**. 이동 대상 화면이 이번 범위에 없어
  `disabled` 로 두고 클릭해도 아무 일도 일어나지 않는다.
- 저장 성공·실패에 대한 토스트는 만들지 않는다(Figma 에 삭제 실패 토스트만 있다).
  저장 실패는 화면과 입력을 유지한 채 실패를 알리는 것으로 충분하다.

## 화면 구조와 시각 규격

생성 화면(`task-create.spec.md` §화면 구조)과 동일한 카드 구성·치수를 사용한다. 차이는 다음과 같다.

1. 우측 상단(`y=131`)에 `업무 보고 상세조회` 버튼: 264×68, radius 12px, 배경 `colors.accentBg`,
   padding 16/20px, 라벨 24px SemiBold `colors.accent` + chevron 36px. 표시만 하고 동작하지 않는다(`disabled`).
2. 우선순위는 진입 시 저장된 값이 선택 상태다(선택 배경 `colors.accentBg`, 글자 `colors.accent`).
3. 완료기한·공개범위·담당자·제목·상세 내용은 placeholder 대신 저장된 값을 표시한다
   (제목 40px Medium `colors.text`).
4. 첨부 chip 3개가 표시된다. Figma 기본 상태에서는 pdf·png chip 의 제거 아이콘이 `visible: false` 지만
   디자인 누락으로 보고 **모든 chip 에 제거 컨트롤을 노출**한다(생성 화면과 동일).
5. 우하단 액션 2개:
   - `삭제하기` 123×61, radius 8px, 배경 없음, 테두리 2px `colors.danger`, 라벨 24px SemiBold `colors.danger`
   - `저장하기` 123×61, radius 8px, 배경 `colors.text`, 라벨 24px SemiBold 흰색
6. 삭제 확인 모달: 경고 아이콘 + 제목 + 2줄 설명 + `취소`(흰 배경/테두리) / `확인`(검정 배경/흰 글자).
   기존 `DeleteConfirmationDialog`(`src/shared/ui`)의 문구와 동일하다.
7. 이탈 확인 모달: 제목 + 설명 + `확인` / `취소`. 기존 `LeaveConfirmationDialog` 의 문구와 동일하다.

## 데이터와 API 경계

```ts
interface UpdateTaskInput {
  priority: TaskPriority
  dueDate: string // YYYY-MM-DD
  visibility: string
  assigneeId: string
  title: string
  content: string
  attachments: string[]
}
```

- 조회 endpoint 후보: `GET /tasks/:id`
- 수정 endpoint 후보: `PUT /tasks/:id`
- 삭제 endpoint 후보: `DELETE /tasks/:id`
- query key: `['tasks']`, 단건은 `['tasks', id]`
- 이번 슬라이스는 localStorage 기반 mock 으로 대체한다. 수정값은 ID 로 기본 mock 을 override 하고
  삭제 ID 는 별도 tombstone 으로 유지한다. 실제 API 는 연결하지 않는다.

## 컴포넌트 구조/props

- `TaskDetailPage` — `/tasks/:id` 페이지. 조회·저장·삭제 상태를 소유한다.
- `TaskForm { mode: 'edit', initialValue, onSubmit, onDelete }` — 생성 화면과 공용. 별도 복제하지 않는다.
- `DeleteConfirmationDialog`(기존 `src/shared/ui`) — 삭제 확인 모달 재사용.
- `LeaveConfirmationDialog` — 이탈 확인 모달 재사용(공용화 후보).
- `ValidationDialog`(기존 `src/shared/ui`) — 검증 모달 재사용.
- `Toast` — 삭제 실패 토스트. 신규 공용 컴포넌트 후보.
- `TaskReportLinkButton` — `업무 보고 상세조회` 버튼. 이번 범위에서는 이동 대상이 없다.

## 접근성

- 생성 화면의 접근성 규칙을 그대로 따른다.
- 삭제 확인 모달은 `alertdialog`, modal semantics, 포커스 트랩과 호출 컨트롤 복귀를 제공한다.
- 기본 키보드 순서: 뒤로가기 → 업무 보고 상세조회 → 우선순위 → 완료기한 → 공개범위 → 담당자 →
  제목 → 상세 내용 → 첨부 컨트롤 → 파일 업로드 → 삭제하기 → 저장하기.

## 반응형

- 생성 화면과 동일하다. 액션 2개는 좁은 화면에서 줄바꿈할 수 있으며 터치 영역 최소 44px 을 유지한다.

## 기능 테스트 수용 기준

- S1: 목록 첫 행 클릭 → 해당 `/tasks/:id` 로 이동한다.
- S2: 기본 mock ID 진입 → Figma 기준 우선순위 `상`, 완료기한, 제목, 상세 내용과 세 첨부 파일명이 보인다.
- S3: 제목·상세 내용을 고치고 `저장하기` → 목록으로 이동하고 같은 ID 한 행에 수정값이 보인다.
- S4: 우선순위를 바꾸고 저장 → 목록의 해당 행 우선순위 배지가 바뀐다.
- S5: 제목을 비우고 `저장하기` → 요청 없이 `제목을 입력해주세요` 모달이 뜨고 확인 후 제목으로 포커스가 이동한다.
- S6: 상세 업무 내용을 비우고 `저장하기` → `상세 업무 내용을 입력해주세요` 모달이 뜬다.
- S7: 기존 첨부 제거와 새 파일 추가 → chip 목록이 즉시 갱신된다.
- S8: `삭제하기` 클릭 후 `취소` → URL 과 업무가 유지되고 `삭제하기` 로 포커스가 복귀한다.
- S9: `삭제하기` 후 `확인` → 목록으로 이동하고 같은 ID 업무가 보이지 않는다.
- S10: 삭제 실패 → 화면이 유지되고 `데이터 삭제에 실패했습니다` 토스트가 보인다.
- S11: 존재하지 않는 ID 진입 → not-found 상태와 목록 복귀 링크가 보인다.
- S12: 값을 고친 뒤 `뒤로가기` → 이탈 확인 모달이 입력 손실을 막는다.
- S13: 저장·삭제 요청 중 재클릭 → 중복 요청을 보내지 않는다.
- S14: 키보드만으로 편집·첨부·검증·저장·삭제 취소를 수행할 수 있다.

## 결정 사항 (게이트 ② 승인)

- 라우트는 `/tasks/:id` 로 확정한다.
- 담당자 초기값은 mock 에 저장값을 채운다(Figma placeholder 잔재 미채택).
- 기존 첨부에도 제거 컨트롤을 노출한다(Figma `visible: false` 는 디자인 누락으로 판단).
- `업무 보고 상세조회` 는 버튼만 만들고 동작시키지 않는다(`disabled`).
- 상태(`진행중/완료/반려`)는 표시 전용 파생값이며 수정 화면에서 바꿀 수 없다.
- 저장 성공·실패 토스트는 만들지 않는다. 삭제 실패 토스트만 사용한다.
- not-found 문구는 `업무를 찾을 수 없습니다.` 로 한다.
- 공용화: `TaskForm` 을 생성·수정 공용으로 두고, `LeaveConfirmationDialog` 를 shared 로 올리며,
  `Toast` 를 shared 에 신규 추가한다.

## 미결 사항 (이번 범위 밖)

- [ ] 실제 업무 API endpoint 계약 / 백엔드 담당 — `/api` 스킬에서 처리한다.
- [ ] `업무 보고 상세조회` 의 이동 대상 화면(task report) 퍼블리싱 — 별도 슬라이스.
