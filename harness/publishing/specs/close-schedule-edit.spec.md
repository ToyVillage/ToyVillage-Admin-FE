---
feature: close-schedule-edit
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1:7062
  relatedNodeIds:
    - 1:7011
    - 1:6148
    - 1:7085
    - 1:7034
    - 1:7048
requires_functional_test: true
paths: src/pages/notices/guide/EditCloseSchedulePage.tsx, src/features/create-close-schedule, src/entities/close-schedule
---

# 휴관일 수정 페이지 행동명세

## 상태와 근거

- Status: Active
- Last refreshed: 2026-09-17
- 2026-09-17: 구 파일 노드로 남아 있던 참조를 yot 노드로 바꿨다(#80). `1:7085`(삭제 실패 모달)는 삭제가 목록 케밥으로 옮겨져 쓰지 않는다.
- 2026-09-17 변경: yot `1:7062` 기준으로 `삭제하기`를 제거한다. 삭제는 목록 카드 케밥으로 이동했다(`close-schedule.spec.md`).
- 목록 진입점: Figma `1:6148`
- 수정 화면 기준: yot Figma `1:7062` (섹션 `휴관일 관리 · 수정` `311:12760`)
- 공통 폼 배치 기준: Figma `1:7011`의 휴관일 생성 화면
- 날짜·제목 오류 상태: Figma `1:7034`, `1:7048`
- 수정 화면은 생성 화면의 입력 구조와 시각값을 재사용하고 저장 액션 하나만 제공한다.
- 공통 UI 원칙은 `DESIGN.md`, 목록 행동은 `close-schedule.spec.md`, 공통 입력·검증 규칙은 `close-schedule-create.spec.md`를 따른다.

## 목적

관리자가 오른쪽 휴관 일정 목록에서 기존 일정을 선택하고 시작일, 종료일과 제목을 수정한다.

## 라우트와 진입

- 오른쪽 휴관 일정 카드 케밥 `수정` → `/notices/guide/:id/edit`로 이동한다. 카드 본문 클릭은 상세(`close-schedule-detail.spec.md`)로 간다(2026-09-17 변경).
- `id`는 휴관 일정의 안정적인 식별자다.
- `뒤로가기` 또는 수정 성공 → `/notices/guide`로 이동한다.
- 존재하지 않는 `id`로 진입 → `/notices/guide`로 replace 이동한다.

## 화면과 초기값

- 화면 배치, 날짜 카드, 제목 카드와 오류 dialog는 생성 페이지와 동일하게 재사용한다.
- 선택한 일정의 `startDate`, `endDate`, `title`을 각 입력의 초기값으로 표시한다.
- 액션은 `저장하기` 하나만 표시하고(yot `1:7062`) 저장 요청 중 라벨은 `저장 중`이다.
- 수정 페이지를 직접 새로고침해도 `id`로 일정을 다시 조회해 초기값을 복원한다.
- 조회 완료 전에는 빈 생성 폼을 표시하지 않는다.

## 입력과 검증

- 시작일·종료일은 `YYYY-MM-DD` date-only 값으로 편집한다.
- 제목은 필수 한 줄 입력이며 저장 전에 앞뒤 공백을 제거한다.
- 시작일 또는 종료일이 비어 있음 → `휴관일을 입력해 주세요` dialog를 표시한다.
- 종료일이 시작일보다 빠름 → `종료일은 시작일과 같거나 이후여야 합니다` dialog를 표시한다.
- 제목이 비어 있음 → `제목을 입력해 주세요` dialog를 표시한다.
- 오류 dialog 확인 또는 Escape → dialog를 닫고 첫 오류 입력으로 포커스를 이동한다.
- 검증 실패 시 수정 요청을 보내지 않고 입력값을 유지한다.

## 수정 저장

- 유효한 값으로 `저장하기` 클릭 → 선택 일정 ID와 입력값으로 수정 요청을 한 번 전송한다.
- 요청 중에는 버튼을 비활성화해 중복 저장을 막는다.
- 성공 → `['close-schedules']` query를 갱신하고 `/notices/guide`로 이동한다.
- 목록에는 동일한 ID의 일정이 하나만 보이며 수정된 날짜와 제목이 즉시 반영된다.
- 실패 → 현재 URL과 입력값을 유지하고 `수정하지 못했습니다. 다시 시도해 주세요.`를 표시한다.
  - yot `휴관일 관리 · 수정`·`토스트` 섹션에는 수정 성공·실패 프레임이 없어 이 표시를 유지한다(2026-09-17 #133 확인).
- 실패 후 같은 화면에서 다시 시도할 수 있다.

## 데이터와 API 경계

```ts
interface UpdateCloseScheduleInput {
  id: string
  startDate: string
  endDate: string
  title: string
}
```

- 단건 조회 endpoint 후보: `GET /close-schedule/:id`
- 수정 endpoint 후보: `PUT /close-schedule/:id`
- 실제 API 계약 전에는 localStorage mock adapter를 사용한다.
- 기본 mock 일정 수정값과 생성 일정은 ID 기준으로 병합하며 중복 카드를 만들지 않는다.
- 서버 상태와 mutation은 TanStack Query가 소유한다.

## 컴포넌트와 소유권

- `EditCloseSchedulePage` (`pages/notices/guide`) — route param, 단건 조회, 잘못된 ID 복구, 수정 폼 조합
- `CloseScheduleForm` (`features/create-close-schedule`) — 생성·수정 공통 입력과 검증, mode별 mutation과 라벨
- `CloseScheduleDateField`, `ValidationDialog` — 기존 생성 UI 재사용
- `getMockCloseSchedule`, `updateMockCloseSchedule`, `deleteMockCloseSchedule` (`entities/close-schedule`) — 단건 조회와 ID 기반 수정·삭제 저장
- 새 form, dialog 또는 date-picker 의존성을 추가하지 않는다.

## 접근성

- 수정 진입은 카드 케밥(`${일정 제목} 메뉴`)의 `수정` 메뉴 항목이다.
- 폼의 보이는 label, 필수 상태, 오류 dialog와 포커스 복귀는 생성 페이지 계약을 유지한다.
- 키보드 순서는 `뒤로가기` → 시작일 → 종료일 → 제목 → `저장하기`다.
- 제목 입력을 포함한 모든 조작 요소는 명확한 포커스 표시를 제공한다.
- 키보드만으로 케밥 `수정` 진입, 값 편집, 오류 확인, 수정 저장과 뒤로가기를 수행할 수 있다.

## 반응형

- 1920×1080 Figma 생성 화면을 기준으로 한다.
- 980px 이하에서는 날짜 카드를 한 열로 배치하고 제목 카드와 버튼을 가용 너비 안에 표시한다.
- 모바일 정밀 배치는 Figma 미제공 항목이다.

## 기능 테스트 수용 기준

- S1: 오른쪽 휴관 일정 카드 케밥 `수정` → 해당 ID의 수정 URL로 이동한다.
- S2: 수정 페이지 진입 → 기존 시작일, 종료일과 제목이 입력되어 있다.
- S3: 유효한 값 수정 성공 → 목록으로 이동하고 동일 ID 카드 하나에 수정값이 보인다.
- S4: 날짜 누락, 잘못된 날짜 순서 또는 빈 제목 → 요청하지 않고 해당 오류 dialog를 표시한다.
- S5: 존재하지 않는 ID URL 진입 → `/notices/guide`로 replace 이동한다.
- S6: 수정 저장 실패 → URL과 입력값이 유지되고 다시 시도할 수 있다.
- S7: 키보드만 사용 → 케밥 `수정` 진입, 입력 편집, 수정 저장과 뒤로가기를 수행할 수 있다.
- S8: 수정 화면에 `삭제하기` 버튼이 없다.

## 범위 제외

- 반복 일정과 휴관 유형
- 기간 중복 경고
- 예약 차단 on/off 설정
- 작성 중 이탈 확인
- 수정 전용 신규 시각 디자인
- 실제 API 계약 확정

## 미결 사항

- [ ] `GET/PUT /close-schedule/:id` 요청·응답 계약 / 백엔드 담당
- [ ] 수정 전용 Figma 프레임과 저장 성공 피드백 / 디자인 담당
- [ ] 기간 중복 허용 정책 / 제품 담당
