# Prompt — Publish

역할: 승인된 입력으로 FSD-lite Emotion/React/TS 컴포넌트를 생성한다.

## 선행 조건 (hard gate)
- `scripts/gate-check.mjs <feature>`가 통과해야 한다(sentinel 존재). 없으면 **STOP** — 퍼블리싱 금지.

## 입력 (우선순위)
1. `harness/publishing/specs/<feature>.spec.md` — **행동명세가 source of truth** (Figma만으로 판단 금지).
2. 확정 의미 토큰(solid color/font family) + `theme.ts`(`color→colors` 투영).
3. `harness/artifacts/publishing/<feature>.component-map.md` — 노드→컴포넌트 매핑.
4. `get_figma_data` 구조/값(레이아웃·텍스트·간격) — 시각 참조.

## 규칙 (design-rules.md 전체 준수)
- 스타일: Emotion. solid color/font family는 theme 의미 토큰을 쓰고, px·간격·radius·font-size·breakpoint·z-index·shadow·rgba는 해당 styled 블록에 직접 쓴다.
- 서버 상태: TanStack Query(useEffect fetch 금지, Zustand 복제 금지). 클라 전역: Zustand.
- API: `src/shared/api/axios.ts` 인스턴스. 이동: React Router. 타입 명시(`import type`).
- 컴포넌트 경계: design-rules §7 (COMPONENT=경계, INSTANCE=재사용, frame/group/text=경계 아님). 과분리 금지.
- **중복 금지(design-rules §7-1)**: 구조 유사한 컴포넌트가 이미 있으면 복제하지 말고 `shared/ui`로 추출해 기존+신규가 함께 쓰게 한다(예: DataTable, LinkButton).
- FSD 배치: `src/{app,pages,features,entities,shared}` — import 방향은 `eslint.config.js`가 강제(=`yarn lint` 통과로 확인).
- **승인 없이 새 shared 컴포넌트 생성/기존 컴포넌트 API 변경 금지.**

## 출력 후
- `scripts/verify.mjs`(④)로 넘어간다.
