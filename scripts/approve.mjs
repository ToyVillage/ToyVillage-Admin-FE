#!/usr/bin/env node
// approve.mjs — 승인 기록 작성 헬퍼(해시 자동 계산). 손으로 JSON/해시 쓰지 않게.
// durable 경로 harness/publishing/approvals/ 에 sentinel 을 만든다.
//
// 승인:  node scripts/approve.mjs <feature> --by <name> --scenarios S1,S2
//        (harness/publishing/approvals/<feature>.scenario-draft.md 의 scenarioHash 계산)
// freeze: node scripts/approve.mjs <feature> --freeze
//        (tests/e2e/<feature>.spec.ts 의 e2eHash 를 sentinel 에 stamp)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const feature = process.argv[2]
if (!feature || feature.startsWith('--')) {
  console.error(
    'usage: approve.mjs <feature> [--by <name> --scenarios S1,S2 | --freeze]',
  )
  process.exit(1)
}
function arg(name) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const has = (name) => process.argv.includes(name)
function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

const approvalsDir = join(root, 'harness', 'publishing', 'approvals')
if (!existsSync(approvalsDir)) mkdirSync(approvalsDir, { recursive: true })
const sentinelPath = join(approvalsDir, `${feature}.approved.json`)

// requires_functional_test
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

if (has('--freeze')) {
  if (!existsSync(sentinelPath)) {
    console.error('[approve] sentinel 없음 — 먼저 승인하세요')
    process.exit(1)
  }
  const data = JSON.parse(readFileSync(sentinelPath, 'utf8'))
  const e2ePath = join(root, 'tests', 'e2e', `${feature}.spec.ts`)
  if (!existsSync(e2ePath)) {
    console.error(`[approve] e2e 파일 없음: tests/e2e/${feature}.spec.ts`)
    process.exit(1)
  }
  data.e2eHash = sha256(e2ePath)
  writeFileSync(sentinelPath, JSON.stringify(data, null, 2) + '\n')
  console.log(
    JSON.stringify({
      feature,
      frozen: true,
      e2eHash: data.e2eHash.slice(0, 12),
    }),
  )
  process.exit(0)
}

// 승인
const approvedBy = arg('--by') ?? 'developer'
const scenarioIds = (arg('--scenarios') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const sentinel = {
  feature,
  approvedAt: new Date().toISOString(),
  approvedBy,
  scenarioIds,
  scenarioHash: null,
  e2eHash: null,
}

if (requiresFunctional) {
  if (scenarioIds.length === 0) {
    console.error('[approve] requires_functional_test=true → --scenarios 필요')
    process.exit(1)
  }
  const draftPath = join(approvalsDir, `${feature}.scenario-draft.md`)
  if (!existsSync(draftPath)) {
    console.error(
      `[approve] 승인 시나리오 파일 없음: harness/publishing/approvals/${feature}.scenario-draft.md`,
    )
    process.exit(1)
  }
  sentinel.scenarioHash = sha256(draftPath)
}

writeFileSync(sentinelPath, JSON.stringify(sentinel, null, 2) + '\n')
console.log(
  JSON.stringify({ feature, approved: true, scenarioIds, requiresFunctional }),
)
