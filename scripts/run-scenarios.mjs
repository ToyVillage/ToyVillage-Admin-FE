#!/usr/bin/env node
// run-scenarios.mjs — 기능 테스트 러너(= verify:e2e). 게이트 먼저, 그다음 Playwright.
// 사용: node scripts/run-scenarios.mjs <feature>
// exit: 0=pass, 3/4=gate 실패, 1=테스트 실패.

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const feature = process.argv[2]
if (!feature) {
  console.error('usage: node scripts/run-scenarios.mjs <feature>')
  process.exit(1)
}

// 1) 게이트 먼저
const gate = spawnSync('node', [join(root, 'scripts', 'gate-check.mjs'), feature], {
  encoding: 'utf8',
})
process.stdout.write(gate.stdout ?? '')
if (gate.status !== 0) {
  console.error('[run-scenarios] 게이트 미통과 → 기능 테스트 차단')
  process.exit(gate.status)
}

// 2) Playwright 실행 (해당 feature 스펙만)
const pw = spawnSync('yarn', ['playwright', 'test', `tests/e2e/${feature}.spec.ts`], {
  encoding: 'utf8',
  stdio: 'inherit',
})
process.exit(pw.status ?? 1)
