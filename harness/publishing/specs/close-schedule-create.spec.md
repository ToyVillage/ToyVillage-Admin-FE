---
feature: close-schedule-create
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 2114:1329
  relatedNodeIds:
    - 2413:2955
    - 2413:3046
    - 1596:450
requires_functional_test: true
paths: src/pages/notices/guide/CreateCloseSchedulePage.tsx, src/features/create-close-schedule, src/entities/close-schedule
---

# 휴관일 생성 페이지 행동명세

## 상태와 근거

- Status: Active
- Last refreshed: 2026-07-16
- 기본 화면: Figma `2114:1329`
- 날짜 누락 오류: Figma `2413:2955`
- 제목 누락 오류: Figma `2413:3046`
- 생성 진입점과 목록 복귀 화면: Figma `1596:450`
- 공통 UI 원칙과 구현 제약은 `DESIGN.md`, 목록 행동은 `harness/publishing/specs/close-schedule.spec.md`를 따른다.

## 목적

토이빌리지 관리자가 휴관 시작일, 종료일과 제목을 입력하여 휴관 일정을 생성한다.

## 라우트

- `/notices/guide/create` → 휴관일 생성 페이지
- `/notices/guide`의 `휴관일 생성하기` 클릭 → `/notices/guide/create`로 이동한다.
- 생성 페이지의 `뒤로가기` 클릭 → `/notices/guide`로 이동한다.

## 화면 구조

1920×1080 데스크톱 Figma 프레임을 기준으로 한다.

1. 좌측 상단 전역 메뉴 버튼
2. 콘텐츠 상단 `뒤로가기`
3. 날짜 입력 영역
   - `시작일`
   - `종료일`
4. 제목 입력 영역
   - `제목 *`
   - placeholder `제목을 입력해주세요`
5. 우측 하단 주요 액션 `생성하기`

Figma 관찰값:

- 페이지 배경: `#F5F5F7`
- 본문 색: `#36363F`
- 보조 텍스트: `#848491`
- 콘텐츠 시작 x: 300px
- 콘텐츠 너비: 1320px
- `뒤로가기`: y 76px, 아이콘 36px, 텍스트 24px
- 날짜 카드: y 144px, 각각 426px 너비, 흰색 배경, 40px padding, 20px radius
- 날짜 입력 표면: `#F5F5F7`, 24px/20px padding, 8px radius, 달력 아이콘 28px
- 제목 카드: y 360px, 1320px 너비, 흰색 배경, 40px padding, 20px radius
- `생성하기`: 검은색 배경, 20px/16px padding, 8px radius, 24px SemiBold

구현에서는 raw 값을 컴포넌트에 하드코딩하지 않고 `src/shared/theme/tokens.ts`의 기존 토큰에 매핑한다. 기존 토큰에 없는 Figma 값은 토큰 검토 후 추가한다.

## 입력 필드

### 시작일

- label: `시작일`
- 날짜 선택 필드다.
- 초기 placeholder는 `연도. 월. 일`을 사용한다.
- 입력 영역 또는 달력 아이콘 클릭 → 날짜 선택 UI를 연다.
- 선택한 날짜를 로컬 date-only 값으로 표시하고 서버에는 `YYYY-MM-DD`로 전달한다.

### 종료일

- label: `종료일`
- 날짜 선택 필드다.
- 초기 placeholder는 `연도. 월. 일`을 사용한다.
- 입력 영역 또는 달력 아이콘 클릭 → 날짜 선택 UI를 연다.
- 선택한 날짜를 로컬 date-only 값으로 표시하고 서버에는 `YYYY-MM-DD`로 전달한다.

### 제목

- label: `제목 *`
- 필수 한 줄 텍스트 필드다.
- placeholder: `제목을 입력해주세요`
- 앞뒤 공백을 제거한 뒤 빈 문자열이면 입력하지 않은 것으로 판단한다.
- Figma에는 글자 수 제한이나 카운터가 없으므로 별도 제한 UI를 추가하지 않는다.

## 동작

### 초기 상태

- 시작일, 종료일과 제목은 비어 있다.
- 날짜 필드에는 `연도. 월. 일`, 제목 필드에는 `제목을 입력해주세요`가 보인다.
- Figma는 `생성하기`를 활성 상태로 표현하므로 필수값이 비어 있어도 버튼을 노출하고 클릭 시 검증한다.

### 뒤로가기

- `뒤로가기` 클릭 → `/notices/guide`로 이동한다.
- Figma에는 작성 중 이탈 확인 상태가 정의되어 있지 않으므로 이번 범위에서는 확인 모달을 추가하지 않는다.

### 생성 검증

`생성하기` 클릭 시 날짜를 먼저, 제목을 다음 순서로 검증한다.

- 시작일 또는 종료일이 비어 있음 → 날짜 누락 모달을 표시한다.
  - 메시지: `휴관일을 입력해 주세요`
  - 버튼: `확인`
  - 근거: Figma `2413:2955`
- 두 날짜가 있고 제목이 비어 있음 → 제목 누락 모달을 표시한다.
  - 메시지: `제목을 입력해 주세요`
  - 버튼: `확인`
  - 근거: Figma `2413:3046`
- `확인` 클릭 → 모달을 닫고 해당 입력으로 포커스를 이동한다.
- 모달 바깥 클릭이나 Escape로 닫을 수 있는지는 Figma에 정의되어 있지 않다. 접근성과 예측 가능성을 위해 Escape는 `확인`과 동일하게 닫되, 바깥 클릭으로는 닫지 않는다.

### 날짜 관계

- 시작일과 종료일은 date-only 값으로 비교한다.
- 종료일은 시작일과 같거나 이후여야 한다.
- 종료일이 시작일보다 빠르면 요청하지 않는다.
- 이 경우 사용할 오류 문구와 디자인 상태는 Figma에 없으므로 구현 전 제품·디자인 확인이 필요하다.

### 생성 요청

- 시작일, 종료일과 제목이 모두 유효함 → 생성 요청을 한 번 전송한다.
- 요청 중에는 이중 제출을 막기 위해 `생성하기`를 비활성화한다.
- 성공 → 휴관 일정 목록 query를 갱신하고 `/notices/guide`로 이동한다.
- 실패 → 현재 입력값과 페이지를 유지하고 재시도할 수 있게 한다.
- 성공·서버 실패 피드백은 Figma에 정의되어 있지 않으므로 새로운 toast나 임의 문구를 이 spec에서 확정하지 않는다.

## 오류 모달

- 전체 화면에 검은색 50% overlay를 표시한다.
- 중앙 모달은 560×320px, 흰색 배경, 20px radius다.
- 메시지는 상단 중앙에 28px SemiBold로 표시한다.
- 하단 `확인` 버튼은 모달 내부 너비 520px, 검은색 배경, 흰색 28px Medium 텍스트다.
- 모달이 열리면 포커스를 `확인`으로 이동하고, 닫히면 오류가 발생한 첫 입력으로 이동한다.
- 모달이 열린 동안 배경 콘텐츠는 키보드와 스크린 리더 탐색에서 제외한다.

## 데이터와 API 경계

기존 목록 spec의 후보 계약을 따른다.

`POST /close-schedule`

```ts
interface CreateCloseScheduleRequest {
  startDate: string
  endDate: string
  title: string
}
```

- `startDate`, `endDate`: `YYYY-MM-DD`
- 단일 날짜 휴관은 두 값을 같은 날짜로 전송한다.
- API 경로와 응답 타입은 백엔드 계약 전에 확정해야 한다.
- mutation과 서버 캐시는 TanStack Query, HTTP는 `src/shared/api/axios.ts`를 사용한다.
- 폼 입력과 모달 상태는 페이지 또는 feature 로컬 상태로 관리한다.

## 컴포넌트 구조와 소유권

- `CreateCloseSchedulePage` (`pages/notices/guide`) — 페이지 레이아웃과 목록 복귀 조합
- `CloseScheduleForm` (`features/create-close-schedule`) — 날짜·제목 입력, 검증, 생성 mutation
- `CloseScheduleDateField` (`features/create-close-schedule` 내부) — label, date input, 달력 아이콘
- `ValidationDialog` — 저장소에 공통 dialog가 생기면 재사용하고, 없으면 이 화면 범위에서 최소 구현한다.
- `CloseSchedule`, 생성 요청 타입 (`entities/close-schedule`) — 도메인 모델
- 날짜 입력은 semantic `input type="date"`를 우선 사용하며 새 date-picker 의존성을 추가하지 않는다.

## 접근성

- `뒤로가기`는 실제 링크 또는 버튼으로 구현하고 접근 가능한 이름을 제공한다.
- 시작일, 종료일과 제목은 보이는 label과 입력을 프로그램적으로 연결한다.
- 제목의 필수 상태는 별표뿐 아니라 `required` 또는 `aria-required="true"`로 전달한다.
- 달력 아이콘은 장식으로 처리하고 날짜 입력 자체가 키보드로 조작 가능해야 한다.
- 날짜 입력이 키보드 포커스를 받으면 네이티브 입력을 표시해 커서·편집 구간·부분 입력 상태를 시각적으로 확인할 수 있게 한다.
- 오류 모달은 `role="alertdialog"`, `aria-modal="true"`, 메시지 연결과 포커스 트랩을 제공한다.
- 키보드 순서는 `뒤로가기` → 시작일 → 종료일 → 제목 → `생성하기`다.
- focus-visible 상태는 색만이 아닌 명확한 outline으로 표현한다.

## 반응형

- Figma에는 1920×1080 데스크톱만 정의되어 있다.
- 980px 이하에서는 시작일과 종료일 카드를 세로로 배치하고, 제목 카드와 버튼은 가용 너비 안에서 표시한다.
- 모바일 정밀 배치는 Figma 미제공 항목이며 데스크톱 수용 기준을 대체하지 않는다.

## 범위 제외

- 휴관 유형
- 반복 일정
- 기간 중복 확인과 경고
- 예약 차단 on/off 설정
- 수정과 삭제
- 작성 중 이탈 확인
- 새로운 form, modal 또는 date-picker 라이브러리 추가

## 기능 테스트 수용 기준

- S1: `/notices/guide/create` 진입 → `뒤로가기`, 시작일, 종료일, 제목, `생성하기`가 보인다.
- S2: `뒤로가기` 클릭 → `/notices/guide`로 이동한다.
- S3: 날짜가 비어 있는 상태에서 `생성하기` 클릭 → `휴관일을 입력해 주세요` 모달이 보인다.
- S4: 날짜를 모두 입력하고 제목이 비어 있는 상태에서 `생성하기` 클릭 → `제목을 입력해 주세요` 모달이 보인다.
- S5: 오류 모달의 `확인` 클릭 → 모달이 닫히고 오류 입력으로 포커스가 이동한다.
- S6: 종료일이 시작일보다 빠름 → 생성 요청을 전송하지 않는다.
- S7: 유효한 시작일, 종료일과 제목으로 생성 성공 → 요청이 한 번 전송되고 `/notices/guide`로 이동한다.
- S8: 생성 실패 → 입력값과 현재 페이지가 유지되고 다시 생성할 수 있다.
- S9: 키보드만 사용 → 날짜와 제목 입력, 생성, 모달 확인, 뒤로가기를 수행할 수 있다.

## 미결 사항

- [ ] 종료일이 시작일보다 빠를 때의 오류 문구와 Figma 상태 / 제품·디자인 담당
- [ ] 생성 성공과 서버 실패 피드백 / 제품·디자인 담당
- [ ] `POST /close-schedule` 요청·응답 계약 / 백엔드 담당
- [ ] 과거 날짜 등록 허용 여부 / 제품 담당
- [ ] 모바일 또는 최소 지원 너비의 정밀 레이아웃 / 디자인 담당
