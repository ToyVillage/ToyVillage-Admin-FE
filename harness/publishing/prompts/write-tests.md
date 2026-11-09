# Prompt — Write Tests

역할: 테스트 담당. 승인된 시나리오와 Figma 기준 이미지만 보고, 구현보다 먼저 테스트를 쓴다. (RUNBOOK ③)

## 선행 조건 (hard gate)

- `scripts/gate-check.mjs <feature>`가 통과해야 한다. 없으면 **STOP**.

## 입력 (이것만 본다)

1. `harness/publishing/approvals/<feature>.scenario-draft.md` — 승인 시나리오 (source of truth)
2. `harness/publishing/specs/<feature>.spec.md` — 행동명세 (경로, 화면 문구)
3. `harness/publishing/baselines/<feature>/*.png` — Figma 기준 이미지 (있을 때)
4. `harness/artifacts/publishing/<feature>.figma.txt` — Figma 구조와 문구
5. `tests/e2e/support/**`, 기존 `tests/e2e/*.spec.ts` — mock·로그인 같은 테스트 지원 코드와 작성 관례
6. `src/shared/ui/**` — 이미 있는 공용 컴포넌트의 역할·라벨·testid 확인용

`src/**`의 나머지(그 기능의 페이지·features·entities)는 **읽지 않는다.** 구현에 맞춘 테스트를 쓰지 않기 위해서다.

## 기능 e2e — `tests/e2e/<feature>.spec.ts`

- `requires_functional_test: true`일 때만 쓴다.
- 승인 시나리오를 **변환만** 한다. 시나리오를 추가·삭제·재해석하지 않는다. 테스트 제목은 시나리오 ID로 시작한다(`S1: ...`).
- 파일 첫머리에 승인 시나리오를 변환한 파일이며 동결 대상임을 주석으로 적는다(기존 spec 관례).
- API는 `page.route` mock으로 처리한다. 실제 서버를 호출하지 않는다.
- 선택자는 `harness/shared/code-rules.md` 9절을 따른다. 역할·라벨·문구는 행동명세와 Figma 문구에서 가져온다.

## 스크린샷 비교 — `tests/visual/<feature>.visual.ts`

- `baselines/<feature>/`에 기준 이미지가 있을 때 쓴다. 기준 이미지 하나당 테스트 하나.
- viewport는 기준 이미지의 가로·세로 크기와 같게 둔다.
- 화면을 기준 이미지와 **같은 상태**로 만든 뒤 캡처한다. 예: 에러 문구가 보이는 프레임이면 그 에러를 일으키는 조작을 먼저 한다. 데이터는 Figma에 적힌 예시 값과 같은 mock으로 준다.
- 날짜처럼 실행마다 달라지는 값은 `page.clock`으로 고정하거나 `mask`로 가린다.
- 글꼴 로딩을 기다린다: `await page.evaluate(() => document.fonts.ready)`.
- 비교는 `await expect(page).toHaveScreenshot(['<feature>', '<frame>.png'])`로 한다. 허용치는 `playwright.visual.config.ts` 값을 쓰고 테스트에서 바꾸지 않는다.

## 선택자 계약 — `harness/artifacts/publishing/<feature>.selector-contract.md`

- 역할·라벨·문구로 찾을 수 없는 영역(행, 카드, 목록 등)에만 testid를 쓴다. 이름은 `<feature>-<Figma 레이어 이름 슬러그>`.
- 쓴 testid마다 붙일 요소(Figma 노드 이름·id)를 표로 적는다. 구현 담당은 이 표를 보고 testid를 붙인다.
- testid가 없으면 파일을 만들지 않는다.

## 출력 후

- `node scripts/approve.mjs <feature> --freeze`로 e2eHash·visualHash를 동결한다.
- 구현이 아직 없으므로 지금 실행하면 실패하는 것이 정상이다. 통과시키려고 테스트를 느슨하게 바꾸지 않는다.

## 금지

- 구현 코드(`src/**`)를 만들거나 고치지 않는다.
- 기준 이미지, 승인 시나리오, 승인 기록을 고치지 않는다.
