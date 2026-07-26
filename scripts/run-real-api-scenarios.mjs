#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { apiPaths, parseTaskSpec, repositoryRoot } from './api-harness-lib.mjs'
import { checkApiGate } from './api-gate-check.mjs'

export function validateRealTestSource(source) {
  const errors = []
  if (!/from\s+['"]\.\/real-api-fixture['"]/.test(source)) {
    errors.push('실제 서버 테스트는 real-api-fixture를 사용해야 함')
  }
  if (/\b(?:page|context)\.route\s*\(/.test(source)) {
    errors.push('실제 서버 테스트에서 page/context route mock 사용 금지')
  }
  if (/\broute\.fulfill\s*\(/.test(source)) {
    errors.push('실제 서버 테스트에서 mock 응답 사용 금지')
  }
  return errors
}

export function validateRealRun({ root, feature, confirmed }) {
  const errors = checkApiGate({
    root,
    feature,
    requireRealTest: true,
  })
  if (!confirmed) {
    errors.push('--confirm-staging 명시적 실행 확인 필요')
  }

  const paths = apiPaths(root, feature)
  if (existsSync(paths.realTest)) {
    errors.push(...validateRealTestSource(readFileSync(paths.realTest, 'utf8')))
  }
  return errors
}

function main() {
  const args = process.argv.slice(2)
  const feature = args[0]
  if (!feature || feature.startsWith('--')) {
    console.error(
      'usage: run-real-api-scenarios.mjs <feature> --confirm-staging',
    )
    process.exit(2)
  }

  const errors = validateRealRun({
    root: repositoryRoot,
    feature,
    confirmed: args.includes('--confirm-staging'),
  })
  if (errors.length > 0) {
    console.error(`[api-real-scenarios] gate failed\n- ${errors.join('\n- ')}`)
    process.exit(1)
  }

  const spec = parseTaskSpec(apiPaths(repositoryRoot, feature).spec)
  const yarn = process.platform === 'win32' ? 'yarn.cmd' : 'yarn'
  const result = spawnSync(
    yarn,
    [
      'playwright',
      'test',
      resolve(apiPaths(repositoryRoot, feature).realTest),
      '--config',
      'playwright.real-api.config.ts',
    ],
    {
      cwd: repositoryRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        API_E2E_ALLOWED_METHODS: spec.realServer.allowedMethods.join(','),
        API_E2E_REAL_SERVER: 'true',
        VITE_API_BASE_URL: spec.realServer.baseUrl,
      },
    },
  )
  process.exit(result.status ?? 1)
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main()
}
