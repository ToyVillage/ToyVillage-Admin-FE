# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-07-18
- Primary product surfaces: 토이빌리지 관리자 웹의 공지사항, 휴관일 관리, 자료실, 단체 예약 현황
- Evidence reviewed:
  - `README.md`
  - `harness/publishing/design-rules.md`
  - `harness/publishing/specs/notice-list.spec.md`
  - `harness/publishing/specs/notice-create.spec.md`
  - `harness/publishing/specs/notice-edit.spec.md`
  - `harness/publishing/specs/resources-list.spec.md`
  - `harness/publishing/specs/close-schedule.spec.md`
  - `harness/publishing/specs/close-schedule-edit.spec.md`
  - `harness/publishing/specs/operating-hours-edit.spec.md`
  - `harness/artifacts/publishing/notice-list.figma.txt`
  - `harness/artifacts/publishing/operating-hours-edit.figma.txt`
  - Figma `2114:1329` 휴관일 생성 기본 화면
  - Figma `2413:2955`, `2413:3046` 휴관일 생성 검증 오류 화면
  - Figma `2456:5047` 날짜별 영업시간 수정 화면
  - Figma `2431:2235` 작성 중 이탈 확인 모달
  - Figma `1787:1603` 공지사항 수정 화면
  - `src/app/App.tsx`
  - `src/shared/theme/tokens.ts`
  - `scripts/map-tokens.mjs`
  - `scripts/check-style-policy.mjs`
  - `src/pages/notices/**`
  - `src/features/sidebar/**`

이 문서는 저장소 공통 디자인 계약이다. 기능별 행동과 예외 처리는 `harness/publishing/specs/*.spec.md`가 더 구체적인 source of truth이며, Figma는 배치와 시각 세부사항의 근거로 사용한다.

## Brand

- Personality: 친근하지만 업무 처리가 빠르고 명확한 운영 도구
- Trust signals: 현재 상태, 적용 범위, 저장 결과와 오류 원인을 숨기지 않고 즉시 보여준다.
- Avoid: 장식 위주의 화면, 의미가 불명확한 아이콘 단독 액션, 공휴일과 휴관일처럼 운영 의미가 다른 용어의 혼용

## Product goals

- Goals:
  - 관리자가 공지, 자료, 휴관일과 단체 예약 정보를 빠르게 찾고 관리한다.
  - 생성·변경 작업의 적용 결과와 사용자 서비스에 미치는 영향을 명확히 이해한다.
- Non-goals:
  - 현재 관리자 화면에서 일반 사용자의 탐색 경험을 그대로 재현하지 않는다.
  - 기능 근거 없이 새로운 디자인 시스템이나 도메인 정책을 만들지 않는다.
- Success signals: 주요 작업 완료 여부를 즉시 확인할 수 있고, 잘못된 저장과 의도하지 않은 이탈을 예방하며, 키보드만으로도 핵심 흐름을 완료할 수 있다.

## Personas and jobs

- Primary personas: 토이빌리지 운영 관리자
- User jobs: 공지 게시, 파일 자료 관리, 휴관일 등록과 조회, 단체 예약 현황 확인
- Key contexts of use: 데스크톱 중심의 반복적인 운영 업무, 일정 변경이나 문의 대응 중의 빠른 정보 확인

## Information architecture

- Primary navigation: 공지사항, 휴관일 관리, 자료실, 단체예약 현황
- Core routes/screens:
  - `/notices/list`와 하위 생성·상세 화면
  - `/notices/guide`, `/notices/guide/create`, `/notices/guide/:id/edit`, `/notices/guide/hours/:date`
  - `/notices/resources`와 하위 생성·상세 화면
  - `/notices/reservations`
- Content hierarchy: 페이지 제목과 설명 → 주요 액션 → 필터·탐색 → 데이터 또는 폼 → 상태 피드백

## Design principles

- 운영 영향 우선: 저장 결과뿐 아니라 예약 차단, 공개 여부처럼 사용자 서비스에 미치는 영향을 액션 전에 설명한다.
- 복구 가능한 입력: 오류가 발생해도 작성 내용을 보존하고, 이탈 시 손실 가능성을 알린다.
- 일관된 관리 패턴: 같은 역할의 제목, 생성 버튼, 목록, 폼 액션과 피드백은 기존 토큰과 공통 컴포넌트를 재사용한다.
- Tradeoffs: 작은 화면에서 정보 밀도보다 읽기 순서와 조작 안정성을 우선한다.

## Visual language

- Color: `src/shared/theme/tokens.ts`의 배경, 표면, 텍스트, 핑크 강조 색을 사용한다. 오류·성공·경고 색은 토큰이 확정되기 전 컴포넌트에 하드코딩하지 않는다.
- Typography: Wanted Sans와 시스템 폴백은 font family 토큰을 사용하고, 페이지 제목·부제·본문의 font-size/weight는 Figma와 기능별 spec 값을 Emotion에 직접 작성한다.
- Spacing/layout rhythm: Figma와 기능별 spec의 값을 해당 Emotion 스타일에 직접 작성한다. 공통 콘텐츠 최대 너비 등 수치가 반복돼도 의미 토큰으로 승격하지 않는다.
- Shape/radius/elevation: radius와 shadow는 해당 컴포넌트의 문맥값으로 직접 작성하며, 그림자는 정보 계층이나 오버레이 구분에 필요한 경우로 제한한다.
- Motion: 상태 변화 이해에 필요한 짧은 전환만 사용하고, 저장이나 이동을 애니메이션으로 지연하지 않는다.
- Imagery/iconography: 기존 SVG와 단순한 기능 아이콘을 사용하고, 아이콘 단독 버튼에는 접근 가능한 이름을 제공한다.

## Components

- Existing components to reuse: `LinkButton`, `DataTable`, 사이드바, 기존 페이지 헤더와 테마 토큰
- New/changed components: 기능별 spec에서 필요한 폼, 캘린더, 상태 피드백을 정의한다. 공지 생성·수정은 같은 분류·제목·내용·첨부 폼을 mode로 재사용하고 Figma `2431:2235` 작성 중 이탈 확인을 feature 내부에서 소유한다. 휴관 일정 생성·수정도 같은 날짜·제목 폼을 mode만 바꿔 재사용한다. 구조가 동일해질 때만 `shared/ui`로 승격한다.
- Variants and states: 기본, hover, focus-visible, disabled, loading, error, success를 역할에 맞게 제공한다.
- Token/component ownership: `tokens.ts`는 제품 의미가 있는 solid color와 공통 font family만 소유한다. px·rgba·spacing·radius·font-size·layout·shadow는 사용하는 Emotion 컴포넌트가 소유한다. 공통 표현은 `shared/ui`, 도메인 표현은 `entities`, 사용자 행동은 `features`, 화면 조합은 `pages`가 소유한다.

## Accessibility

- Target standard: WCAG 2.2 AA를 목표로 한다.
- Keyboard/focus behavior: 모든 액션과 입력은 키보드로 접근 가능해야 하며, 모달은 포커스를 가두고 닫힐 때 호출 요소로 복귀한다.
- Contrast/readability: 텍스트와 상태 색은 AA 대비를 충족하고, 색만으로 필수·오류·선택 상태를 전달하지 않는다.
- Screen-reader semantics: 실제 `button`, `a`, `label`, `input`, 제목 구조와 live region을 우선 사용한다.
- Reduced motion and sensory considerations: `prefers-reduced-motion`을 존중하고, 깜빡임이나 자동 이동을 사용하지 않는다.

## Responsive behavior

- Supported breakpoints/devices: 최신 데스크톱 브라우저가 우선이며, 980px 이하에서는 다단 레이아웃을 한 열로 전환한다. 480px 이하 사이드바 패턴은 기존 토큰을 따른다.
- Layout adaptations: 액션 영역은 좁은 화면에서 본문 아래로 흐르게 하고, 입력 필드는 잘리거나 가로 스크롤을 요구하지 않아야 한다.
- Touch/hover differences: hover만으로 정보를 노출하지 않으며, 터치 대상은 최소 44×44px를 목표로 한다.

## Interaction states

- Loading: 기존 콘텐츠를 불필요하게 지우지 않고, 중복 제출을 막으며 진행 중임을 텍스트로 알린다.
- Empty: 데이터가 없는 이유와 가능한 다음 행동을 함께 제공한다.
- Error: 원인과 복구 행동을 가까운 위치에 표시하고 사용자의 입력을 보존한다.
- Success: 완료 사실을 알리고 후속 화면에서 생성·변경 결과를 확인할 수 있게 한다.
- Disabled: 비활성 이유가 폼 검증 또는 주변 설명으로 이해 가능해야 한다.
- Offline/slow network, if applicable: 요청이 지연되거나 실패해도 이중 저장을 막고 재시도할 수 있어야 한다.

## Content voice

- Tone: 짧고 직접적이며 운영 결과를 구체적으로 설명한다.
- Terminology: 관리자 기능과 도메인은 `휴관일 관리`, `휴관일`로 통일한다. `공휴일`과 `휴관일`을 같은 의미로 혼용하지 않는다.
- Microcopy rules: 버튼은 Figma의 `생성하기`, `뒤로가기`처럼 행동으로 쓰고, 오류는 문제와 해결 방법을 짧게 전달한다.

## Implementation constraints

- Framework/styling system: React, TypeScript, React Router, Emotion
- Design-token constraints: solid color와 font family만 theme 의미 토큰을 사용한다. px·rgba·spacing·radius·font-size·breakpoint·z-index·shadow는 Emotion에 직접 쓰며 tokens.ts 추가를 금지한다. `yarn style-policy`가 이를 검사한다.
- Performance constraints: 서버 상태는 TanStack Query, HTTP는 공통 Axios 인스턴스, 전역 UI 상태만 Zustand를 사용한다.
- Compatibility constraints: 타입 전용 import와 FSD import 경계를 ESLint 계약에 맞춘다. 새 의존성은 추가하지 않는다.
- Test/screenshot expectations: 변경한 행동은 Playwright로, 타입·경계·토큰 정책은 lint/typecheck/style-policy/build로 검증한다. Figma 프레임이 있는 퍼블리싱은 하네스 승인 게이트를 따른다.

## Open questions

- [ ] 운영 권한별 생성·수정·삭제 범위 / 제품 담당 / 관리자 액션 노출에 영향
- [ ] 공통 성공·오류 토스트와 확인 모달 패턴 / 디자인 담당 / 생성 화면 피드백 구현에 영향
- [ ] 공지 생성 화면과 상태별 Figma node ID 및 정확한 입력 정책 / 제품·디자인 담당 / 공지 생성 폼의 배치·문구·검증 표현에 영향
- [ ] 관리자 웹의 최소 지원 너비와 브라우저 범위 / 제품·개발 담당 / 반응형 수용 기준에 영향
- [ ] 휴관일 반복 일정의 규칙과 서버 모델 / 제품·백엔드 담당 / 반복 등록 기능 범위에 영향
