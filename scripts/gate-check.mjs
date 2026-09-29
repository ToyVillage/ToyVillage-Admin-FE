#!/usr/bin/env node
// gate-check.mjs — 승인 게이트 집행. 승인 기록은 harness/publishing/approvals/에서 읽는다.
// RUNBOOK "Sentinel 유효성 계약" + 내용 해시(#4) 구현.
// exit 0=valid, 2=usage, 3=missing, 4=invalid.
//
// 사용: node scripts/gate-check.mjs <feature>
//
// sentinel: harness/publishing/approvals/<feature>.approved.json
//   { feature, approvedAt, approvedBy, scenarioIds,
//     scenarioHash,   // harness/publishing/approvals/<feature>.scenario-draft.md 의 sha256
//     e2eHash }        // tests/e2e/<feature>.spec.ts 의 sha256 (freeze 후, 선택)

import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const feature = process.argv[2]
if (!feature) {
  console.error('usage: node scripts/gate-check.mjs <feature>')
  process.exit(2)
}

function fail(code, reason) {
  console.log(JSON.stringify({ feature, valid: false, reason }))
  process.exit(code)
}
function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
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

console.log(
  JSON.stringify({
    feature,
    valid: true,
    requiresFunctional,
    scenarioIds: data.scenarioIds,
    e2eFrozen: Boolean(data.e2eHash),
  }),
)
process.exit(0)
