# Design Rules (퍼블리싱 전용)

Figma 퍼블리싱 작업은 먼저 [`../shared/code-rules.md`](../shared/code-rules.md)의 공통 프론트엔드 규칙을 따른다. 이 문서는 Figma 해석과 퍼블리싱에만 필요한 규칙을 추가한다.

## 1. Figma 노드와 컴포넌트 경계

- Figma `COMPONENT`는 코드 컴포넌트 경계 후보이다.
- Figma `INSTANCE`는 기존 컴포넌트 재사용 위치이다.
- variant는 props 또는 상태 후보이다.
- 일반 `FRAME`, `GROUP`, `TEXT`, `LINE`, `IMAGE-SVG`는 그 자체만으로 컴포넌트 경계가 아니다.
- 대응되는 기존 저장소 컴포넌트가 있으면 재사용한다.
- Figma가 flat 구조라면 `specs/<feature>.spec.md`의 구조와 props 명세를 따른다.

## 2. 라이브 Figma가 시각 정보의 기준

- 대상 nodeId를 Figma 도구로 다시 조회해 확인한다.
- `harness/artifacts/publishing/*.figma.txt`는 실행 중 캐시이므로 기능의 존재나 부재를 단정하는 근거로 사용하지 않는다.
- 개발자가 Figma URL을 제공하면 URL의 fileKey와 nodeId를 우선하며, 기존 spec과 다르면 spec 갱신 및 재승인 여부를 확인한다.
- 에셋을 내려받기 전에 저장소의 기존 에셋을 검색한다. 기존 에셋이 있으면 재사용한다.

## 3. 토큰과 스타일 입력

- 이 저장소의 현재 Figma 입력은 Variables를 노출하지 않는다.
- solid color와 공통 font family만 의미 토큰 후보로 수집한다.
- 치수, 간격, radius, font-size, breakpoint, z-index, shadow, `rgba()`/`hsla()`는 Emotion 구현값으로 둔다.
- 의미가 불명확한 색상이나 새 공통 컴포넌트 후보는 승인 전 TODO로 남긴다.
- 세부 입력 계약은 [`design-input-contract.md`](./design-input-contract.md)를 따른다.

## 4. 퍼블리싱 범위

- 행동명세가 기능 동작의 기준이고 Figma는 배치와 시각 세부사항의 근거이다.
- 퍼블리싱 작업에서 명세에 없는 실제 API를 임의로 연결하지 않는다.
- 구조가 같은 컴포넌트 복제를 피하되, 새 shared 컴포넌트나 기존 shared API 변경은 중간 게이트 승인 범위에 포함한다.

## 5. 검증

- 정적 검증은 `yarn verify`로 수행한다.
- 기능 테스트는 승인된 시나리오가 있는 경우에만 `yarn verify:e2e <feature>`로 수행한다.
