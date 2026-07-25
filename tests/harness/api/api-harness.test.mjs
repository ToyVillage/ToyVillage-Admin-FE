import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { approveApi } from '../../../scripts/approve-api.mjs'
import { checkApiGate } from '../../../scripts/api-gate-check.mjs'
import {
  parseTaskSpec,
  validateApiContract,
} from '../../../scripts/api-harness-lib.mjs'
import { checkApiPolicy } from '../../../scripts/check-api-policy.mjs'

function field(overrides = {}) {
  return {
    name: 'Authorization',
    location: 'HEADER',
    type: 'string',
    required: true,
    nullable: false,
    default: null,
    example: 'Bearer token',
    description: 'JWT access token',
    constraints: [],
    ...overrides,
  }
}

function response(status, { noContent = false } = {}) {
  return {
    status,
    description: 'response',
    noContent,
    body: noContent
      ? null
      : {
          type: 'object',
          nullable: false,
          description: 'response body',
          fields: [
            field({
              name: 'message',
              location: 'RESPONSE',
              example: 'ok',
              description: 'message',
            }),
          ],
        },
  }
}

function validContract() {
  const authentication = { required: true, type: 'Bearer', roles: ['ADMIN'] }
  return {
    apiId: 'NOTICE_CREATE',
    name: '공지 생성',
    description: '',
    method: 'POST',
    path: '/notices',
    authentication,
    contentType: 'application/json',
    headers: [field()],
    pathParameters: [],
    queryParameters: [],
    requestBody: {
      required: true,
      fields: [
        field({
          name: 'kind',
          location: 'BODY',
          type: 'enum',
          example: 'NOTICE',
          description: '공지 분류',
          allowedValues: ['NOTICE'],
        }),
      ],
      example: { kind: 'NOTICE' },
    },
    responses: {
      success: [response(201)],
      errors: [response(400)],
    },
    source: {
      notionDatabase: 'notion://api-database',
      notionDataSource: 'notion://api-data-source',
      resolvedNotionPage: 'https://notion.so/notice-create',
      requestedNotionPage: null,
      checkedAt: '2026-07-25T00:00:00.000Z',
      apiIdMatchCount: 1,
      databaseValues: {
        apiId: 'NOTICE_CREATE',
        method: 'POST',
        path: '/notices',
        authentication,
      },
      detailValues: {
        apiId: 'NOTICE_CREATE',
        method: 'POST',
        path: '/notices',
        authentication,
      },
    },
  }
}

function clone(value) {
  return structuredClone(value)
}

test('valid Contract and explicit 204 No Content pass', () => {
  const contract = validContract()
  contract.responses.success = [response(204, { noContent: true })]
  assert.deepEqual(validateApiContract(contract), [])
})

test('API ID missing or duplicate match fails', () => {
  const missing = validContract()
  missing.apiId = ''
  assert.match(validateApiContract(missing).join('\n'), /apiId/)

  const duplicate = validContract()
  duplicate.source.apiIdMatchCount = 2
  assert.match(validateApiContract(duplicate).join('\n'), /정확히 1/)
})

test('full path, authentication, nullable, enum, and success response are enforced', () => {
  const cases = [
    [
      (contract) => {
        contract.path = '/notices?page=1'
      },
      /Query String/,
    ],
    [
      (contract) => {
        delete contract.authentication.required
      },
      /authentication.required/,
    ],
    [
      (contract) => {
        delete contract.requestBody.fields[0].nullable
      },
      /nullable/,
    ],
    [
      (contract) => {
        delete contract.requestBody.fields[0].allowedValues
      },
      /allowedValues/,
    ],
    [
      (contract) => {
        contract.responses.success = []
      },
      /responses.success/,
    ],
  ]

  for (const [mutate, expected] of cases) {
    const contract = clone(validContract())
    mutate(contract)
    assert.match(validateApiContract(contract).join('\n'), expected)
  }
})

test('database and detail page mismatch fails', () => {
  const contract = validContract()
  contract.source.detailValues.path = '/other'
  assert.match(
    validateApiContract(contract).join('\n'),
    /database\/detail path 불일치/,
  )
})

function write(path, contents) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents)
}

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), 'api-harness-'))
  const feature = 'create-notice'
  const artifacts = join(root, 'harness', 'artifacts', 'api')
  write(
    join(root, 'harness', 'api', 'specs', `${feature}.spec.md`),
    `---
feature: ${feature}
api_id: NOTICE_CREATE
target_page: src/pages/notice
notion_page:
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  allowed_methods: []
---
`,
  )
  write(join(artifacts, `${feature}.contract.md`), '# Contract\n')
  write(
    join(artifacts, `${feature}.contract.json`),
    `${JSON.stringify(validContract())}\n`,
  )
  write(join(artifacts, `${feature}.implementation-plan.md`), '# Plan\n')
  write(join(artifacts, `${feature}.test-scenarios.md`), '# Scenarios\n')
  return { root, feature }
}

test('approval hashes pass and changed approval source fails the gate', () => {
  const { root, feature } = fixtureRoot()
  approveApi({ root, feature, approvedBy: 'developer' })
  assert.deepEqual(checkApiGate({ root, feature }), [])

  const plan = join(
    root,
    'harness',
    'artifacts',
    'api',
    `${feature}.implementation-plan.md`,
  )
  writeFileSync(plan, `${readFileSync(plan, 'utf8')}changed\n`)
  assert.match(
    checkApiGate({ root, feature }).join('\n'),
    /runtime implementation plan/,
  )
})

test('API policy checks only explicit source files', () => {
  const root = mkdtempSync(join(tmpdir(), 'api-policy-'))
  write(
    join(root, 'src', 'safe.ts'),
    "import { api } from './api'\nexport const load = () => api.get('/x')\n",
  )
  write(
    join(root, 'src', 'unsafe.ts'),
    "import axios from 'axios'\naxios.create({})\n",
  )

  assert.deepEqual(checkApiPolicy({ root, files: ['src/safe.ts'] }), [])
  assert.match(
    checkApiPolicy({ root, files: ['src/unsafe.ts'] }).join('\n'),
    /새 axios 인스턴스/,
  )
})

test('task spec parser preserves real server restrictions', () => {
  const root = mkdtempSync(join(tmpdir(), 'api-spec-'))
  const spec = join(root, 'feature.spec.md')
  write(
    spec,
    `---
feature: feature
api_id: FEATURE_GET
target_page: src/pages/feature
requires_functional_test: true
real_server:
  enabled: true
  environment: production
  allowed_methods: [GET, POST]
---
`,
  )

  assert.deepEqual(parseTaskSpec(spec).realServer, {
    enabled: true,
    environment: 'production',
    allowedMethods: ['GET', 'POST'],
  })
})
