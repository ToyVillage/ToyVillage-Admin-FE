# Design Input Contract

이 문서는 하네스가 Figma에서 무엇을, 어떤 도구로 가져오는지를 정의하는 **agent-agnostic 계약**이다.
Claude / Codex 모두 이 문서를 SSOT로 읽는다. (설계 문서의 툴 이름보다 이 문서가 우선한다.)

## 1. 설치된 Figma MCP 도구 (실제)

| 목적 | 도구 |
|------|------|
| 구조 + 값(색/간격/폰트) 추출 | `mcp__figma__get_figma_data` (fileKey, nodeId) |
| 래스터/아이콘 에셋 다운로드 | `mcp__figma__download_figma_images` (fileKey, nodes[], localPath) |

> 설계 문서의 `get_design_context` / `get_variable_defs`(Figma 공식 Dev Mode MCP)는 **이 환경에 설치돼 있지 않다.** 사용 금지.

## 2. Phase 0.0 스파이크 결과 (2026-07-05)

**대상:** fileKey `fkbMQaiPeIufKzjXXoWAPS`, node `1541:1442` (toyvillage dev — 공지사항 화면)

**결과: Figma Variables(명명된 디자인 토큰) 노출 안 됨.** ❌

- `get_figma_data`의 `GLOBAL_VARS`에 있는 `fill_34dc0314`, `style_d320d970` 등은 **Figma Variables가 아니라** MCP 서버가 생성한 **해시 이름의 중복제거 참조**다. 시맨틱 이름(예: `color/primary`)이 없다.
- 색상은 의미 이름 없이 **raw hex로 인라인**된다.
- 관측된 raw 값(예시):
  - 색: `#F5F5F7`(배경), `#FFFFFF`, `#000000`, `#FF8181`(핑크 강조), `#FFDDDD`(핑크 배경), `#838383`·`#7C7C7C`·`#747474`·`#727272`(회색), `#E1E1E1`(헤더), `#A1A1A1`(테두리)
  - 폰트: `Wanted Sans` (Medium 500 / SemiBold 600), size 18·20·22·24·32·60
  - 간격: padding 10/44·11/40·6/12·12/16, gap 8·10 / radius 20·25·53px

**결론:** 시맨틱 토큰 자동 추출 불가 → **fallback 경로(의미 토큰 후보와 직접 구현값 분리)** 채택.

## 3. 토큰 전략 (fallback 확정: 의미 토큰 최소화)

1. `map-tokens.mjs`가 `get_figma_data` 응답에서 **raw 값을 수집·중복제거**해 후보 목록을 만든다:
   - 의미 토큰 후보: solid hex color, 공통 font family
   - 직접 구현값: px 치수·간격·반경·font size/weight, `rgba()`/`hsla()`와 alpha hex
2. 후보를 `harness/artifacts/publishing/<feature>.token-candidates.json` + `<feature>.token-diff.report.md`로 출력한다.
3. **의미 이름은 자동으로 붙이지 않는다.** 개발자가 중간 확인 게이트(`figma-review.md`)에서 solid color/font family 후보에만 시맨틱 이름(`color.primary` 등)을 부여한다.
4. px·spacing·radius·font size/weight·breakpoint·z-index·shadow·alpha color는 tokens.ts에 추가하지 않고 해당 Emotion 스타일에 직접 작성한다.
5. 기존 `src/shared/theme/tokens.ts`와 대조하되 **기존 의미 토큰 우선**, 차이는 diff로 보고한다. `map-tokens.mjs`는 **tokens.ts를 절대 쓰지 않는다**(읽기 전용).
6. `check-style-policy.mjs`가 tokens.ts의 구현값 그룹과 px/rgba 계열 값을 검출해 `yarn verify`를 실패시킨다.

> `token-candidates.json`은 `tokenCandidates`와 `directValues`를 별도 필드로 제공한다.

## 4. 추출 계약 (무엇을 어디서)

- **구조/레이아웃/텍스트/인라인 값:** `get_figma_data`의 `NODES` 트리 + `ELEMENTS`/`GLOBAL_VARS`.
  - 컴포넌트 경계 판단: Figma `type`이 `COMPONENT`/`INSTANCE`면 경계/재사용 후보, `FRAME`/`GROUP`/`TEXT`/`LINE`/`IMAGE-SVG`는 경계 아님(레이아웃 컨테이너/요소로만 취급).
- **아이콘/이미지 에셋:** `download_figma_images`로 `IMAGE-SVG` 노드(예: `ic:twotone-menu`, `ic:outline-plus`)를 저장.
  - 기본값: SVG 아이콘 → **`src/shared/ui/icons`** (컴포넌트로 import). 래스터(png 등 참조용) → `public/`.

## 5. MCP 사용 불가 시 (STOP-and-report)

Figma MCP가 다운/미인증이면 **하드 STOP** 후 개발자에게 보고한다. 대체 경로:
- 개발자가 `harness/publishing/specs/<feature>.spec.md`에 구조/토큰을 수동 기재 → 그 값으로 퍼블리싱 진행.
- 자동 토큰 추출 단계는 건너뛴다(수동 토큰).
