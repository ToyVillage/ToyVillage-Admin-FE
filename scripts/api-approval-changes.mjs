#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  apiPaths,
  parseOption,
  readJson,
  repositoryRoot,
  runGit,
  sha256,
  sha256File,
} from './api-harness-lib.mjs'

// 승인 해시와 같은 내용을 가진 커밋을 찾는다. 승인 시점 커밋을 먼저 보고, 없으면 승인 기록을 커밋한 이력을 거슬러 본다.
// 승인 시점에 커밋되지 않은 파일도 있어서 커밋 해시만 믿지 않고 내용 해시로 확인한다.
function findApprovedCommit(root, path, hash, commits) {
  for (const commit of commits) {
    const contents = runGit(root, ['show', `${commit}:${path}`], {
      encoding: 'buffer',
    })
    if (contents && sha256(contents) === hash) return commit
  }
  return null
}

function gitDiff(root, args) {
  return runGit(root, ['diff', '--no-color', ...args], { okStatuses: [0, 1] })
}

export function describeApprovalChanges({ root, feature, scope = 'all' }) {
  const paths = apiPaths(root, feature)
  if (!existsSync(paths.approval)) return []
  const approval = readJson(paths.approval)
  const rel = (path) => relative(root, path)
  const history =
    runGit(root, ['log', '--format=%H', '-n', '20', '--', rel(paths.approval)])
      ?.split('\n')
      .filter(Boolean) ?? []
  const changes = []

  const recorded = (path, hash, label, commit) => {
    if (!hash) return
    if (existsSync(path) && sha256File(path) === hash) return
    const commits = [...new Set([commit, approval.approvedCommit, ...history])]
    const base = findApprovedCommit(
      root,
      rel(path),
      hash,
      commits.filter(Boolean),
    )
    changes.push(
      base
        ? {
            label,
            path: rel(path),
            base,
            diff: gitDiff(root, [base, '--', rel(path)]) ?? '',
          }
        : {
            label,
            path: rel(path),
            base: null,
            diff: null,
          },
    )
  }

  if (scope === 'all' || scope === 'approve') {
    recorded(paths.spec, approval.taskSpecHash, 'task spec')
    recorded(paths.approvedContractJson, approval.contractHash, 'contract JSON')
    recorded(
      paths.approvedContractMarkdown,
      approval.contractMarkdownHash,
      'contract Markdown',
    )
    recorded(paths.approvedPlan, approval.planHash, 'implementation plan')
    recorded(paths.approvedScenarios, approval.scenarioHash, 'test scenarios')

    // runtime 산출물은 Git 비추적이라 승인본 파일과 직접 비교한다.
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
        existsSync(approvedPath) &&
        sha256File(runtimePath) !== sha256File(approvedPath)
      ) {
        changes.push({
          label,
          path: rel(runtimePath),
          base: rel(approvedPath),
          diff:
            gitDiff(root, ['--no-index', '--', approvedPath, runtimePath]) ??
            '',
        })
      }
    }
  }

  if (scope === 'all' || scope === 'freeze') {
    recorded(
      paths.test,
      approval.testHash,
      'API e2e test',
      approval.testApprovedCommit,
    )
  }

  if (scope === 'all' || scope === 'freeze-real') {
    recorded(
      paths.realTest,
      approval.realTestHash,
      'real API e2e test',
      approval.realTestApprovedCommit,
    )
    recorded(
      paths.realFixture,
      approval.realFixtureHash,
      'real API e2e fixture',
      approval.realTestApprovedCommit,
    )
  }

  return changes
}

export function formatApprovalChanges(changes) {
  return changes
    .map(({ label, path, base, diff }) => {
      if (diff === null) {
        return `## ${label}: ${path}\n승인 당시 내용을 git 기록에서 찾지 못함 — 파일 전체를 다시 확인`
      }
      return `## ${label}: ${path} (기준: ${base})\n${diff.trimEnd()}`
    })
    .join('\n\n')
}

function main() {
  const args = process.argv.slice(2)
  const feature = args[0]
  if (!feature || feature.startsWith('--')) {
    console.error('usage: api-approval-changes.mjs <feature> [--root path]')
    process.exit(2)
  }
  const root = resolve(parseOption(args, '--root') ?? repositoryRoot)
  if (!existsSync(apiPaths(root, feature).approval)) {
    console.error(`[api-changes] 승인 기록 없음: ${feature}`)
    process.exit(1)
  }
  const changes = describeApprovalChanges({ root, feature })
  if (changes.length === 0) {
    console.log(`[api-changes] 승인 이후 바뀐 파일 없음: ${feature}`)
    return
  }
  console.log(formatApprovalChanges(changes))
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  main()
