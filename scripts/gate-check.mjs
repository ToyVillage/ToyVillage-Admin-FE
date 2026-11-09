#!/usr/bin/env node
// gate-check.mjs — 승인 게이트 집행. 승인 기록은 harness/publishing/approvals/에서 읽는다.
// RUNBOOK "Sentinel 유효성 계약" + 내용 해시(#4) 구현.
// exit 0=valid, 2=usage, 3=missing, 4=invalid.
//
// 사용: node scripts/gate-check.mjs <feature> [--stage implement]
//   --stage implement: ④ 구현 진입 전. ③에서 작성한 테스트가 동결돼 있어야 통과한다.
//
// sentinel: harness/publishing/approvals/<feature>.approved.json
//   { feature, approvedAt, approvedBy, scenarioIds,
//     scenarioHash,   // harness/publishing/approvals/<feature>.scenario-draft.md 의 sha256
//     baselineHash,   // harness/publishing/baselines/<feature>/*.png 묶음 해시 (기준 이미지가 있을 때)
//     e2eHash,        // tests/e2e/<feature>.spec.ts 의 sha256 (freeze 후)
//     visualHash }    // tests/visual/<feature>.visual.ts 의 sha256 (freeze 후, 기준 이미지가 있을 때)

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  root,
  sha256,
  baselineHash,
  visualSpecPath,
} from './publishing-lib.mjs'

const feature = process.argv[2]
if (!feature || feature.startsWith('--')) {
  console.error(
    'usage: node scripts/gate-check.mjs <feature> [--stage implement]',
  )
  process.exit(2)
}
const stageIndex = process.argv.indexOf('--stage')
const stage = stageIndex >= 0 ? process.argv[stageIndex + 1] : undefined
if (stageIndex >= 0 && stage !== 'implement') {
  console.error('[gate-check] --stage 는 implement 만 지원한다')
  process.exit(2)
}

function fail(code, reason) {
  console.log(JSON.stringify({ feature, valid: false, reason }))
  process.exit(code)
}

// requires_functional_test 읽기 (spec frontmatter)
const specPath = join(
  root,
  'harness',
  'publishing',
  'specs',
  `${feature}.spec.md`,
)
let requiresFunctional = true
if (existsSync(specPath)) {
  const m = readFileSync(specPath, 'utf8').match(
    /requires_functional_test:\s*(true|false)/,
  )
  if (m) requiresFunctional = m[1] === 'true'
}

const approvalsDir = join(root, 'harness', 'publishing', 'approvals')
const sentinelPath = join(approvalsDir, `${feature}.approved.json`)
if (!existsSync(sentinelPath))
  fail(
    3,
    `승인 기록 없음: harness/publishing/approvals/${feature}.approved.json — 개발자 승인 필요`,
  )

let data
try {
  data = JSON.parse(readFileSync(sentinelPath, 'utf8'))
} catch {
  fail(4, 'sentinel JSON 파싱 실패')
}

for (const k of ['feature', 'approvedAt', 'approvedBy', 'scenarioIds']) {
  if (!(k in data)) fail(4, `필수 필드 누락: ${k}`)
}
if (data.feature !== feature)
  fail(4, `feature 불일치: ${data.feature} != ${feature}`)
if (!Array.isArray(data.scenarioIds)) fail(4, 'scenarioIds 는 배열이어야 함')

if (requiresFunctional) {
  if (data.scenarioIds.length === 0)
    fail(4, 'requires_functional_test=true 인데 scenarioIds 가 비어있음')
  // 시나리오 내용 해시 검증 (#4)
  const draftPath = join(approvalsDir, `${feature}.scenario-draft.md`)
  if (!data.scenarioHash)
    fail(4, 'scenarioHash 누락(승인 시 시나리오 해시 필요)')
  if (!existsSync(draftPath))
    fail(
      4,
      `승인 시나리오 파일 없음: harness/publishing/approvals/${feature}.scenario-draft.md`,
    )
  if (sha256(draftPath) !== data.scenarioHash)
    fail(
      4,
      '시나리오 내용이 승인 이후 변경됨(scenarioHash 불일치) — 재승인 필요',
    )
  // e2e 해시 검증 (freeze 이후에만)
  if (data.e2eHash) {
    const e2ePath = join(root, 'tests', 'e2e', `${feature}.spec.ts`)
    if (!existsSync(e2ePath))
      fail(4, `e2e 파일 없음: tests/e2e/${feature}.spec.ts`)
    if (sha256(e2ePath) !== data.e2eHash)
      fail(
        4,
        'e2e 테스트가 freeze 이후 변경됨(e2eHash 불일치) — 재승인/재freeze 필요',
      )
  }
}

// 기준 이미지 해시 검증 (승인 때 기준 이미지가 있었을 때만)
const currentBaselineHash = baselineHash(feature)
if (data.baselineHash && currentBaselineHash !== data.baselineHash)
  fail(
    4,
    'Figma 기준 이미지가 승인 이후 변경됨(baselineHash 불일치) — 재승인 필요',
  )
if (currentBaselineHash && !data.baselineHash)
  fail(
    4,
    'Figma 기준 이미지가 승인 기록에 없음 — 기준 이미지 포함해 재승인 필요',
  )

// 스크린샷 비교 테스트 해시 검증 (freeze 이후에만)
if (data.visualHash) {
  const visualPath = visualSpecPath(feature)
  if (!existsSync(visualPath))
    fail(4, `스크린샷 테스트 파일 없음: tests/visual/${feature}.visual.ts`)
  if (sha256(visualPath) !== data.visualHash)
    fail(
      4,
      '스크린샷 테스트가 freeze 이후 변경됨(visualHash 불일치) — 재승인/재freeze 필요',
    )
}

// ④ 구현 진입: ③에서 작성한 테스트가 동결돼 있어야 한다
if (stage === 'implement') {
  if (requiresFunctional && !data.e2eHash)
    fail(
      4,
      'e2e 테스트가 아직 동결되지 않음 — ③ 테스트 작성 후 approve --freeze 필요',
    )
  if (currentBaselineHash && !data.visualHash)
    fail(
      4,
      '스크린샷 테스트가 아직 동결되지 않음 — ③ 테스트 작성 후 approve --freeze 필요',
    )
}

console.log(
  JSON.stringify({
    feature,
    valid: true,
    stage: stage ?? null,
    requiresFunctional,
    scenarioIds: data.scenarioIds,
    e2eFrozen: Boolean(data.e2eHash),
    visualFrozen: Boolean(data.visualHash),
  }),
)
process.exit(0)
