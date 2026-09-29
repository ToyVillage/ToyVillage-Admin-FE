#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  apiPaths,
  parseOption,
  parseTaskSpec,
  readJson,
  repositoryRoot,
  sha256File,
  validateApiContract,
  validateRealServerConfig,
} from './api-harness-lib.mjs'
import { validateRealFixtureSource } from './validate-real-api-source.mjs'

function compareHash(path, expected, label, errors) {
  if (!existsSync(path)) {
    errors.push(`${label} 파일 없음: ${path}`)
  } else if (sha256File(path) !== expected) {
    errors.push(`${label} 승인 해시 불일치`)
  }
}

export function checkApiGate({
  root,
  feature,
  requireTest = false,
  requireRealTest = false,
}) {
  const paths = apiPaths(root, feature)
  const errors = []
  if (!existsSync(paths.approval)) return [`승인 JSON 없음: ${paths.approval}`]

  let approval
  let spec
  let contract
  try {
    approval = readJson(paths.approval)
    spec = parseTaskSpec(paths.spec)
    contract = readJson(paths.approvedContractJson)
  } catch (error) {
    return [error.message]
  }

  if (approval.feature !== feature) errors.push('승인 feature 불일치')
  if (!approval.approvedBy || !approval.approvedAt)
    errors.push('승인자 또는 승인 시각 누락')
  if (spec.feature !== feature) errors.push('task spec feature 불일치')
  if (
    !spec.apiId ||
    approval.apiId !== spec.apiId ||
    contract.apiId !== spec.apiId
  ) {
    errors.push('API ID 불일치 또는 누락')
  }
  errors.push(...validateRealServerConfig(spec, contract))

  compareHash(paths.spec, approval.taskSpecHash, 'task spec', errors)
  compareHash(
    paths.approvedContractJson,
    approval.contractHash,
    'contract JSON',
    errors,
  )
  compareHash(
    paths.approvedContractMarkdown,
    approval.contractMarkdownHash,
    'contract Markdown',
    errors,
  )
  compareHash(
    paths.approvedPlan,
    approval.planHash,
    'implementation plan',
    errors,
  )
  compareHash(
    paths.approvedScenarios,
    approval.scenarioHash,
    'test scenarios',
    errors,
  )

  const contractErrors = validateApiContract(contract)
  errors.push(...contractErrors.map((error) => `승인 Contract: ${error}`))

  for (const [runtimePath, approvedPath, label] of [
    [paths.contractJson, paths.approvedContractJson, 'runtime contract JSON'],
    [
      paths.contractMarkdown,
      paths.approvedContractMarkdown,
      'runtime contract Markdown',
    ],
    [paths.plan, paths.approvedPlan, 'runtime implementation plan'],
    [paths.scenarios, paths.approvedScenarios, 'runtime test scenarios'],
  ]) {
    if (
      existsSync(runtimePath) &&
      sha256File(runtimePath) !== sha256File(approvedPath)
    ) {
      errors.push(`${label}이 승인본과 다름`)
    }
  }

  if (requireTest || approval.testHash) {
    if (!approval.testHash) {
      errors.push('testHash 누락: approve-api --freeze 필요')
    } else {
      compareHash(paths.test, approval.testHash, 'API e2e test', errors)
    }
  }

  if (requireRealTest || approval.realTestHash) {
    if (!spec.realServer.enabled) {
      errors.push('실제 서버 테스트가 활성화되지 않음')
    }
    if (!approval.realTestHash) {
      errors.push('realTestHash 누락: approve-api --freeze-real 필요')
    } else {
      compareHash(
        paths.realTest,
        approval.realTestHash,
        'real API e2e test',
        errors,
      )
    }
    if (!approval.realFixtureHash) {
      errors.push('realFixtureHash 누락: approve-api --freeze-real 필요')
    } else {
      compareHash(
        paths.realFixture,
        approval.realFixtureHash,
        'real API e2e fixture',
        errors,
      )
      if (existsSync(paths.realFixture)) {
        errors.push(
          ...validateRealFixtureSource(
            readFileSync(paths.realFixture, 'utf8'),
          ).map((error) => `real API e2e fixture guard: ${error}`),
        )
      }
    }
  }

  return errors
}

function main() {
  const args = process.argv.slice(2)
  const feature = args[0]
  if (!feature || feature.startsWith('--')) {
    console.error(
      'usage: api-gate-check.mjs <feature> [--require-test|--require-real-test] [--root path]',
    )
    process.exit(2)
  }
  const root = resolve(parseOption(args, '--root') ?? repositoryRoot)
  const errors = checkApiGate({
    root,
    feature,
    requireTest: args.includes('--require-test'),
    requireRealTest: args.includes('--require-real-test'),
  })
  if (errors.length > 0) {
    console.error(`[api-gate] invalid\n- ${errors.join('\n- ')}`)
    process.exit(1)
  }
  console.log(`[api-gate] valid: ${feature}`)
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  main()
