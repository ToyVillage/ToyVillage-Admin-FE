#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { apiPaths, repositoryRoot } from './api-harness-lib.mjs'
import { checkApiGate } from './api-gate-check.mjs'

const feature = process.argv[2]
if (!feature || feature.startsWith('--')) {
  console.error('usage: run-api-scenarios.mjs <feature>')
  process.exit(2)
}

const errors = checkApiGate({
  root: repositoryRoot,
  feature,
  requireTest: true,
})
if (errors.length > 0) {
  console.error(`[api-scenarios] gate failed\n- ${errors.join('\n- ')}`)
  process.exit(1)
}

const testPath = apiPaths(repositoryRoot, feature).test
if (!existsSync(testPath)) {
  console.error(`[api-scenarios] test 없음: ${testPath}`)
  process.exit(1)
}
if (!readFileSync(testPath, 'utf8').includes('page.route(')) {
  console.error(
    '[api-scenarios] page.route() 기반 mock이 없는 테스트는 실행하지 않음',
  )
  process.exit(1)
}

const yarn = process.platform === 'win32' ? 'yarn.cmd' : 'yarn'
const result = spawnSync(yarn, ['playwright', 'test', resolve(testPath)], {
  cwd: repositoryRoot,
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
