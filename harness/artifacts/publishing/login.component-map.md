# Component Map — login

## 매핑

| Figma 노드 | type | → 코드 | 레이어 | 재사용? | props |
| --- | --- | --- | --- | --- | --- |
| `3584:4577` | FRAME | `LoginPage` | pages | new | — |
| `3584:4780` | FRAME | 로그인 카드 레이아웃 | page 내부 | 별도 컴포넌트 분리 없음 | — |
| `3584:4775` | ROUNDED_RECTANGLE/IMAGE | 토이빌리지 로고 | page asset | Figma export | `alt` |
| `3584:4794` | FRAME | 아이디 field | feature form 내부 | native `label` + `input` | `value`, `onChange`, `error` |
| `3587:4808` | INSTANCE | 비밀번호 field | feature form 내부 | Figma instance 구조 재사용 | `value`, `visible`, `onChange`, `onToggle`, `error` |
| `3584:4790` | IMAGE-SVG | `PasswordVisibilityButton` 아이콘 | feature asset | Figma SVG | 상태별 accessible name |
| `3584:4792` | FRAME | 로그인 submit button | feature form 내부 | native `button` | `isPending` |

## 새 컴포넌트 후보 점검

- [x] `LoginPage` — `/login` 라우트의 페이지 조합 책임
- [x] `LoginForm` — 입력·검증·표시 전환·제출 상태를 소유하므로 feature로 분리
- [x] `PasswordVisibilityButton` — 상태와 접근 가능한 이름을 가진 실제 control
- [ ] 범용 `FormField`/`Input` shared 추출 — 현재 재사용 근거가 없어 만들지 않음
- [ ] 카드·브랜드 블록 분리 — 일반 FRAME이므로 별도 컴포넌트로 만들지 않음

## 확인할 항목

- 실제 인증 API와 토큰 저장은 퍼블리싱 범위에서 제외한다.
- 실패 오류의 문구와 시각 상태는 Figma 미제공 TODO다.
- Figma는 eye-off 아이콘 한 상태만 제공하므로 표시 상태의 아이콘 표현은 구현 전 승인 범위에 포함한다.
