# ToyVillage Admin FE

React + TypeScript + Vite + Emotion + TanStack Query + Zustand + React Router, FSD-lite 구조.

## Publishing Harness (Figma → Code)

개발자의 **행동명세 + Figma 프레임**을 FSD-lite 컴포넌트로 퍼블리싱하는 agent-agnostic 하네스.
어떤 AI 에이전트(Claude Code / Codex)든 **`harness/publishing/RUNBOOK.md`**를 동일하게 따른다.

> 전체 하네스 라우팅: [`harness/README.md`](harness/README.md) · 퍼블리싱 개요: [`harness/publishing/HARNESS.md`](harness/publishing/HARNESS.md)

- 계약/규칙: `harness/publishing/design-rules.md`, `harness/publishing/design-input-contract.md`, `harness/no-progress.md`
- 입력: `harness/publishing/specs/<feature>.spec.md` (템플릿: `harness/publishing/templates/behavioral-spec.md`)
- 스크립트: `scripts/map-tokens.mjs`(의미 토큰/direct CSS 값 분리, 읽기전용), `check-style-policy.mjs`(구현값 토큰화 차단), `verify.mjs`, `gate-check.mjs`(승인 게이트), `loop-guard.mjs`(N=3+무진전), `run-scenarios.mjs`(= `verify:e2e`), `approve.mjs`(승인/freeze)
- 명령: `yarn harness:map-tokens <f>`, `yarn harness:approve <f> --by <name> --scenarios S1,S2`, `yarn harness:gate <f>`, `yarn verify`, `yarn verify:e2e <f>`
- 승인 기록: `harness/publishing/approvals/<f>.approved.json` + `.scenario-draft.md` (**커밋됨** → clone/CI 재현). 승인 후 시나리오/e2e 변경 시 해시 불일치로 게이트 STOP.
- 승인 게이트는 퍼블리싱과 e2e 명령 진입 시 스크립트가 검사한다. 현재 package.json에는 hook 설치 명령이 없다.

### 재현 세팅 (신선한 clone / CI)

```bash
yarn install
yarn e2e:setup        # Playwright chromium 설치
yarn verify           # lint/typecheck/style-policy/build
yarn verify:e2e notice-list   # 게이트 → dev 서버 → 기능 테스트
```

흐름: Figma 추출 ‖ 시나리오 초안 → 🚦개발자 중간 승인 게이트 → 퍼블리싱 → verify 인너루프 → (조건부)Playwright → 가드레일 → 육안 확인.
참고: 이 저장소 Figma는 Variables 미노출 → 토큰은 raw 수집 후 개발자가 명명(`harness/publishing/design-input-contract.md`).

레퍼런스 슬라이스: `notice-list` (공지 목록) — `src/pages/notice`, `tests/e2e/notice-list.spec.ts`.

## API Harness (Notion Contract → Frontend)

API ID로 Notion 명세를 조회해 Contract를 만든 뒤 개발자 승인 후에만 프론트엔드 연동을 구현한다. 명세 누락이나 데이터베이스/상세 페이지 불일치는 추측하지 않고 STOP한다.

- 실행 절차: `harness/api/RUNBOOK.md`
- 입력: `harness/api/specs/<feature>.spec.md`
- runtime Contract/계획: `harness/artifacts/api/<feature>.*` (Git 비추적)
- 승인본: `harness/api/approvals/<feature>.*` (Git 추적)
- 공통 Axios: `src/shared/api/axios.ts`
- 프론트 기능 테스트: Playwright `page.route()` mock
- 실제 연동 테스트: 승인된 staging API를 사용하는 직렬 Playwright 테스트

```bash
yarn harness:api:validate <feature>
yarn harness:api:approve <feature> --by <developer>
yarn harness:api:gate <feature>
yarn harness:api:policy <feature> <changed-file...>
yarn verify:api <feature>
yarn harness:api:approve <feature> --freeze-real
yarn verify:api:real <feature> --confirm-staging
yarn test:harness
```

API 승인본을 만든 뒤 Mock 테스트를 동결할 때는
`yarn harness:api:approve <feature> --freeze`를 실행한다. 실제 서버 테스트는
task spec의 `real_server`가 승인된 경우에만
`tests/e2e/api-real/<feature>.real.spec.ts`로 작성하고 `--freeze-real`로
별도 동결한다. 실제 테스트는 production을 허용하지 않으며 staging 확인
플래그 없이는 실행되지 않는다.

---

## (template) React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
