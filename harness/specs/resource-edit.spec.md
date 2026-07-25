---
feature: resource-edit
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 2114:1704
  relatedNodeIds:
    - 2125:1778
    - 2052:1802
    - 2114:1206
requires_functional_test: true
paths: src/pages/notices/resources/ResourceDetailPage.tsx, src/features/create-resource, src/entities/resource
---

# 자료실 수정 페이지 행동명세

## 상태와 근거

- Status: Draft
- 수정 화면 기준: Figma `2114:1704` ("remake resource")
- 첨부자료 칩(유형 배지·다운로드·삭제): Figma `2125:1778`
- 업로드 드롭존: Figma `2052:1802`
- 제목/분류 폼: Figma `2114:1206`, `2114:1686`
- 예외(에러) 모달: Figma `1039:50` — ⚠️ Figma API rate limit(Starter 플랜)으로 라이브 추출 보류. 해제 후 정확한 시각 디테일 반영.
- 생성 필드·검증·업로드 계약: `harness/specs/resource-create.spec.md` (생성 폼과 동일 컴포넌트를 mode로 재사용)
- 공통 이탈/삭제/검증 모달은 공지와 동일 컴포넌트(`LeaveConfirmationDialog`, `DeleteConfirmationDialog`, `ValidationDialog`) 재사용
- 예외 모달은 신규 공용 컴포넌트 `ErrorDialog`(shared/ui)로 두어 notice/resource/schedule 수정에서 공통 사용. 시각 언어는 기존 `LeaveConfirmationDialog`(제목 `정말 나가시겠습니까?` + 설명 `저장하지 않고 돌아갈 시 / 입력된 정보가 삭제됩니다`)를 참고한다.
- 라우트: `src/app/App.tsx`의 `/notices/resources/:id`

## 목적

운영 관리자가 기존 자료의 제목·분류와 첨부파일을 확인하고 수정하거나 자료를 삭제한다. 저장·삭제 실패 또는 실수로 인한 이탈에도 입력과 기존 데이터를 잃지 않아야 한다.

## 범위

- 포함: 기존 자료 조회, 제목·분류(파일 유형) 편집, 첨부 확인·다운로드·추가·제거, 저장, 삭제, 이탈 보호
- 제외: 임시 저장, 수정 이력, 실제 파일 서버 업로드 본문(이번 슬라이스는 mock)

## 라우트와 진입

- 자료 목록(`/notices/resources`)의 행 클릭 → `/notices/resources/:id`로 이동한다.
- `/notices/resources/:id` → 해당 ID의 자료 수정 화면을 표시한다.
- 저장 또는 삭제 성공 → `/notices/resources`로 이동한다.
- 존재하지 않는 ID → 입력 폼 대신 `자료를 찾을 수 없습니다.`와 목록 복귀 링크를 표시한다.

## 화면 구조 (Figma 2114:1704)

1920px 데스크톱 기준. 좌측 상단 전역 메뉴 버튼은 기존 사이드바 기능을 재사용한다. 본문은 너비 1320px, 좌우 중앙 정렬이다. 생성 폼과 동일한 카드·필드·첨부·업로드 컴포넌트를 mode로 재사용하며 별도 복제하지 않는다.

1. 제목 카드: 흰색 surface, 20px radius, `제목` 라벨과 기존 제목 입력값(예: `자료 1`)
2. 분류 카드: 흰색 surface, 20px radius, `분류`와 유형 칩(pdf / jpg·jpeg / png / 기타). 저장된 유형이 선택(어두운 배경)되어 있다.
3. 첨부자료 카드: 흰색 surface, 20px radius, 기존 파일 칩(유형 배지·파일명·다운로드·삭제 X)
4. 업로드 드롭존: 점선 border, `파일을 끌어서 놓거나 클릭하여 업로드\n(최대 50MB)`
5. 우측 하단 액션: `삭제하기` red outline, `저장하기` black solid

배경·surface·텍스트·위험 색과 Wanted Sans는 기존 theme를 재사용한다.

## 초기 데이터

- 진입 시 ID로 자료를 조회하고 제목, 분류(파일 유형), 첨부 파일명을 초기값으로 채운다.
- 기본 mock ID `1`은 첨부 파일을 포함한 기준 상태를 재현한다.
  - 첨부: `당일 지침.pdf`, `휴관안내.png`, `휴관안내.jpg`
- 기존 첨부는 파일명과 유형 배지를 표시하고 다운로드 control을 제공한다.

## 편집과 검증

- 제목은 필수이며 저장 시 앞뒤 공백을 제거한다. 빈 값이면 검증 모달(`제목을 입력해 주세요`)과 포커스 복귀를 사용한다.
- 첨부(이미지 또는 파일)는 최소 1개 필수다. 첨부가 없으면 검증 모달(`이미지 또는 파일을 추가해주세요`)을 표시하고 확인 후 업로드 컨트롤로 포커스한다. 검증 순서는 제목 → 첨부.
- 분류는 pdf/jpg·jpeg/png/기타 중 하나를 단일 선택한다(생성 화면과 동일).
- 기존 또는 새 첨부를 제거할 수 있고, 새 파일은 클릭 또는 drag-and-drop으로 여러 개 추가할 수 있다.
- 파일 하나의 최대 크기는 50MB이며 초과 파일은 추가하지 않고 오류를 알린다.
- 변경사항이 없을 때도 저장 control은 사용할 수 있으며 현재 값으로 한 번만 요청한다.

## 저장

- `저장하기` → 현재 ID와 정규화한 입력으로 수정 요청을 한 번 전송한다.
- 요청 중에는 중복 제출을 막고 라벨을 `저장 중`으로 바꾼다.
- 성공 → 자료 query(`['resources']`)를 갱신하고 `/notices/resources`로 이동한다. 목록에는 같은 ID가 하나만 존재하고 수정값이 보인다.
- 실패 → URL과 모든 입력을 보존하고 예외 모달(`ErrorDialog`)로 `저장에 실패하였습니다`를 표시한다. 확인 시 모달을 닫고 현재 입력을 유지한다.

## 삭제

- `삭제하기` → 삭제 확인 dialog를 표시한다.
- 취소 또는 Escape → 삭제하지 않고 dialog를 닫아 `삭제하기`로 포커스를 복귀한다.
- 확인 → 해당 ID 삭제 요청을 한 번 전송한다.
- 성공 → 자료 query를 갱신하고 `/notices/resources`로 이동하며 삭제된 자료는 목록과 직접 URL에서 사라진다.
- 실패 → 현재 화면과 입력을 유지하고 예외 모달(`ErrorDialog`)로 `삭제에 실패하였습니다`를 표시한다. 확인 시 모달을 닫고 현재 화면을 유지한다.

## 예외(에러) 모달 — `ErrorDialog` (신규 공용, shared/ui)

- Figma `1039:50` 기준. 한 줄 제목 + 전체 너비 `확인` 버튼으로, `ValidationDialog` 와 동일한 시각 언어다(설명 줄 없음).
- 카피: 저장 실패 `저장에 실패하였습니다`, 삭제 실패 `삭제에 실패하였습니다`, 생성 실패 `생성에 실패했습니다`.
- 구조: `role="alertdialog"`, `aria-modal`, overlay `rgba(0,0,0,0.5)`, surface 카드(radius 20px), 제목 1줄, 단일 `확인` 버튼(에러 확인 성격이므로 취소 없음).
- props: `ErrorDialog { title, onConfirm }`.
- 동작: Escape 또는 `확인` → `onConfirm`으로 닫는다. 열릴 때 확인 버튼 포커스, 닫힐 때 호출 control로 포커스 복귀. app root `inert`/`aria-hidden` 처리(기존 다이얼로그와 동일).
- 사용처: 자료 저장·삭제 실패. notice/schedule 수정에서도 동일 컴포넌트를 재사용할 수 있게 shared/ui에 둔다.
- 검증: mock은 항상 성공하므로, 예외 모달 경로 e2e(S11)는 `localStorage` 키 `toyvillage:resources:fail`(`update`|`delete`)로 실패를 1회 주입한다. 실제 API 연동(`/api-integration`) 시 이 훅을 제거한다.

## 이탈 보호

- 초기값에서 제목·분류·첨부 중 하나라도 바뀐 뒤 사이드바 링크 또는 브라우저 뒤로가기로 나가려 하면 생성 화면과 같은 이탈 확인 dialog를 표시한다.
- 취소 또는 Escape는 현재 URL과 입력을 유지하고, 확인은 시도한 경로로 이동한다.
- 저장·삭제 성공 이동은 이탈 확인 대상에서 제외한다.
- 새로고침과 탭 닫기는 브라우저 기본 이탈 경고로 보호한다.

## 데이터와 API 경계 (mock)

```ts
interface UpdateResourceInput {
  title: string
  fileType: FileType
  attachments: string[]
}
```

- 조회 endpoint 후보: `GET /resources/:id`
- 수정 endpoint 후보: `PUT /resources/:id`
- 삭제 endpoint 후보: `DELETE /resources/:id`
- query key: `['resources']`, 단건은 `['resources', id]`
- 현재 슬라이스는 localStorage 기반 mock으로 대체한다. 수정값은 ID로 기본 mock을 override하고 삭제 ID는 별도 tombstone으로 유지한다(공지 수정과 동일 패턴).
- 실제 API 연결과 첨부 업로드/다운로드 계약은 별도 `/api-integration` 슬라이스에서 확정한다.

## 접근성

- 제목 input은 프로그램적 label과 required 상태를 제공한다.
- 분류는 fieldset/legend와 radio semantics를 유지한다.
- 파일 칩은 `${파일명} 다운로드`, `${파일명} 삭제` 이름을 제공한다.
- upload dropzone은 키보드로 조작 가능한 `파일 업로드` button이다.
- 삭제 확인 dialog는 `alertdialog`, modal semantics, 포커스 트랩과 호출 control 복귀를 제공한다.
- focus-visible은 색만이 아닌 outline으로 표현한다.

## 반응형

- 980px 이하에서는 카드 padding과 제목 크기를 줄이고 본문은 가용 너비를 사용한다.
- 액션은 좁은 화면에서 줄바꿈할 수 있으며 control의 터치 영역을 최소 44px로 유지한다.

## 기능 테스트 수용 기준

- S1: 자료 목록 첫 행 클릭 → 해당 `/notices/resources/:id` 수정 URL로 이동한다.
- S2: ID `1` 진입 → 저장된 제목·분류와 세 첨부 파일명이 보인다.
- S3: 제목 수정 후 저장 → 목록으로 이동하고 동일 ID 한 행에 수정 제목이 보인다.
- S4: 빈 제목 저장 → 요청 없이 제목 오류 dialog를 표시하고 확인 후 제목으로 포커스가 이동한다.
- S5: 기존 첨부 제거와 새 파일 추가 → 칩 목록이 즉시 갱신된다.
- S6: 삭제 클릭 후 취소 → URL과 자료가 유지되고 삭제 button으로 포커스가 복귀한다.
- S7: 삭제 확인 → 목록으로 이동하고 같은 ID 자료가 보이지 않는다.
- S8: 존재하지 않는 ID 진입 → not-found 상태와 목록 복귀 링크가 보인다.
- S9: 수정 후 사이드바 또는 브라우저 뒤로가기 → 이탈 확인 dialog가 입력 손실을 막는다.
- S10: 저장·삭제 요청 중 재클릭 → 중복 요청을 전송하지 않는다.

## 미결 사항

- [ ] 실제 자료 API endpoint와 첨부 업로드/다운로드 URL 계약 / 백엔드 담당
- [ ] 저장 성공 토스트의 별도 Figma node / 디자인 담당
