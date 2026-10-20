#!/usr/bin/env node
// PR 의 커밋 메시지와 제목이 harness/shared/team-rules.md 2·3절 형식을 따르는지 본다.
// CI(.github/workflows/pr-format.yml)가 PR_TITLE·PR_BRANCH·COMMIT_RANGE 를 넘긴다.
// 로컬 commit-msg 훅(.githooks/commit-msg)은 --commit-msg <파일> 로 커밋 하나만 본다.
// 머지 커밋(develop 을 끌어온 커밋 포함)은 검사하지 않는다.

import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const commitTypes = [
  'feat',
  'fix',
  'test',
  'docs',
  'chore',
  'refactor',
  'style',
]

export function checkCommitMessage(message) {
  const lines = message.trimEnd().split('\n')
  const subject = lines[0]
  const problems = []
  if (lines.length > 1) {
    problems.push('본문·트레일러 없이 한 줄로 쓴다')
  }

  const match = /^([a-zA-Z]+)(\([^)]*\))?(!)?:(.*)$/.exec(subject)
  if (!match) {
    problems.push("'type: 내용' 형식으로 쓴다")
    return problems
  }
  const [, type, scope, bang, rest] = match
  if (!commitTypes.includes(type)) {
    problems.push(`type은 ${commitTypes.join('·')} 중 하나로 쓴다`)
  }
  if (scope || bang) {
    problems.push(`scope·!를 넣지 않는다(${type}${scope ?? ''}${bang ?? ''}:)`)
  }
  if (!/^ \S/.test(rest) || rest !== rest.trimEnd()) {
    problems.push("콜론 뒤에 공백 한 칸을 두고 내용을 쓴다('type: 내용')")
  }
  // 명사형인지는 기계로 판단할 수 없으니 '~한다'·'~해요' 같은 종결어미만 막는다.
  // '필요'·'중요'처럼 요로 끝나는 명사가 있어 요는 어미 앞 글자까지 본다.
  if (/(?:다|[해돼어아세네에예]요)\.?$/.test(rest.trim())) {
    problems.push(
      "내용은 '~한다' 같은 종결어미가 아니라 명사형(추가·제거·수정)으로 끝낸다",
    )
  }
  return problems
}

export function expectedPrTitle(branch) {
  return branch.replaceAll('-', ' ')
}

export function checkPrTitle(title, branch) {
  const expected = expectedPrTitle(branch)
  if (title === expected) return []
  return [
    `PR 제목은 브랜치 이름에서 하이픈만 공백으로 바꾼 '${expected}'로 쓴다`,
  ]
}

export function readCommits(range, cwd = process.cwd()) {
  const out = execFileSync(
    'git',
    ['log', '--no-merges', '--reverse', '--format=%H%x00%B%x1e', range, '--'],
    { cwd, encoding: 'utf8' },
  )
  return out
    .split('\x1e')
    .map((entry) => entry.trimStart())
    .filter(Boolean)
    .map((entry) => {
      const [sha, message] = entry.split('\0')
      return { sha, message }
    })
}

// commit-msg 훅은 git 이 메시지를 정리하기 전에 불리므로 주석 줄과 --verbose 의 diff 를 직접 뺀다.
export function stripCommentLines(text) {
  const scissors = text.indexOf(
    '# ------------------------ >8 ------------------------',
  )
  return (scissors === -1 ? text : text.slice(0, scissors))
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n')
    .trim()
}

function checkCommitMsgFile(file) {
  const message = stripCommentLines(readFileSync(file, 'utf8'))
  const merging =
    spawnSync('git', ['rev-parse', '-q', '--verify', 'MERGE_HEAD'], {
      stdio: 'ignore',
    }).status === 0
  // 빈 메시지는 git 이 커밋을 취소한다. fixup!·squash! 는 푸시 전에 rebase 로 합친다.
  if (!message || merging || /^(?:fixup|squash|amend)! /.test(message)) return

  const problems = checkCommitMessage(message)
  if (problems.length === 0) return
  for (const problem of problems) console.error(`[commit-msg] ${problem}`)
  console.error(
    `[commit-msg] '${message.split('\n')[0]}' — 규칙: harness/shared/team-rules.md 3절`,
  )
  process.exit(1)
}

function main() {
  const args = process.argv.slice(2)
  if (args[0] === '--commit-msg' && args[1]) {
    checkCommitMsgFile(args[1])
    return
  }

  const {
    PR_TITLE: title,
    PR_BRANCH: branch,
    COMMIT_RANGE: range,
  } = process.env
  if (title === undefined || !branch || !range) {
    console.error(
      'usage: PR_TITLE=<제목> PR_BRANCH=<브랜치> COMMIT_RANGE=<base>..<head> check-pr-format.mjs\n' +
        '       check-pr-format.mjs --commit-msg <메시지 파일>',
    )
    process.exit(2)
  }

  const failures = []
  for (const problem of checkPrTitle(title, branch)) {
    failures.push(`PR 제목 '${title}': ${problem}`)
  }
  const commits = readCommits(range)
  for (const { sha, message } of commits) {
    const subject = message.trimEnd().split('\n')[0]
    for (const problem of checkCommitMessage(message)) {
      failures.push(`커밋 ${sha.slice(0, 7)} '${subject}': ${problem}`)
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(`[pr-format] ${failure}`)
    console.error(
      '[pr-format] 규칙: harness/shared/team-rules.md 2절(PR 제목)·3절(커밋 메시지)',
    )
    process.exit(1)
  }
  console.log(`[pr-format] PR 제목과 커밋 ${commits.length}개 통과`)
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  main()
