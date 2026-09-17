# Component Map — login

기준: yot `P7Jhnu8qV5m9q2QJNzkwAN` › `1830:17172` (`login (empty)`)

## 매핑

| Figma 노드 | type | → 코드 | 레이어 | 재사용? | props |
| --- | --- | --- | --- | --- | --- |
| `1830:17172` | FRAME | `LoginPage` | pages | 기존 수정 | — |
| `1830:17173` | FRAME | `LoginBrandPanel` | page 내부 (`pages/login/ui`) | new — 장식 패널, `aria-hidden` | — |
| `1830:17175`·`17176`·`17177`·`17179` | IMAGE-SVG | 브랜드 패널 도형 | page asset | Figma SVG export | — |
| `1830:17174`·`17180` | RECTANGLE | 브랜드 패널 사각형 | page 내부 | CSS 배경 | — |
| `1830:17184` | FRAME | 로그인 카드 레이아웃 | page 내부 | 별도 컴포넌트 분리 없음 | — |
| `1830:17186` | IMAGE | 토이빌리지 로고 | shared asset | 기존 `shared/assets/toyvillage-logo.png` | `alt` |
| `1830:17190` | FRAME | 아이디 field | feature form 내부 | native `label` + `input` | `value`, `onChange`, `error` |
| `1830:17202` | FRAME | 비밀번호 field | feature form 내부 | native `label` + `input` | `value`, `visible`, `onChange`, `onToggle`, `error` |
| `1830:17206` | IMAGE-SVG | `PasswordVisibilityButton` 아이콘 | feature asset | 숨김: 기존 `features/login/assets/eye-off.svg`(Figma와 동일) · 표시: `eye.svg`(yot `1:2446` mdi:eye export) | 상태별 accessible name |
| `1830:17208`·`17212` | FRAME | 필수값 오류 메시지 | feature form 내부 | `LoginFieldError` (LoginForm 내부) | `id`, `children` |
| `1830:17194` | FRAME | 로그인 submit button | feature form 내부 | native `button` | `isPending` |

## 새 컴포넌트 후보 점검

- [x] `LoginBrandPanel` — 1080px 장식 패널이라 LoginPage 파일 비대를 막기 위해 page 내부로 분리
- [x] `LoginFieldError` — 두 필드가 같은 `!` 배지 + 문구를 쓰므로 LoginForm 내부 styled 조합으로만 둔다
- [ ] 범용 `FormField`/`Input`/오류 메시지 shared 추출 — 다른 화면의 오류 표시(경고 아이콘 SVG)와 모양이 달라 만들지 않음

## 확인할 항목

- 실제 인증 API는 이미 `/api` 작업으로 연결돼 있으며 이 퍼블리싱에서 바꾸지 않는다.
- 브랜드 문구는 Figma Inter 대신 Wanted Sans를 쓴다.
- 새 의미 토큰 후보: `#2B6034`(패널 배경), `#377B43`(패널 사각형), `#3A7D44`(로그인 버튼). SVG 내부 색은 에셋에 둔다.
