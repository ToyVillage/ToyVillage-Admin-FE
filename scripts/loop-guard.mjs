#!/usr/bin/env node
// loop-guard.mjs — 반복/무진전 가드레일. loop-state.json 영속.
// no-progress.md 구현: STOP if iteration>=3 OR errorHash 2연속 OR diffHash 2연속(에러 지속).
// 평가 순서: streak(정체) 먼저, 그다음 N=3 상한. 사유는 정체 우선.
//
// 사용:
//   node scripts/loop-guard.mjs record <feature|scope:feature> --error <hash> [--diff <hash>]
//   node scripts/loop-guard.mjs reset <feature|scope:feature>
//   node scripts/loop-guard.mjs status <feature|scope:feature>
// scope가 없으면 기존 명령 호환을 위해 publishing:<feature>로 저장한다.
// exit 0 = CONTINUE, 2 = STOP.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const artifactsDir = join(root, 'harness', 'artifacts')
const statePath = join(artifactsDir, 'loop-state.json')
const N = 3

const [cmd, featureArg] = process.argv.slice(2)
if (!cmd || !featureArg) {
  console.error(
    'usage: loop-guard.mjs <record|reset|status> <feature|scope:feature> [--error h] [--diff h]',
  )
  process.exit(1)
}
const scopeKey = featureArg.includes(':')
  ? featureArg
  : `publishing:${featureArg}`
const feature = scopeKey.slice(scopeKey.indexOf(':') + 1)
function arg(name) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}

if (!existsSync(artifactsDir)) mkdirSync(artifactsDir, { recursive: true })
let state = existsSync(statePath)
  ? JSON.parse(readFileSync(statePath, 'utf8'))
  : {}

// feature 키가 다르면 자동 리셋되도록 feature별로 저장
function fresh() {
  return {
    scope: scopeKey,
    feature,
    iteration: 0,
    lastErrorHash: null,
    lastDiffHash: null,
    errorHashStreak: 0,
    diffHashStreak: 0,
  }
}
function save() {
  writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n')
}

if (cmd === 'reset') {
  state[scopeKey] = fresh()
  save()
  console.log(JSON.stringify({ decision: 'RESET', scope: scopeKey, feature }))
  process.exit(0)
}
if (cmd === 'status') {
  console.log(JSON.stringify(state[scopeKey] ?? fresh()))
  process.exit(0)
}
if (cmd === 'record') {
  const errorHash = arg('--error') ?? null
  const diffHash = arg('--diff') ?? null
  const s = state[scopeKey] ?? fresh()

  s.iteration += 1
  // streak 갱신 (직전과 같으면 +1, 다르면 1로 리셋)
  s.errorHashStreak =
    errorHash && errorHash === s.lastErrorHash ? s.errorHashStreak + 1 : 1
  s.diffHashStreak =
    diffHash && diffHash === s.lastDiffHash ? s.diffHashStreak + 1 : 1
  s.lastErrorHash = errorHash
  s.lastDiffHash = diffHash
  state[scopeKey] = s
  save()

  // 평가: 정체 먼저(사유 우선), 그다음 상한
  let decision = 'CONTINUE'
  let reason = null
  if (errorHash && s.errorHashStreak >= 2) {
    decision = 'STOP'
    reason = 'no-progress: 같은 에러 2회 연속'
  } else if (diffHash && s.diffHashStreak >= 2 && errorHash) {
    decision = 'STOP'
    reason = 'no-progress: 수정 diff 2회 연속(에러 지속)'
  } else if (s.iteration >= N) {
    decision = 'STOP'
    reason = `max-iterations: ${N}회 도달`
  }

  console.log(
    JSON.stringify({
      decision,
      reason,
      scope: scopeKey,
      feature,
      iteration: s.iteration,
      errorHashStreak: s.errorHashStreak,
      diffHashStreak: s.diffHashStreak,
    }),
  )
  process.exit(decision === 'STOP' ? 2 : 0)
}

console.error(`unknown command: ${cmd}`)
process.exit(1)
