#!/usr/bin/env node

// Notion 에 명세가 없는 API 의 계약 초안을 스테이징 Swagger 에서 만든다(RUNBOOK ②④, source: swagger).
// 경로·파라미터·요청/응답 필드·타입·필수 여부·성공/오류 코드는 Swagger 에서 채운다.
// Swagger 에 없는 값(접근 역할, 설명, 예시)은 추측하지 않는다. 역할은 task spec 의 swagger.roles 에서만 받는다.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  apiPaths,
  parseOption,
  parseTaskSpec,
  repositoryRoot,
  validateApiContract,
  writeJson,
} from './api-harness-lib.mjs'
import {
  defaultSwaggerBaseUrl,
  fetchApiDocs,
  loadDotEnv,
  normalizePath,
} from './check-api-swagger.mjs'

const maxDepth = 3

function createResolver(apiDocs) {
  const schemas = apiDocs.components?.schemas ?? {}
  return (schema) => {
    let current = schema
    for (let depth = 0; current?.$ref && depth < 10; depth += 1) {
      current = schemas[current.$ref.split('/').pop()]
    }
    return current ?? {}
  }
}

// OpenAPI 3.1 은 type 이 ['string', 'null'] 처럼 올 수 있다.
function schemaType(schema) {
  const types = [schema.type].flat().filter(Boolean)
  return {
    type: types.find((type) => type !== 'null'),
    nullable: schema.nullable === true || types.includes('null'),
  }
}

function constraintsOf(schema) {
  const constraints = []
  if (schema.format) constraints.push(`format: ${schema.format}`)
  if (schema.minLength !== undefined)
    constraints.push(`minLength: ${schema.minLength}`)
  if (schema.maxLength !== undefined)
    constraints.push(`maxLength: ${schema.maxLength}`)
  if (schema.minimum !== undefined)
    constraints.push(`minimum: ${schema.minimum}`)
  if (schema.maximum !== undefined)
    constraints.push(`maximum: ${schema.maximum}`)
  if (schema.pattern) constraints.push(`pattern: ${schema.pattern}`)
  return constraints
}

function createFieldBuilder(resolveRef) {
  const objectFields = (schema, location, depth) => {
    const resolved = resolveRef(schema)
    const parts = resolved.allOf ? resolved.allOf.map(resolveRef) : [resolved]
    const required = new Set(parts.flatMap((part) => part.required ?? []))
    return parts.flatMap((part) =>
      Object.entries(part.properties ?? {}).map(([name, child]) =>
        field(name, child, location, required.has(name), depth),
      ),
    )
  }

  // 계약 필드 하나. 타입 표기는 api-input-contract.md 의 기본 타입을 따른다.
  const describe = (schema, location, depth) => {
    const resolved = resolveRef(schema)
    const { type, nullable } = schemaType(resolved)
    const result = { nullable, constraints: constraintsOf(resolved) }

    if (resolved.enum) {
      return { ...result, type: 'enum', allowedValues: resolved.enum }
    }
    if (type === 'array' || resolved.items) {
      const item = describe(resolved.items ?? {}, location, depth)
      const itemType = item.type === 'enum' ? 'string' : item.type
      return {
        ...result,
        type: `array<${itemType}>`,
        ...(item.allowedValues && { allowedValues: item.allowedValues }),
        ...(item.fields && { fields: item.fields }),
      }
    }
    if (type === 'object' || resolved.properties || resolved.allOf) {
      return {
        ...result,
        type: 'object',
        ...(depth < maxDepth && {
          fields: objectFields(resolved, location, depth + 1),
        }),
      }
    }
    if (type === 'string' && resolved.format === 'date-time') {
      return { ...result, type: 'datetime' }
    }
    return { ...result, type: type ?? 'object' }
  }

  function field(name, schema, location, required, depth = 0) {
    const resolved = resolveRef(schema)
    const { type, allowedValues, fields, nullable, constraints } = describe(
      schema,
      location,
      depth,
    )
    return {
      name,
      location,
      type,
      ...(allowedValues && { allowedValues }),
      required,
      nullable,
      default: resolved.default ?? null,
      example: resolved.example ?? null,
      description: resolved.description ?? '',
      constraints,
      ...(fields && { fields }),
    }
  }

  return { field, describe, objectFields }
}

function firstContent(content) {
  const [contentType, media] = Object.entries(content ?? {})[0] ?? []
  return { contentType, schema: media?.schema }
}

function responseOf(status, response, builder) {
  const { schema } = firstContent(response.content)
  const base = {
    status: Number(status),
    description: response.description ?? '',
  }
  if (!schema || Number(status) === 204) {
    return { ...base, noContent: true, body: null }
  }
  const { type, fields, allowedValues, nullable } = builder.describe(
    schema,
    'body',
    0,
  )
  return {
    ...base,
    noContent: false,
    body: {
      type,
      nullable,
      description: '',
      ...(allowedValues && { allowedValues }),
      fields: fields ?? [],
    },
  }
}

const authorizationHeader = {
  name: 'Authorization',
  location: 'header',
  type: 'string',
  required: true,
  nullable: false,
  default: null,
  example: 'Bearer <access-token>',
  description: 'JWT 액세스 토큰',
  constraints: ['Bearer 스킴'],
}

export function findOperation(apiDocs, method, path) {
  const target = `${method.toUpperCase()} ${normalizePath(path)}`
  for (const [swaggerPath, item] of Object.entries(apiDocs.paths ?? {})) {
    const operation = item[method.toLowerCase()]
    if (
      operation &&
      `${method.toUpperCase()} ${normalizePath(swaggerPath)}` === target
    ) {
      return { swaggerPath, operation }
    }
  }
  return undefined
}

export function createContractFromSwagger({
  apiDocs,
  spec,
  swaggerUrl,
  checkedAt,
}) {
  const { method, path, roles } = spec.swagger
  const found = findOperation(apiDocs, method, path)
  if (!found) throw new Error(`Swagger 에 ${method} ${path} 가 없음`)
  const { swaggerPath, operation } = found

  const resolveRef = createResolver(apiDocs)
  const builder = createFieldBuilder(resolveRef)
  const parameters = operation.parameters ?? []

  const queryParameters = parameters
    .filter((parameter) => parameter.in === 'query')
    .flatMap((parameter) => {
      const schema = resolveRef(parameter.schema)
      if (parameter.name === 'pageable') {
        // springdoc Pageable 은 page·size·sort 로 펼쳐 보낸다.
        return ['page', 'size', 'sort'].map((name) =>
          builder.field(
            name,
            schema.properties?.[name] ?? { type: 'string' },
            'query',
            false,
          ),
        )
      }
      if (schema.properties) {
        return builder
          .objectFields(schema, 'query', 0)
          .map(({ fields, ...rest }) => rest)
      }
      return [
        builder.field(
          parameter.name,
          parameter.schema,
          'query',
          parameter.required === true,
        ),
      ]
    })

  const pathParameters = parameters
    .filter((parameter) => parameter.in === 'path')
    .map((parameter) =>
      builder.field(parameter.name, parameter.schema, 'path', true),
    )

  const request = firstContent(operation.requestBody?.content)
  const requestBody = request.schema
    ? {
        required: operation.requestBody.required === true,
        fields: builder.objectFields(request.schema, 'body', 0),
        example: null,
      }
    : null

  // 전역 security 가 있고 operation 이 security: [] 로 끄지 않았으면 인증 API 다.
  const security = operation.security ?? apiDocs.security ?? []
  const authenticated = security.some(
    (requirement) => Object.keys(requirement).length > 0,
  )

  const responses = Object.entries(operation.responses ?? {})
  const success = responses
    .filter(([status]) => status.startsWith('2'))
    .map(([status, response]) => responseOf(status, response, builder))
  const errors = responses
    .filter(([status]) => /^[45]/.test(status))
    .map(([status, response]) => responseOf(status, response, builder))

  return {
    apiId: spec.apiId,
    name: operation.summary || operation.operationId || `${method} ${path}`,
    description: operation.description ?? '',
    method,
    path: swaggerPath,
    authentication: authenticated
      ? { required: true, type: 'Bearer', roles }
      : { required: false, type: null, roles: [] },
    contentType: request.contentType ?? 'application/json',
    headers: authenticated ? [authorizationHeader] : [],
    pathParameters,
    queryParameters,
    requestBody,
    responses: { success, errors },
    source: {
      kind: 'swagger',
      swaggerUrl,
      operationId: operation.operationId ?? null,
      method,
      path: swaggerPath,
      checkedAt,
    },
  }
}

function fieldRows(fields, prefix = '') {
  return fields.flatMap((field) => [
    `| ${prefix}${field.name} | ${field.type}${field.allowedValues ? ` (${field.allowedValues.join(', ')})` : ''} | ${field.required} | ${field.nullable} | ${field.constraints.join(', ') || '—'} |`,
    ...fieldRows(field.fields ?? [], `${prefix}${field.name}.`),
  ])
}

function fieldTable(title, fields) {
  if (fields.length === 0) return [`## ${title}`, '', '없음', '']
  return [
    `## ${title}`,
    '',
    '| 이름 | 타입 | 필수 | null | 제약 |',
    '|---|---|---|---|---|',
    ...fieldRows(fields),
    '',
  ]
}

export function contractMarkdown(contract) {
  const responses = [
    ...contract.responses.success,
    ...contract.responses.errors,
  ].flatMap((response) => [
    ...fieldTable(
      `응답 ${response.status} ${response.description}`.trim(),
      response.body?.fields ?? [],
    ),
  ])
  return [
    `# ${contract.apiId} — ${contract.method} ${contract.path}`,
    '',
    `> Swagger 에서 생성: ${contract.source.swaggerUrl} · operationId \`${contract.source.operationId}\` · ${contract.source.checkedAt}`,
    '> 접근 역할·설명·예시는 Swagger 에 없어 task spec 과 개발자 확인으로 채운다.',
    '',
    `- 인증: ${contract.authentication.required ? `${contract.authentication.type} · 역할 ${contract.authentication.roles.join(', ') || '(미정)'}` : '없음'}`,
    `- Content-Type: ${contract.contentType}`,
    '',
    ...fieldTable('Path 파라미터', contract.pathParameters),
    ...fieldTable('Query 파라미터', contract.queryParameters),
    ...fieldTable('요청 Body', contract.requestBody?.fields ?? []),
    ...responses,
  ].join('\n')
}

async function main() {
  const args = process.argv.slice(2)
  const feature = args[0]
  if (!feature || feature.startsWith('--')) {
    console.error(
      'usage: create-contract-from-swagger.mjs <feature> [--spec api-docs.json] [--root path]',
    )
    process.exit(2)
  }
  const root = resolve(parseOption(args, '--root') ?? repositoryRoot)
  const paths = apiPaths(root, feature)
  const spec = parseTaskSpec(paths.spec)
  if (spec.source !== 'swagger') {
    console.error(
      '[api-swagger-contract] task spec 의 source 가 swagger 가 아님',
    )
    process.exit(2)
  }
  if (!spec.swagger.method || !spec.swagger.path) {
    console.error(
      '[api-swagger-contract] task spec 에 swagger.method·swagger.path 필요',
    )
    process.exit(2)
  }

  loadDotEnv(root)
  const baseUrl = process.env.SWAGGER_BASE_URL ?? defaultSwaggerBaseUrl
  const specPath = parseOption(args, '--spec')
  let apiDocs
  try {
    apiDocs = specPath
      ? JSON.parse(readFileSync(resolve(specPath), 'utf8'))
      : await fetchApiDocs(baseUrl)
  } catch (error) {
    console.error(`[api-swagger-contract] ${error.message}`)
    process.exit(2)
  }

  let contract
  try {
    contract = createContractFromSwagger({
      apiDocs,
      spec,
      swaggerUrl: specPath
        ? resolve(specPath)
        : new URL('/v3/api-docs', baseUrl).href,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`[api-swagger-contract] ${error.message}`)
    process.exit(1)
  }

  if (existsSync(paths.contractJson) && !args.includes('--force')) {
    console.error(
      `[api-swagger-contract] 이미 있음: ${paths.contractJson} (덮어쓰려면 --force)`,
    )
    process.exit(1)
  }
  writeJson(paths.contractJson, contract)
  writeFileSync(paths.contractMarkdown, `${contractMarkdown(contract)}\n`)
  console.log(`[api-swagger-contract] 생성: ${paths.contractJson}`)

  const errors = validateApiContract(contract)
  if (errors.length > 0) {
    console.error(
      `[api-swagger-contract] 계약 검증 실패 — 직접 채울 값\n- ${errors.join('\n- ')}`,
    )
    process.exit(1)
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  main()
