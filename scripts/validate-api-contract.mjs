#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  apiPaths,
  parseOption,
  readJson,
  repositoryRoot,
  validateApiContract,
} from './api-harness-lib.mjs'

export function validateContractFile(path) {
  if (!existsSync(path)) return [`contract 파일 없음: ${path}`]
  try {
    return validateApiContract(readJson(path))
  } catch (error) {
    return [`contract JSON 파싱 실패: ${error.message}`]
  }
}

function main() {
  const args = process.argv.slice(2)
  const input = args.find(
    (arg) => !arg.startsWith('--') && arg !== parseOption(args, '--root'),
  )
  if (!input) {
    console.error(
      'usage: validate-api-contract.mjs <feature|contract.json> [--root path]',
    )
    process.exit(2)
  }
  const root = resolve(parseOption(args, '--root') ?? repositoryRoot)
  const path = input.endsWith('.json')
    ? resolve(root, input)
    : apiPaths(root, input).contractJson
  const errors = validateContractFile(path)
  if (errors.length > 0) {
    console.error(`[api-contract] invalid\n- ${errors.join('\n- ')}`)
    process.exit(1)
  }
  console.log(`[api-contract] valid: ${path}`)
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  main()
