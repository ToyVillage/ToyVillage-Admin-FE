#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import {
  describeApprovalChanges,
  formatApprovalChanges,
} from './api-approval-changes.mjs'
import {
  apiPaths,
  copyRequired,
  parseOption,
  parseTaskSpec,
  readApprovers,
  readGitUserName,
  readHeadCommit,
  readJson,
  repositoryRoot,
  sha256File,
  usesPageRouteMock,
  validateApiContract,
  validateRealServerConfig,
  writeJson,
} from './api-harness-lib.mjs'
import {
  checkContracts,
  defaultSwaggerBaseUrl,
  fetchApiDocs,
  formatReport,
  loadDotEnv,
  readContract,
  readKnownDiffs,
} from './check-api-swagger.mjs'
import {
  validateRealFixtureSource,
  validateRealTestSource,
} from './validate-real-api-source.mjs'

// 이 환경 변수가 있으면 AI 세션 안에서 실행된 것으로 보고 승인을 거부한다.
const aiSessionEnvNames = ['CLAUDECODE']

// 승인은 개발자가 자기 터미널에서 직접 한다. 승인자는 git 사용자 이름이고 승인자 목록에 있어야 한다.
export function resolveApprover({
  root,
  env = process.env,
  gitUserName = readGitUserName(root),
}) {
  const aiSession = aiSessionEnvNames.find((name) => env[name])
  if (aiSession) {
    throw new Error(
      `AI 세션(${aiSession})에서는 승인할 수 없음 — 개발자가 직접 터미널에서 실행`,
    )
  }
  if (!gitUserName) {
    throw new Error('git user.name 없음 — git config user.name 설정 필요')
  }
  if (!readApprovers(root).includes(gitUserName)) {
    throw new Error(
      `승인자 목록(harness/api/approvers.json)에 없는 git 사용자: ${gitUserName}`,
    )
  }
  return gitUserName
}

// 재승인해도 테스트 동결 기록은 유지한다. 테스트가 바뀌었으면 게이트가 해시 불일치로 다시 --freeze 를 요구한다.
const frozenKeys = [
  'testApprovedAt',
  'testApprovedBy',
  'testApprovedCommit',
  'realTestApprovedAt',
  'realTestApprovedBy',
  'realTestApprovedCommit',
]

export function approveApi({
  root,
  feature,
  freeze = false,
  freezeReal = false,
  env,
  gitUserName,
}) {
  const paths = apiPaths(root, feature)
  if (freeze && freezeReal) {
    throw new Error('--freeze와 --freeze-real은 동시에 사용할 수 없음')
  }
  const approvedBy = resolveApprover({ root, env, gitUserName })
  const approvedCommit = readHeadCommit(root)
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
      approval.realTestApprovedBy = approvedBy
      approval.realTestApprovedCommit = approvedCommit
      writeJson(paths.approval, approval)
      return approval
    }

    if (!existsSync(paths.test))
      throw new Error(`API e2e 테스트 없음: ${paths.test}`)
    if (!usesPageRouteMock(paths.test)) {
      throw new Error('API e2e 테스트는 page.route() 기반 mock을 사용해야 함')
    }
    approval.testHash = sha256File(paths.test)
    approval.testApprovedAt = new Date().toISOString()
    approval.testApprovedBy = approvedBy
    approval.testApprovedCommit = approvedCommit
    writeJson(paths.approval, approval)
    return approval
  }

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
  const previous = existsSync(paths.approval) ? readJson(paths.approval) : {}
  // 실제 서버를 끄고 재승인하면 실제 서버 동결 기록은 지운다. 남기면 게이트가 꺼진 실제 서버 테스트를 요구해 막힌다.
  const keepReal = spec.realServer.enabled
  const keptKeys = keepReal
    ? frozenKeys
    : frozenKeys.filter((key) => !key.startsWith('realTest'))
  copyRequired(paths.contractMarkdown, paths.approvedContractMarkdown)
  copyRequired(paths.contractJson, paths.approvedContractJson)
  copyRequired(paths.plan, paths.approvedPlan)
  copyRequired(paths.scenarios, paths.approvedScenarios)

  const approval = {
    feature,
    apiId: contract.apiId,
    approvedAt: new Date().toISOString(),
    approvedBy,
    approvedCommit,
    taskSpecHash: sha256File(paths.spec),
    contractHash: sha256File(paths.approvedContractJson),
    contractMarkdownHash: sha256File(paths.approvedContractMarkdown),
    planHash: sha256File(paths.approvedPlan),
    scenarioHash: sha256File(paths.approvedScenarios),
    testHash: previous.testHash ?? null,
    realTestHash: keepReal ? (previous.realTestHash ?? null) : null,
    realFixtureHash: keepReal ? (previous.realFixtureHash ?? null) : null,
    ...Object.fromEntries(
      keptKeys
        .filter((key) => previous[key] != null)
        .map((key) => [key, previous[key]]),
    ),
  }
  writeJson(paths.approval, approval)
  return approval
}

// 계약 승인 전에 그 기능의 계약을 스테이징 Swagger 와 비교한다. 알려진 차이에 없는 차이가 있으면 승인하지 않는다.
// 계약은 승인으로만 바뀌므로 여기서 막으면 승인된 계약은 항상 Swagger 와 대조된 상태다(RUNBOOK ⑧).
async function checkSwagger({ root, feature, specPath }) {
  loadDotEnv(root)
  const apiDocs = specPath
    ? JSON.parse(readFileSync(resolve(specPath), 'utf8'))
    : await fetchApiDocs(process.env.SWAGGER_BASE_URL ?? defaultSwaggerBaseUrl)
  const result = checkContracts({
    contracts: [readContract(apiPaths(root, feature).contractJson)],
    apiDocs,
    knownDiffs: readKnownDiffs(root),
  })
  if (result.newDiffs.length > 0) {
    throw new Error(
      `Swagger 와 다른 항목이 있어 승인하지 않음 — 계약을 고치거나 어느 쪽이 맞는지 정해 swagger-known-diffs.json 에 사유와 함께 기록\n${formatReport(result)}`,
    )
  }
}

// 승인 기록이 있으면 승인 이후 바뀐 부분만 보여 주고 확인을 받는다.
async function confirmChanges({ root, feature, scope }) {
  const changes = describeApprovalChanges({ root, feature, scope })
  if (changes.length === 0) return
  console.log(formatApprovalChanges(changes))
  // 입력이 터미널이 아니면 질문에 답할 수 없어 Node 가 메시지 없이 종료된다.
  if (!process.stdin.isTTY) {
    throw new Error('변경 확인은 터미널에서만 가능 — 직접 터미널에서 실행')
  }
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  try {
    const answer = await prompt.question(
      '\n위 변경을 확인했으면 y 입력 (그 외 취소): ',
    )
    if (answer.trim().toLowerCase() !== 'y') throw new Error('승인 취소')
  } finally {
    prompt.close()
  }
}

async function main() {
  const args = process.argv.slice(2)
  const feature = args[0]
  if (!feature || feature.startsWith('--')) {
    console.error(
      'usage: approve-api.mjs <feature> [--freeze|--freeze-real] [--swagger-spec api-docs.json] [--root path]',
    )
    process.exit(2)
  }
  const root = resolve(parseOption(args, '--root') ?? repositoryRoot)
  const freeze = args.includes('--freeze')
  const freezeReal = args.includes('--freeze-real')
  const freezing = freeze || freezeReal
  try {
    if (args.includes('--by')) {
      throw new Error('--by는 없어짐 — 승인자는 git user.name으로 기록됨')
    }
    const approver = resolveApprover({ root })
    await confirmChanges({
      root,
      feature,
      scope: freezeReal ? 'freeze-real' : freeze ? 'freeze' : 'approve',
    })
    if (!freezing) {
      await checkSwagger({
        root,
        feature,
        specPath: parseOption(args, '--swagger-spec'),
      })
    }
    const approval = approveApi({ root, feature, freeze, freezeReal })
    const action = freezeReal
      ? 'real test frozen'
      : freeze
        ? 'mock test frozen'
        : 'approved'
    console.log(`[api-approve] ${action}: ${approval.apiId} (${approver})`)
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
