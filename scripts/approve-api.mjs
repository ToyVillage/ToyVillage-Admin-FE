#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  apiPaths,
  copyRequired,
  parseOption,
  parseTaskSpec,
  readJson,
  repositoryRoot,
  sha256File,
  validateApiContract,
  validateRealServerConfig,
  writeJson,
} from './api-harness-lib.mjs'
import {
  validateRealFixtureSource,
  validateRealTestSource,
} from './validate-real-api-source.mjs'

export function approveApi({
  root,
  feature,
  approvedBy,
  freeze = false,
  freezeReal = false,
}) {
  const paths = apiPaths(root, feature)
  if (freeze && freezeReal) {
    throw new Error('--freeze와 --freeze-real은 동시에 사용할 수 없음')
  }
  if (freeze || freezeReal) {
    if (!existsSync(paths.approval)) throw new Error('기존 API 승인 JSON 없음')
    const approval = readJson(paths.approval)
    if (sha256File(paths.spec) !== approval.taskSpecHash) {
      throw new Error('task spec이 승인 이후 변경됨: 재승인 필요')
    }

    if (freezeReal) {
      const spec = parseTaskSpec(paths.spec)
      const contract = readJson(paths.approvedContractJson)
      const configErrors = validateRealServerConfig(spec, contract)
      if (!spec.realServer.enabled) {
        configErrors.push('real_server.enabled=true 승인 필요')
      }
      if (configErrors.length > 0) {
        throw new Error(
          `실제 서버 설정 invalid:\n- ${configErrors.join('\n- ')}`,
        )
      }
      if (!existsSync(paths.realTest)) {
        throw new Error(`실제 서버 e2e 테스트 없음: ${paths.realTest}`)
      }
      if (!existsSync(paths.realFixture)) {
        throw new Error(`실제 서버 e2e fixture 없음: ${paths.realFixture}`)
      }
      const testSource = readFileSync(paths.realTest, 'utf8')
      const testErrors = validateRealTestSource(testSource)
      if (testErrors.length > 0) {
        throw new Error(
          `실제 서버 e2e 테스트 invalid:\n- ${testErrors.join('\n- ')}`,
        )
      }
      const fixtureErrors = validateRealFixtureSource(
        readFileSync(paths.realFixture, 'utf8'),
      )
      if (fixtureErrors.length > 0) {
        throw new Error(
          `실제 서버 e2e fixture guard invalid:\n- ${fixtureErrors.join('\n- ')}`,
        )
      }
      approval.realTestHash = sha256File(paths.realTest)
      approval.realFixtureHash = sha256File(paths.realFixture)
      approval.realTestApprovedAt = new Date().toISOString()
      writeJson(paths.approval, approval)
      return approval
    }

    if (!existsSync(paths.test))
      throw new Error(`API e2e 테스트 없음: ${paths.test}`)
    const testSource = readFileSync(paths.test, 'utf8')
    if (!testSource.includes('page.route(')) {
      throw new Error('API e2e 테스트는 page.route() 기반 mock을 사용해야 함')
    }
    approval.testHash = sha256File(paths.test)
    approval.testApprovedAt = new Date().toISOString()
    writeJson(paths.approval, approval)
    return approval
  }

  if (!approvedBy) throw new Error('--by <developer> 필요')
  const spec = parseTaskSpec(paths.spec)
  if (spec.feature !== feature)
    throw new Error('task spec feature와 CLI feature 불일치')
  if (!spec.apiId) throw new Error('task spec api_id 누락')

  const contract = readJson(paths.contractJson)
  const errors = validateApiContract(contract)
  if (errors.length > 0)
    throw new Error(`Contract invalid:\n- ${errors.join('\n- ')}`)
  if (contract.apiId !== spec.apiId)
    throw new Error('task spec와 Contract API ID 불일치')
  const realServerErrors = validateRealServerConfig(spec, contract)
  if (realServerErrors.length > 0) {
    throw new Error(
      `실제 서버 설정 invalid:\n- ${realServerErrors.join('\n- ')}`,
    )
  }

  for (const path of [
    paths.contractMarkdown,
    paths.contractJson,
    paths.plan,
    paths.scenarios,
  ]) {
    if (!existsSync(path)) throw new Error(`필수 파일 없음: ${path}`)
  }
  copyRequired(paths.contractMarkdown, paths.approvedContractMarkdown)
  copyRequired(paths.contractJson, paths.approvedContractJson)
  copyRequired(paths.plan, paths.approvedPlan)
  copyRequired(paths.scenarios, paths.approvedScenarios)

  const approval = {
    feature,
    apiId: contract.apiId,
    approvedAt: new Date().toISOString(),
    approvedBy,
    taskSpecHash: sha256File(paths.spec),
    contractHash: sha256File(paths.approvedContractJson),
    contractMarkdownHash: sha256File(paths.approvedContractMarkdown),
    planHash: sha256File(paths.approvedPlan),
    scenarioHash: sha256File(paths.approvedScenarios),
    testHash: null,
    realTestHash: null,
    realFixtureHash: null,
  }
  writeJson(paths.approval, approval)
  return approval
}

function main() {
  const args = process.argv.slice(2)
  const feature = args[0]
  if (!feature || feature.startsWith('--')) {
    console.error(
      'usage: approve-api.mjs <feature> --by <developer> [--freeze|--freeze-real] [--root path]',
    )
    process.exit(2)
  }
  const root = resolve(parseOption(args, '--root') ?? repositoryRoot)
  try {
    const approval = approveApi({
      root,
      feature,
      approvedBy: parseOption(args, '--by'),
      freeze: args.includes('--freeze'),
      freezeReal: args.includes('--freeze-real'),
    })
    const action = args.includes('--freeze-real')
      ? 'real test frozen'
      : args.includes('--freeze')
        ? 'mock test frozen'
        : 'approved'
    console.log(`[api-approve] ${action}: ${approval.apiId}`)
  } catch (error) {
    console.error(`[api-approve] ${error.message}`)
    process.exit(1)
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  main()
