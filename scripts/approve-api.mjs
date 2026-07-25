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
  writeJson,
} from './api-harness-lib.mjs'

export function approveApi({ root, feature, approvedBy, freeze = false }) {
  const paths = apiPaths(root, feature)
  if (freeze) {
    if (!existsSync(paths.approval)) throw new Error('기존 API 승인 JSON 없음')
    if (!existsSync(paths.test))
      throw new Error(`API e2e 테스트 없음: ${paths.test}`)
    const testSource = readFileSync(paths.test, 'utf8')
    if (!testSource.includes('page.route(')) {
      throw new Error('API e2e 테스트는 page.route() 기반 mock을 사용해야 함')
    }
    const approval = readJson(paths.approval)
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
  if (spec.realServer.enabled || spec.realServer.allowedMethods.length > 0) {
    throw new Error('실제 서버 요청은 API 하네스 승인 범위가 아님')
  }

  const contract = readJson(paths.contractJson)
  const errors = validateApiContract(contract)
  if (errors.length > 0)
    throw new Error(`Contract invalid:\n- ${errors.join('\n- ')}`)
  if (contract.apiId !== spec.apiId)
    throw new Error('task spec와 Contract API ID 불일치')

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
  }
  writeJson(paths.approval, approval)
  return approval
}

function main() {
  const args = process.argv.slice(2)
  const feature = args[0]
  if (!feature || feature.startsWith('--')) {
    console.error(
      'usage: approve-api.mjs <feature> --by <developer> [--freeze] [--root path]',
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
    })
    console.log(
      `[api-approve] ${args.includes('--freeze') ? 'test frozen' : 'approved'}: ${approval.apiId}`,
    )
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
