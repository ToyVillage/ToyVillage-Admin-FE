#!/usr/bin/env node
// git 훅 경로를 커밋되는 .githooks 로 설정한다(husky 불필요).
// postinstall 에서 자동 실행된다. git 저장소가 아니면 조용히 건너뛴다.

import { spawnSync } from 'node:child_process'

const inRepo = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
  stdio: 'ignore',
})
if (inRepo.status !== 0) process.exit(0)

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  encoding: 'utf8',
})
if (result.status === 0) console.log('[hooks] core.hooksPath=.githooks 설정됨')
