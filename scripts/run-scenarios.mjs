#!/usr/bin/env node
// run-scenarios.mjs — 기능 테스트 러너(= verify:e2e). 게이트 먼저, 그다음 Playwright.
// 사용: node scripts/run-scenarios.mjs <feature>
// exit: 0=pass, 3/4=gate 실패, 1=테스트 실패.
//
// ⑥ 검증: 동결된 e2e(tests/e2e/<feature>.spec.ts)와,
// Figma 기준 이미지가 있으면 스크린샷 비교(tests/visual/<feature>.visual.ts)를 차례로 실행한다.

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { root, baselineFiles } from './publishing-lib.mjs'

const feature = process.argv[2]
if (!feature) {
  console.error('usage: node scripts/run-scenarios.mjs <feature>')
  process.exit(1)
}

// 1) 게이트 먼저 — 테스트가 ③에서 동결돼 있어야 한다
const gate = spawnSync(
  'node',
  [join(root, 'scripts', 'gate-check.mjs'), feature, '--stage', 'implement'],
  { encoding: 'utf8' },
)
process.stdout.write(gate.stdout ?? '')
if (gate.status !== 0) {
  console.error('[run-scenarios] 게이트 미통과 → 기능 테스트 차단')
  process.exit(gate.status)
}

let failed = false

// 2) 기능 e2e (해당 feature 스펙만)
const e2eSpec = `tests/e2e/${feature}.spec.ts`
if (existsSync(join(root, e2eSpec))) {
  const pw = spawnSync('yarn', ['playwright', 'test', e2eSpec], {
    encoding: 'utf8',
    stdio: 'inherit',
  })
  if (pw.status !== 0) failed = true
}

// 3) Figma 스크린샷 비교 (기준 이미지가 있을 때만)
if (baselineFiles(feature).length > 0) {
  const visual = spawnSync(
    'yarn',
    [
      'playwright',
      'test',
      '-c',
      'playwright.visual.config.ts',
      `tests/visual/${feature}.visual.ts`,
    ],
    { encoding: 'utf8', stdio: 'inherit' },
  )
  if (visual.status !== 0) failed = true
}

process.exit(failed ? 1 : 0)
