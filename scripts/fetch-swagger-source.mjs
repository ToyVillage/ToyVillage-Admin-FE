#!/usr/bin/env node

// RUNBOOK ③-1: Notion 명세에서 확인한 메서드·경로로 스테이징 Swagger 의 같은 API 를 찾아
// harness/artifacts/api/<feature>.swagger-source.json 에 저장한다. ④ 계약 생성은 Notion 원문과 이 파일을 함께 본다.
// 필드는 계약과 같은 모양(name·type·required·nullable·constraints…)으로 뽑아 바로 대조할 수 있게 한다.
// Swagger(springdoc)에 없는 값(접근 역할, 응답 필드 필수 여부, 설명·예시)은 채우지 않는다.

import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseOption, repositoryRoot, writeJson } from './api-harness-lib.mjs'
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

export function extractSwaggerSource({
  apiDocs,
  method,
  path,
  swaggerUrl,
  checkedAt,
}) {
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
    // 계약 source.swagger 에 그대로 옮기는 출처.
    source: {
      swaggerUrl,
      operationId: operation.operationId ?? null,
      method,
      path: swaggerPath,
      checkedAt,
    },
    // Swagger 는 역할을 구분하지 않는다. 인증 여부만 남긴다.
    authenticated,
    contentType: request.contentType ?? 'application/json',
    pathParameters,
    queryParameters,
    requestBody,
    responses: { success, errors },
  }
}

async function main() {
  const args = process.argv.slice(2)
  const [feature, rawMethod, path] = args
  if (!feature || !rawMethod || !path || feature.startsWith('--')) {
    console.error(
      'usage: fetch-swagger-source.mjs <feature> <METHOD> <path> [--spec api-docs.json] [--root path]',
    )
    process.exit(2)
  }
  const method = rawMethod.toUpperCase()
  const root = resolve(parseOption(args, '--root') ?? repositoryRoot)

  loadDotEnv(root)
  const baseUrl = process.env.SWAGGER_BASE_URL ?? defaultSwaggerBaseUrl
  const specPath = parseOption(args, '--spec')
  let apiDocs
  try {
    apiDocs = specPath
      ? JSON.parse(readFileSync(resolve(specPath), 'utf8'))
      : await fetchApiDocs(baseUrl)
  } catch (error) {
    console.error(`[api-swagger-source] ${error.message}`)
    process.exit(2)
  }

  let source
  try {
    source = extractSwaggerSource({
      apiDocs,
      method,
      path,
      swaggerUrl: specPath
        ? resolve(specPath)
        : new URL('/v3/api-docs', baseUrl).href,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    // Notion 경로가 Swagger 에 없으면 어느 쪽이 맞는지 정해야 하므로 STOP 한다.
    console.error(`[api-swagger-source] STOP: ${error.message}`)
    process.exit(1)
  }

  const out = join(
    root,
    'harness',
    'artifacts',
    'api',
    `${feature}.swagger-source.json`,
  )
  writeJson(out, source)
  console.log(
    `[api-swagger-source] ${method} ${source.source.path} (${source.source.operationId}) → ${out}`,
  )
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  main()
