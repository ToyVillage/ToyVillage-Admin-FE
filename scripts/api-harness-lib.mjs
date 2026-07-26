import { createHash } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
)

export function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

export function copyRequired(source, target) {
  if (!existsSync(source)) throw new Error(`필수 파일 없음: ${source}`)
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(source, target)
}

export function parseOption(args, name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

export function parseTaskSpec(path) {
  if (!existsSync(path)) throw new Error(`API task spec 없음: ${path}`)
  const source = readFileSync(path, 'utf8')
  const frontmatter = source.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!frontmatter) throw new Error('API task spec frontmatter 누락')

  const value = (name) => {
    const match = frontmatter[1].match(new RegExp(`^${name}:\\s*(.*)$`, 'm'))
    return match?.[1]?.trim() ?? ''
  }
  const nested = (parent, name) => {
    const lines = frontmatter[1].split('\n')
    const parentIndex = lines.findIndex((line) =>
      new RegExp(`^${parent}:\\s*$`).test(line),
    )
    if (parentIndex < 0) return ''
    for (let index = parentIndex + 1; index < lines.length; index += 1) {
      const line = lines[index]
      if (line.trim() && !/^\s/.test(line)) break
      const match = line.match(new RegExp(`^\\s+${name}:\\s*(.*)$`))
      if (match) return match[1].trim()
    }
    return ''
  }

  const allowedMethodsRaw = nested('real_server', 'allowed_methods')
  const allowedMethods =
    allowedMethodsRaw === '[]'
      ? []
      : allowedMethodsRaw
          .replace(/^\[/, '')
          .replace(/\]$/, '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)

  return {
    feature: value('feature'),
    apiId: value('api_id'),
    targetPage: value('target_page'),
    notionPage: value('notion_page'),
    requiresFunctionalTest: value('requires_functional_test') !== 'false',
    realServer: {
      enabled: nested('real_server', 'enabled') === 'true',
      environment: nested('real_server', 'environment'),
      baseUrl: nested('real_server', 'base_url'),
      allowedMethods,
    },
  }
}

export function validateRealServerConfig(spec, contract) {
  const errors = []
  const config = spec.realServer

  if (!config.enabled) {
    if (config.allowedMethods.length > 0) {
      errors.push(
        'real_server.enabled=false이면 allowed_methods는 비어 있어야 함',
      )
    }
    if (config.baseUrl) {
      errors.push('real_server.enabled=false이면 base_url은 비어 있어야 함')
    }
    return errors
  }

  if (config.environment !== 'staging') {
    errors.push('실제 서버 테스트는 staging 환경만 허용')
  }

  let baseUrl
  try {
    baseUrl = new URL(config.baseUrl)
  } catch {
    errors.push('real_server.base_url: 유효한 절대 URL 필요')
  }
  if (baseUrl) {
    if (baseUrl.protocol !== 'https:') {
      errors.push('real_server.base_url: staging HTTPS URL만 허용')
    }
    if (baseUrl.username || baseUrl.password) {
      errors.push('real_server.base_url: 자격증명 포함 금지')
    }
    if (baseUrl.search || baseUrl.hash) {
      errors.push('real_server.base_url: query 또는 fragment 포함 금지')
    }
  }

  if (config.allowedMethods.length === 0) {
    errors.push('real_server.allowed_methods: 한 개 이상의 method 필요')
  }
  const supportedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  for (const method of config.allowedMethods) {
    if (!supportedMethods.has(method)) {
      errors.push(`real_server.allowed_methods: 허용되지 않은 method ${method}`)
    }
  }
  if (contract?.method && !config.allowedMethods.includes(contract.method)) {
    errors.push(
      `real_server.allowed_methods: Contract method ${contract.method} 누락`,
    )
  }

  return errors
}

function requireString(value, path, errors, { allowEmpty = false } = {}) {
  if (typeof value !== 'string' || (!allowEmpty && value.trim() === '')) {
    errors.push(`${path}: 비어 있지 않은 string 필요`)
  }
}

function requireBoolean(value, path, errors) {
  if (typeof value !== 'boolean') errors.push(`${path}: boolean 필요`)
}

function validateField(field, path, errors) {
  if (!field || typeof field !== 'object' || Array.isArray(field)) {
    errors.push(`${path}: object 필요`)
    return
  }

  const requiredProperties = [
    'name',
    'location',
    'type',
    'required',
    'nullable',
    'default',
    'example',
    'description',
    'constraints',
  ]
  for (const property of requiredProperties) {
    if (!hasOwn(field, property)) errors.push(`${path}.${property}: 속성 누락`)
  }

  requireString(field.name, `${path}.name`, errors)
  requireString(field.location, `${path}.location`, errors)
  requireString(field.type, `${path}.type`, errors)
  requireBoolean(field.required, `${path}.required`, errors)
  requireBoolean(field.nullable, `${path}.nullable`, errors)
  requireString(field.description, `${path}.description`, errors, {
    allowEmpty: true,
  })
  if (!Array.isArray(field.constraints))
    errors.push(`${path}.constraints: array 필요`)

  if (field.type === 'enum') {
    if (
      !Array.isArray(field.allowedValues) ||
      field.allowedValues.length === 0
    ) {
      errors.push(`${path}.allowedValues: enum은 비어 있지 않은 배열 필요`)
    }
  }
}

function validateFieldArray(value, path, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${path}: array 필요`)
    return
  }
  value.forEach((field, index) =>
    validateField(field, `${path}[${index}]`, errors),
  )
}

function validateResponse(response, path, errors) {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    errors.push(`${path}: object 필요`)
    return
  }
  if (
    !Number.isInteger(response.status) ||
    response.status < 100 ||
    response.status > 599
  ) {
    errors.push(`${path}.status: 유효한 HTTP status integer 필요`)
  }
  requireString(response.description, `${path}.description`, errors, {
    allowEmpty: true,
  })
  if (!hasOwn(response, 'body')) errors.push(`${path}.body: 속성 누락`)
  if (!hasOwn(response, 'noContent'))
    errors.push(`${path}.noContent: 속성 누락`)
  requireBoolean(response.noContent, `${path}.noContent`, errors)

  if (response.body === null) {
    if (response.noContent !== true)
      errors.push(`${path}: body가 null이면 noContent는 true여야 함`)
  } else {
    if (response.noContent !== false)
      errors.push(`${path}: body가 있으면 noContent는 false여야 함`)
    if (
      !response.body ||
      typeof response.body !== 'object' ||
      Array.isArray(response.body)
    ) {
      errors.push(`${path}.body: object 또는 null 필요`)
    } else {
      requireString(response.body.type, `${path}.body.type`, errors)
      requireBoolean(response.body.nullable, `${path}.body.nullable`, errors)
      requireString(
        response.body.description,
        `${path}.body.description`,
        errors,
        {
          allowEmpty: true,
        },
      )
      if (hasOwn(response.body, 'fields')) {
        validateFieldArray(response.body.fields, `${path}.body.fields`, errors)
      }
      if (
        response.body.type === 'object' &&
        !Array.isArray(response.body.fields)
      ) {
        errors.push(`${path}.body.fields: object 응답의 필드 배열 필요`)
      }
      if (response.body.type === 'enum') {
        if (
          !Array.isArray(response.body.allowedValues) ||
          response.body.allowedValues.length === 0
        ) {
          errors.push(`${path}.body.allowedValues: enum 허용값 필요`)
        }
      }
    }
  }
  if (
    response.status === 204 &&
    (response.body !== null || response.noContent !== true)
  ) {
    errors.push(`${path}: HTTP 204는 body null과 noContent true 필요`)
  }
}

function normalizeComparable(value) {
  return JSON.stringify(value)
}

export function validateApiContract(contract) {
  const errors = []
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    return ['contract: JSON object 필요']
  }

  requireString(contract.apiId, 'apiId', errors)
  if (
    typeof contract.apiId === 'string' &&
    !/^[A-Z][A-Z0-9_]*$/.test(contract.apiId)
  ) {
    errors.push('apiId: UPPER_SNAKE_CASE 필요')
  }
  requireString(contract.name, 'name', errors)
  requireString(contract.description, 'description', errors, {
    allowEmpty: true,
  })
  requireString(contract.method, 'method', errors)
  if (
    typeof contract.method === 'string' &&
    !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(contract.method)
  ) {
    errors.push('method: GET, POST, PUT, PATCH, DELETE 중 하나 필요')
  }
  requireString(contract.path, 'path', errors)
  if (typeof contract.path === 'string') {
    if (!contract.path.startsWith('/'))
      errors.push('path: /로 시작하는 full path 필요')
    if (contract.path.includes('?') || contract.path.includes('#')) {
      errors.push('path: Query String 또는 fragment 포함 금지')
    }
  }
  requireString(contract.contentType, 'contentType', errors)

  const auth = contract.authentication
  if (!auth || typeof auth !== 'object' || Array.isArray(auth)) {
    errors.push('authentication: object 필요')
  } else {
    requireBoolean(auth.required, 'authentication.required', errors)
    if (!hasOwn(auth, 'type')) errors.push('authentication.type: 속성 누락')
    if (!Array.isArray(auth.roles))
      errors.push('authentication.roles: array 필요')
    if (auth.required === true) {
      requireString(auth.type, 'authentication.type', errors)
      if (!Array.isArray(auth.roles) || auth.roles.length === 0) {
        errors.push('authentication.roles: 인증 API는 접근 역할 필요')
      }
    }
    if (
      auth.required === false &&
      (auth.type !== null || auth.roles?.length !== 0)
    ) {
      errors.push('authentication: 공개 API는 type null, roles [] 필요')
    }
  }

  validateFieldArray(contract.headers, 'headers', errors)
  validateFieldArray(contract.pathParameters, 'pathParameters', errors)
  validateFieldArray(contract.queryParameters, 'queryParameters', errors)

  if (
    typeof contract.path === 'string' &&
    Array.isArray(contract.pathParameters)
  ) {
    const placeholders = [...contract.path.matchAll(/\{([^}]+)\}/g)]
      .map((match) => match[1])
      .sort()
    const declared = contract.pathParameters
      .map((parameter) => parameter?.name)
      .sort()
    if (normalizeComparable(placeholders) !== normalizeComparable(declared)) {
      errors.push('pathParameters: Full Path placeholder와 선언이 일치해야 함')
    }
    contract.pathParameters.forEach((parameter, index) => {
      if (parameter?.required !== true) {
        errors.push(
          `pathParameters[${index}].required: path parameter는 true 필요`,
        )
      }
    })
  }

  if (auth?.required === true && Array.isArray(contract.headers)) {
    const authorization = contract.headers.find(
      (header) => header?.name?.toLowerCase() === 'authorization',
    )
    if (!authorization || authorization.required !== true) {
      errors.push('headers: 인증 API는 required Authorization header 필요')
    }
  }

  if (!hasOwn(contract, 'requestBody')) {
    errors.push('requestBody: 속성 누락')
  } else if (contract.requestBody !== null) {
    requireBoolean(
      contract.requestBody?.required,
      'requestBody.required',
      errors,
    )
    validateFieldArray(
      contract.requestBody?.fields,
      'requestBody.fields',
      errors,
    )
    if (!hasOwn(contract.requestBody ?? {}, 'example')) {
      errors.push('requestBody.example: 속성 누락')
    }
  }

  if (!contract.responses || typeof contract.responses !== 'object') {
    errors.push('responses: object 필요')
  } else {
    if (
      !Array.isArray(contract.responses.success) ||
      contract.responses.success.length === 0
    ) {
      errors.push('responses.success: 비어 있지 않은 배열 필요')
    } else {
      contract.responses.success.forEach((response, index) =>
        validateResponse(response, `responses.success[${index}]`, errors),
      )
    }
    if (
      !Array.isArray(contract.responses.errors) ||
      contract.responses.errors.length === 0
    ) {
      errors.push('responses.errors: 대표 오류 응답 필요')
    } else {
      contract.responses.errors.forEach((response, index) =>
        validateResponse(response, `responses.errors[${index}]`, errors),
      )
    }
  }

  const source = contract.source
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    errors.push('source: object 필요')
  } else {
    requireString(source.notionDatabase, 'source.notionDatabase', errors)
    if (!hasOwn(source, 'notionDataSource'))
      errors.push('source.notionDataSource: 속성 누락')
    requireString(
      source.resolvedNotionPage,
      'source.resolvedNotionPage',
      errors,
    )
    if (!hasOwn(source, 'requestedNotionPage')) {
      errors.push('source.requestedNotionPage: 속성 누락')
    }
    requireString(source.checkedAt, 'source.checkedAt', errors)
    if (source.apiIdMatchCount !== 1)
      errors.push('source.apiIdMatchCount: 정확히 1이어야 함')

    const databaseValues = source.databaseValues
    const detailValues = source.detailValues
    for (const [label, values] of [
      ['databaseValues', databaseValues],
      ['detailValues', detailValues],
    ]) {
      if (!values || typeof values !== 'object') {
        errors.push(`source.${label}: object 필요`)
        continue
      }
      requireString(values.apiId, `source.${label}.apiId`, errors)
      requireString(values.method, `source.${label}.method`, errors)
      requireString(values.path, `source.${label}.path`, errors)
      if (!values.authentication || typeof values.authentication !== 'object') {
        errors.push(`source.${label}.authentication: object 필요`)
      } else {
        requireBoolean(
          values.authentication.required,
          `source.${label}.authentication.required`,
          errors,
        )
        if (!hasOwn(values.authentication, 'type')) {
          errors.push(`source.${label}.authentication.type: 속성 누락`)
        }
        if (!Array.isArray(values.authentication.roles)) {
          errors.push(`source.${label}.authentication.roles: array 필요`)
        }
      }
    }

    for (const property of ['apiId', 'method', 'path', 'authentication']) {
      if (
        databaseValues &&
        detailValues &&
        normalizeComparable(databaseValues[property]) !==
          normalizeComparable(detailValues[property])
      ) {
        errors.push(`source: database/detail ${property} 불일치`)
      }
    }
    if (databaseValues?.apiId !== contract.apiId)
      errors.push('source apiId와 contract apiId 불일치')
    if (databaseValues?.method !== contract.method)
      errors.push('source method와 contract method 불일치')
    if (databaseValues?.path !== contract.path)
      errors.push('source path와 contract path 불일치')
    if (
      databaseValues?.authentication &&
      normalizeComparable(databaseValues.authentication) !==
        normalizeComparable(contract.authentication)
    ) {
      errors.push('source authentication과 contract authentication 불일치')
    }
    if (
      source.requestedNotionPage &&
      source.requestedNotionPage !== source.resolvedNotionPage
    ) {
      errors.push('source: 요청 Notion URL과 API ID 검색 결과 불일치')
    }
    if (
      typeof source.checkedAt === 'string' &&
      Number.isNaN(Date.parse(source.checkedAt))
    ) {
      errors.push('source.checkedAt: ISO date 형식 필요')
    }
  }

  return errors
}

export function apiPaths(root, feature) {
  const artifacts = join(root, 'harness', 'artifacts', 'api')
  const approvals = join(root, 'harness', 'api', 'approvals')
  return {
    spec: join(root, 'harness', 'api', 'specs', `${feature}.spec.md`),
    contractMarkdown: join(artifacts, `${feature}.contract.md`),
    contractJson: join(artifacts, `${feature}.contract.json`),
    plan: join(artifacts, `${feature}.implementation-plan.md`),
    scenarios: join(artifacts, `${feature}.test-scenarios.md`),
    approvedContractMarkdown: join(approvals, `${feature}.contract.md`),
    approvedContractJson: join(approvals, `${feature}.contract.json`),
    approvedPlan: join(approvals, `${feature}.implementation-plan.md`),
    approvedScenarios: join(approvals, `${feature}.test-scenarios.md`),
    approval: join(approvals, `${feature}.approved.json`),
    test: join(root, 'tests', 'e2e', 'api', `${feature}.spec.ts`),
    realTest: join(root, 'tests', 'e2e', 'api-real', `${feature}.real.spec.ts`),
    realFixture: join(root, 'tests', 'e2e', 'api-real', 'real-api-fixture.ts'),
  }
}
