#!/usr/bin/env node

// 승인된 API 계약(harness/api/approvals/*.contract.json)과 스테이징 Swagger(/v3/api-docs)를 비교한다.
// 비교 항목: 메서드·경로 존재, 성공 응답 코드, 쿼리 파라미터, 요청 필드, 응답 필드(한 단계 중첩까지).
// 차이가 곧 계약 오류는 아니다(실서버가 201 인데 Swagger 가 200 으로 적힌 경우가 있다).
// 사람이 확인한 차이는 harness/api/swagger-known-diffs.json 에 사유와 함께 두고, 목록에 없는 새 차이만 실패로 본다.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  parseOption,
  readJson,
  repositoryRoot,
  writeJson,
} from './api-harness-lib.mjs'

export const defaultSwaggerBaseUrl = 'https://api-stag.toyvillage.kr'
const httpMethods = ['get', 'post', 'put', 'patch', 'delete']

export const knownDiffsPath = (root) =>
  join(root, 'harness', 'api', 'swagger-known-diffs.json')

// `{taskId}`·`:id` 처럼 이름만 다른 path 변수는 같은 경로로 본다.
export function normalizePath(path) {
  const normalized = path
    .split('?')[0]
    .replace(/\{[^}]*\}/g, '{}')
    .replace(/\/:\w+/g, '/{}')
    .replace(/\/+$/, '')
  return normalized || '/'
}

function bodyFieldNames(fields = [], depth = 1, prefix = '') {
  const names = []
  for (const field of fields) {
    const name = `${prefix}${field.name}`
    names.push(name)
    if (depth > 0 && field.fields) {
      names.push(...bodyFieldNames(field.fields, 0, `${name}.`))
    }
  }
  return names
}

// 계약 파일 하나를 비교에 쓰는 모양으로 줄인다. 기능 이름은 `<feature>.contract.json` 에서 온다.
export function readContract(path) {
  const contract = readJson(path)
  const success = contract.responses?.success ?? []
  return {
    feature: basename(path).replace(/\.contract\.json$/, ''),
    method: contract.method.toUpperCase(),
    path: contract.path,
    status: success.map(({ status }) => status),
    query: (contract.queryParameters ?? []).map(({ name }) => name),
    request: bodyFieldNames(contract.requestBody?.fields, 0),
    response: [
      ...new Set(
        success.flatMap(({ body }) => bodyFieldNames(body?.fields, 1)),
      ),
    ],
  }
}

export function readContracts(root) {
  const dir = join(root, 'harness', 'api', 'approvals')
  return readdirSync(dir)
    .filter((file) => file.endsWith('.contract.json'))
    .sort()
    .map((file) => readContract(join(dir, file)))
}

function swaggerSchemas(apiDocs) {
  const schemas = apiDocs.components?.schemas ?? {}
  const resolveRef = (schema) => {
    let current = schema
    for (let depth = 0; current?.$ref && depth < 10; depth += 1) {
      current = schemas[current.$ref.split('/').pop()]
    }
    return current ?? {}
  }
  const propertyNames = (schema, depth) => {
    const resolved = resolveRef(schema)
    if (resolved.type === 'array' || resolved.items) {
      return propertyNames(resolved.items, depth)
    }
    const parts = resolved.allOf ? resolved.allOf.map(resolveRef) : [resolved]
    const names = new Set()
    for (const part of parts) {
      for (const [name, child] of Object.entries(part.properties ?? {})) {
        names.add(name)
        if (depth > 0) {
          for (const nested of propertyNames(child, 0)) {
            names.add(`${name}.${nested}`)
          }
        }
      }
    }
    return names
  }
  return { resolveRef, propertyNames }
}

function firstContentSchema(content) {
  return content ? Object.values(content)[0]?.schema : undefined
}

export function readSwaggerOperations(apiDocs) {
  const { resolveRef, propertyNames } = swaggerSchemas(apiDocs)
  const operations = new Map()
  for (const [path, item] of Object.entries(apiDocs.paths ?? {})) {
    for (const method of httpMethods) {
      const operation = item[method]
      if (!operation) continue

      const query = new Set()
      for (const parameter of (operation.parameters ?? []).filter(
        (candidate) => candidate.in === 'query',
      )) {
        const schema = resolveRef(parameter.schema)
        if (schema.properties) {
          // @ModelAttribute 객체·Pageable 은 펼쳐진 필드가 실제 쿼리 이름이다.
          for (const name of Object.keys(schema.properties)) query.add(name)
        } else if (parameter.name === 'pageable') {
          for (const name of ['page', 'size', 'sort']) query.add(name)
        } else {
          query.add(parameter.name)
        }
      }

      const responses = Object.entries(operation.responses ?? {}).filter(
        ([code]) => code.startsWith('2'),
      )
      const successSchema = firstContentSchema(responses[0]?.[1]?.content)
      const requestSchema = firstContentSchema(operation.requestBody?.content)

      operations.set(`${method.toUpperCase()} ${normalizePath(path)}`, {
        status: responses.map(([code]) => Number(code)),
        query: [...query],
        request: requestSchema ? [...propertyNames(requestSchema, 0)] : [],
        response: successSchema ? [...propertyNames(successSchema, 1)] : [],
        hasResponseSchema: Boolean(successSchema),
      })
    }
  }
  return operations
}

const onlyIn = (left, right) =>
  left.filter((value) => !right.includes(value)).sort()

// 차이 하나는 { feature, kind, contract, swagger } 이다. contract·swagger 는 그쪽에만 있는 값이다.
export function compareContracts(contracts, operations) {
  const diffs = []
  for (const contract of contracts) {
    const operation = operations.get(
      `${contract.method} ${normalizePath(contract.path)}`,
    )
    const push = (kind, contractValue, swaggerValue) =>
      diffs.push({
        feature: contract.feature,
        kind,
        contract: contractValue,
        swagger: swaggerValue,
      })

    if (!operation) {
      push('operation', [`${contract.method} ${contract.path}`], [])
      continue
    }

    if (
      contract.status.length > 0 &&
      !contract.status.some((status) => operation.status.includes(status))
    ) {
      push('status', contract.status, operation.status)
    }

    const queryContract = onlyIn(contract.query, operation.query)
    const querySwagger = onlyIn(operation.query, contract.query)
    if (queryContract.length || querySwagger.length) {
      push('query', queryContract, querySwagger)
    }

    const requestContract = onlyIn(contract.request, operation.request)
    const requestSwagger = onlyIn(operation.request, contract.request)
    if (requestContract.length || requestSwagger.length) {
      push('request', requestContract, requestSwagger)
    }

    if (!operation.hasResponseSchema) {
      if (contract.response.length > 0) push('response-schema', [], [])
    } else {
      // Swagger 쪽 중첩 필드는 계약이 그 부모를 펼치지 않았을 때 소음이 되므로 최상위만 본다.
      const responseContract = onlyIn(contract.response, operation.response)
      const responseSwagger = onlyIn(
        operation.response.filter((name) => !name.includes('.')),
        contract.response,
      )
      if (responseContract.length || responseSwagger.length) {
        push('response', responseContract, responseSwagger)
      }
    }
  }
  return diffs
}

export const diffKey = ({ feature, kind, contract, swagger }) =>
  JSON.stringify([feature, kind, contract, swagger])

export function classifyDiffs(diffs, knownDiffs) {
  const known = new Map(knownDiffs.map((diff) => [diffKey(diff), diff]))
  const current = new Set(diffs.map(diffKey))
  return {
    newDiffs: diffs.filter((diff) => !known.has(diffKey(diff))),
    knownDiffs: diffs
      .filter((diff) => known.has(diffKey(diff)))
      .map((diff) => ({ ...diff, reason: known.get(diffKey(diff)).reason })),
    // 목록에는 있는데 지금은 차이가 없다 → 어느 한쪽이 고쳐졌으니 목록에서 지운다.
    resolvedDiffs: knownDiffs.filter((diff) => !current.has(diffKey(diff))),
  }
}

const formatValues = (values) =>
  values.length ? values.map((value) => `\`${value}\``).join(', ') : '—'

export function formatReport({
  contracts,
  newDiffs,
  knownDiffs,
  resolvedDiffs,
}) {
  const differing = new Set(
    [...newDiffs, ...knownDiffs].map(({ feature }) => feature),
  )
  const lines = [
    `계약 ${contracts.length}개 · Swagger 와 같음 ${contracts.length - differing.size}개 · 다름 ${differing.size}개`,
    `새 차이 ${newDiffs.length}건 · 알려진 차이 ${knownDiffs.length}건 · 해소된 알려진 차이 ${resolvedDiffs.length}건`,
  ]
  const table = (title, rows, withReason) => {
    if (rows.length === 0) return
    lines.push(
      '',
      `## ${title}`,
      '',
      withReason
        ? '| 기능 | 항목 | 계약에만 | Swagger 에만 | 사유 |'
        : '| 기능 | 항목 | 계약에만 | Swagger 에만 |',
      withReason ? '|---|---|---|---|---|' : '|---|---|---|---|',
    )
    for (const row of rows) {
      const cells = [
        row.feature,
        row.kind,
        formatValues(row.contract),
        formatValues(row.swagger),
      ]
      if (withReason) cells.push(row.reason || '—')
      lines.push(`| ${cells.join(' | ')} |`)
    }
  }
  table('새 차이 (확인 필요)', newDiffs, false)
  table('해소된 알려진 차이 (목록에서 지울 것)', resolvedDiffs, true)
  table('알려진 차이', knownDiffs, true)
  return lines.join('\n')
}

export async function fetchApiDocs(baseUrl) {
  const username = process.env.SWAGGER_USERNAME
  const password = process.env.SWAGGER_PASSWORD
  if (!username || !password) {
    throw new Error(
      'SWAGGER_USERNAME·SWAGGER_PASSWORD 가 없습니다. .env 또는 환경 변수에 넣거나 --spec <api-docs.json> 을 쓰세요.',
    )
  }
  const response = await fetch(new URL('/v3/api-docs', baseUrl), {
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
  })
  if (!response.ok) {
    throw new Error(`Swagger 조회 실패: HTTP ${response.status}`)
  }
  return response.json()
}

export function loadDotEnv(root) {
  const path = join(root, '.env')
  // 이미 있는 환경 변수(CI secrets)는 덮어쓰지 않는다.
  if (existsSync(path)) process.loadEnvFile(path)
}

async function main() {
  const args = process.argv.slice(2)
  const root = resolve(parseOption(args, '--root') ?? repositoryRoot)
  const specPath = parseOption(args, '--spec')
  // 승인 전 계약 하나만 볼 때(RUNBOOK ⑤). 없으면 승인된 계약 전체를 본다.
  const contractPath = parseOption(args, '--contract')
  const jsonPath = parseOption(args, '--json')
  const markdownPath = parseOption(args, '--markdown')

  loadDotEnv(root)
  let apiDocs
  try {
    apiDocs = specPath
      ? JSON.parse(readFileSync(resolve(specPath), 'utf8'))
      : await fetchApiDocs(
          process.env.SWAGGER_BASE_URL ?? defaultSwaggerBaseUrl,
        )
  } catch (error) {
    console.error(`[api-swagger] ${error.message}`)
    process.exit(2)
  }

  const contracts = contractPath
    ? [readContract(resolve(contractPath))]
    : readContracts(root)
  const diffs = compareContracts(contracts, readSwaggerOperations(apiDocs))
  const knownPath = knownDiffsPath(root)
  const allKnown = existsSync(knownPath) ? readJson(knownPath).diffs : []
  const features = new Set(contracts.map(({ feature }) => feature))
  const known = allKnown.filter(({ feature }) => features.has(feature))
  const result = { contracts, ...classifyDiffs(diffs, known) }

  if (args.includes('--write-known')) {
    if (contractPath) {
      console.error(
        '[api-swagger] --write-known 은 승인된 계약 전체를 볼 때만 쓴다',
      )
      process.exit(2)
    }
    // 지금 차이를 전부 알려진 차이로 기록한다. 기존 사유는 유지하고 새 항목은 사유를 비워 둔다.
    const reasons = new Map(known.map((diff) => [diffKey(diff), diff.reason]))
    writeJson(knownPath, {
      description:
        '사람이 확인한 계약·Swagger 차이. 사유가 빈 항목은 아직 어느 쪽이 맞는지 확인하지 않은 것이다.',
      diffs: diffs.map((diff) => ({
        ...diff,
        reason: reasons.get(diffKey(diff)) ?? '',
      })),
    })
    console.log(
      `[api-swagger] 알려진 차이 ${diffs.length}건 기록: ${knownPath}`,
    )
    return
  }

  const report = formatReport(result)
  console.log(report)
  if (markdownPath) writeFileSync(resolve(markdownPath), `${report}\n`)
  if (jsonPath) writeJson(resolve(jsonPath), result)
  if (result.newDiffs.length > 0) process.exit(1)
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  main()
