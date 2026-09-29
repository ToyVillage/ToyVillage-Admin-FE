---
feature: logout
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1:2720
  relatedNodeIds:
    - 1948:17171
    - 1948:17175
requires_functional_test: true
paths: src/features/sidebar, src/shared/api/session.ts
---

# 로그아웃 행동명세

## 상태와 근거

- Status: Draft
- Last refreshed: 2026-09-17
- 이슈: #105 로그아웃 퍼블리싱
- 기준: Figma `P7Jhnu8qV5m9q2QJNzkwAN` 의 사이드바 인스턴스 `1:2720` 하단
  `divider`(`1948:17175`)와 `하단 / 로그아웃`(`1948:17171`).
- 사이드바 자체의 동작·치수는 `sidebar.spec.md` 가 소유한다. 이 spec은 하단 로그아웃 영역만 다룬다.

## 목적

로그인한 관리자가 사이드바에서 로그아웃해 현재 세션을 끝내고 로그인 화면으로 돌아가게 한다.

## 범위

- 포함: 사이드바 하단 구분선과 `로그아웃` 항목, 클릭 시 브라우저에 저장된 세션 삭제와 `/login` 이동
- 제외: 서버 로그아웃 API(토큰 폐기) 호출, 로그아웃 확인 모달, 로그아웃 완료 토스트
  - 서버 API 가 생기면 `/api` 작업에서 세션 삭제 앞에 연결한다. 이 퍼블리싱에서는 연결하지 않는다.

## 동작 (source of truth)

- 사이드바를 열면 패널 하단에 구분선과 `로그아웃` 항목이 보인다.
- `로그아웃` 항목은 메뉴 목록 스크롤과 무관하게 패널 하단에 고정된다.
- `로그아웃` 클릭 → 확인 없이 바로 로그아웃한다.
  - 저장된 `accessToken` · `refreshToken` · 사용자 정보를 모두 지운다(`clearSession`).
  - `/login` 으로 이동한다. 뒤로 가기로 이전 화면에 돌아가지 않도록 history 를 대체(replace)한다.
- 로그아웃 후 인증이 필요한 경로(`/` 등)에 직접 들어가면 `RequireAuth` 가 `/login` 으로 보낸다.
- `로그아웃` 항목은 어떤 경로에서도 활성(선택) 표시를 하지 않는다.

## 화면 구조 (Figma)

- 구분선: 패널 기준 x=40, y=986, 320 × 1
- `하단 / 로그아웃`: 패널 기준 x=20, y=1000, 360 × 56 (패널 하단 여백 24)
  - 아이콘 `material-symbols:logout` 32×32, 항목 왼쪽 기준 x=36 y=12
  - 라벨 `로그아웃`, 아이콘과 gap 12
  - 레이아웃은 대시보드 항목과 같다(padding `12px 36px`, gap 12). 색·폰트는 ① 추출값으로 확정한다.

## 데이터

- 서버 데이터: 없음.
- 클라이언트 상태: 새 상태 없음. 세션 저장소는 `src/shared/api/session.ts` 를 사용한다.

## 컴포넌트 구조/props

- `Sidebar` 가 하단 영역(구분선 + 로그아웃 버튼)을 렌더링한다.
- 로그아웃 항목은 `button` 이다. 모양이 대시보드 항목과 같으면 `SidebarItem` 을 재사용하고,
  링크가 아닌 버튼으로 쓸 수 있게 필요한 만큼만 확장한다.
- 로그아웃 처리 함수는 sidebar feature 의 model 에 둔다(feature 간 import 금지).
  세션 삭제는 `shared/api/session` 을 사용하고 새 저장 키를 만들지 않는다.

## 접근성

- 로그아웃 항목은 `button` 요소이며 접근 가능한 이름은 `로그아웃` 이다.
- 아이콘은 장식이므로 `aria-hidden` 처리한다.

## 비고 / 제약

- 스타일은 Emotion. solid color/font family 는 theme 의미 토큰, px 등 구현값은 styled 블록에 직접 쓴다.
- 아이콘은 기존 에셋을 먼저 찾고, 없으면 Figma 에서 내려받아 `src/features/sidebar/ui/assets` 에 둔다.
- 화면 높이가 낮아도 로그아웃 항목은 패널 밖으로 밀려나지 않는다(메뉴 영역만 스크롤).

## 미결 (개발자 확인)

- 로그아웃 확인 모달 필요 여부 — Figma 에 없어 이번 범위에서 제외했다.
- 서버 로그아웃 API 존재 여부 — 있으면 `/api` 작업으로 분리한다.
