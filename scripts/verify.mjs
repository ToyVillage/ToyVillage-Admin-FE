#!/usr/bin/env node
// verify.mjs — 인너 루프 검증. `yarn verify`(lint && typecheck && style-policy && build) 래핑.
// Playwright는 포함하지 않는다(그건 run-scenarios.mjs = verify:e2e).
// 출력: JSON {pass, firstError, errorHash}. exit 0=pass, 1=fail.

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const res = spawnSync('yarn', ['verify'], { encoding: 'utf8', shell: false })
const out = (res.stdout ?? '') + (res.stderr ?? '')
const pass = res.status === 0

// 첫 에러 라인 추출(대략): error/Error 포함 첫 줄
let firstError = null
if (!pass) {
  const line = out
    .split('\n')
    .find((l) => /error|Error|✖|failed/i.test(l) && l.trim())
  firstError = (line ?? out.split('\n').filter(Boolean).slice(-1)[0] ?? '').trim()
}

// 에러 지문: 경로의 가변 부분/숫자 정규화 후 해시 (무진전 감지용)
const normalized = (firstError ?? '')
  .replace(/\d+/g, '#')
  .replace(/\s+/g, ' ')
  .trim()
const errorHash = pass
  ? null
  : createHash('sha256').update(normalized).digest('hex').slice(0, 12)

console.log(JSON.stringify({ pass, firstError, errorHash }))
process.exit(pass ? 0 : 1)
