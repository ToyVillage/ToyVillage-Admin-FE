import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  checkCommitMessage,
  checkPrTitle,
  stripCommentLines,
} from '../../scripts/check-pr-format.mjs'

const script = fileURLToPath(
  new URL('../../scripts/check-pr-format.mjs', import.meta.url),
)

test('commit message in team-rules form passes', () => {
  for (const message of [
    'fix: 미제출 담당자 줄에 업무 보고 화살표 추가\n',
    'test: 실제 서버 해제 후 재승인 테스트 추가와 테스트용 커밋 서명 비활성화',
    'chore: 승인 기록 갱신',
    'feat: 로그인 재시도 안내 문구 필요',
  ]) {
    assert.deepEqual(checkCommitMessage(message), [], message)
  }
})

test('commit body and trailers are refused', () => {
  assert.match(
    checkCommitMessage('feat: 목록 추가\n\n상세 설명').join(),
    /한 줄로/,
  )
  assert.match(
    checkCommitMessage(
      'feat: 목록 추가\n\nCo-Authored-By: Claude <noreply@anthropic.com>',
    ).join(),
    /한 줄로/,
  )
})

test('commit type, scope and spacing are checked', () => {
  assert.match(checkCommitMessage('perf: 목록 캐시 추가').join(), /type은/)
  assert.match(checkCommitMessage('Feat: 목록 추가').join(), /type은/)
  assert.match(checkCommitMessage('feat(task): 목록 추가').join(), /scope/)
  assert.match(checkCommitMessage('feat!: 목록 추가').join(), /scope/)
  assert.match(checkCommitMessage('feat:목록 추가').join(), /공백 한 칸/)
  assert.match(checkCommitMessage('feat:  목록 추가').join(), /공백 한 칸/)
  assert.match(checkCommitMessage('목록 추가').join(), /'type: 내용'/)
  assert.match(
    checkCommitMessage('Merge branch develop into feature').join(),
    /'type: 내용'/,
  )
})

test('sentence endings are refused but nouns ending in 요 pass', () => {
  for (const message of [
    'feat: 목록을 추가한다',
    'fix: 버튼 위치를 고쳤다.',
    'fix: 버튼 위치 수정했습니다',
    'docs: 규칙 정리해요',
  ]) {
    assert.match(checkCommitMessage(message).join(), /명사형/, message)
  }
  assert.deepEqual(checkCommitMessage('docs: 재승인 절차 중요'), [])
})

test('PR title must be the branch name with hyphens as spaces', () => {
  assert.deepEqual(checkPrTitle('#103/mock e2e fix', '#103/mock-e2e-fix'), [])
  assert.match(
    checkPrTitle('#103/mock-e2e-fix', '#103/mock-e2e-fix').join(),
    /'#103\/mock e2e fix'/,
  )
  assert.match(
    checkPrTitle('#92/updated resource UI', '#92/updated-resource-ui').join(),
    /'#92\/updated resource ui'/,
  )
  assert.match(
    checkPrTitle('feat: 업무일지관리 API 연동', '#65/work-log-api').join(),
    /'#65\/work log api'/,
  )
})

function git(root, ...args) {
  return execFileSync(
    'git',
    [
      '-C',
      root,
      '-c',
      'user.name=t',
      '-c',
      'user.email=t@t',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    { encoding: 'utf8' },
  ).trim()
}

function commit(root, file, message) {
  writeFileSync(join(root, file), message)
  git(root, 'add', file)
  git(root, 'commit', '-q', '-m', message)
}

function run(root, env) {
  return spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  })
}

test('CLI checks only non-merge commits in the PR range', () => {
  const root = mkdtempSync(join(tmpdir(), 'pr-format-'))
  git(root, 'init', '-q', '-b', 'develop')
  // base 이전 커밋은 형식이 틀려도 범위 밖이라 보지 않는다.
  commit(root, 'a.txt', 'initial commit')
  const base = git(root, 'rev-parse', 'HEAD')

  git(root, 'switch', '-q', '-c', '#7/list-page')
  commit(root, 'b.txt', 'feat: 목록 화면 추가')
  git(root, 'switch', '-q', 'develop')
  commit(root, 'c.txt', 'fix: 다른 PR 수정')
  git(root, 'switch', '-q', '#7/list-page')
  // develop 을 끌어온 머지 커밋은 기본 메시지라도 통과한다.
  git(root, 'merge', '-q', '--no-ff', '--no-edit', 'develop')

  const env = {
    PR_TITLE: '#7/list page',
    PR_BRANCH: '#7/list-page',
    COMMIT_RANGE: `${base}..HEAD`,
  }
  const ok = run(root, env)
  assert.equal(ok.status, 0, ok.stderr)
  assert.match(ok.stdout, /커밋 2개 통과/)

  commit(root, 'd.txt', 'feat(list): 정렬을 추가한다')
  const sha = git(root, 'rev-parse', '--short=7', 'HEAD')
  const bad = run(root, { ...env, PR_TITLE: '#7/list-page' })
  assert.equal(bad.status, 1)
  assert.match(bad.stderr, /PR 제목 '#7\/list-page'/)
  assert.match(bad.stderr, new RegExp(`커밋 ${sha} .*scope`))
  assert.match(bad.stderr, new RegExp(`커밋 ${sha} .*명사형`))
  assert.doesNotMatch(bad.stderr, /initial commit|Merge branch/)
})

test('comment lines and verbose diff are stripped before the hook checks', () => {
  assert.equal(
    stripCommentLines(
      [
        'fix: 버튼 위치 수정',
        '',
        '# Please enter the commit message for your changes.',
        '# ------------------------ >8 ------------------------',
        'diff --git a/a.txt b/a.txt',
        '+추가한다',
      ].join('\n'),
    ),
    'fix: 버튼 위치 수정',
  )
})

test('commit-msg hook blocks bad messages and skips merges', () => {
  const hooks = fileURLToPath(new URL('../../.githooks', import.meta.url))
  const root = mkdtempSync(join(tmpdir(), 'commit-msg-'))
  git(root, 'init', '-q', '-b', 'develop')
  git(root, 'config', 'core.hooksPath', hooks)
  commit(root, 'a.txt', 'chore: 초기 파일 추가')

  writeFileSync(join(root, 'b.txt'), 'b')
  git(root, 'add', 'b.txt')
  const bad = spawnSync(
    'git',
    [
      '-C',
      root,
      '-c',
      'user.name=t',
      '-c',
      'user.email=t@t',
      'commit',
      '-q',
      '-m',
      'feat(list): 목록 추가\n\n본문',
    ],
    { encoding: 'utf8' },
  )
  assert.notEqual(bad.status, 0)
  assert.match(bad.stderr, /\[commit-msg\] 본문/)
  assert.match(bad.stderr, /\[commit-msg\] scope/)
  assert.equal(git(root, 'rev-list', '--count', 'HEAD'), '1')

  // 편집기로 쓴 메시지처럼 주석이 남아 있어도 통과한다.
  writeFileSync(join(root, 'msg.txt'), 'feat: 목록 추가\n\n# 주석 줄\n')
  git(root, 'commit', '-q', '--cleanup=strip', '-F', 'msg.txt')
  git(root, 'switch', '-q', '-c', '#7/list-page', 'HEAD~1')
  commit(root, 'c.txt', 'fixup! feat: 목록 추가')
  git(root, 'merge', '-q', '--no-ff', '--no-edit', 'develop')
  assert.match(git(root, 'log', '-1', '--format=%s'), /^Merge branch 'develop'/)
})

test('CLI exits 2 without PR context', () => {
  const result = run(tmpdir(), {
    PR_TITLE: '',
    PR_BRANCH: '',
    COMMIT_RANGE: '',
  })
  assert.equal(result.status, 2)
  assert.match(result.stderr, /usage:/)
})
