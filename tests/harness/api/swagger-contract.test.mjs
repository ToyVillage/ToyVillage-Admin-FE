import assert from 'node:assert/strict'
import test from 'node:test'
import { validateApiContract } from '../../../scripts/api-harness-lib.mjs'
import {
  compareContracts,
  readSwaggerOperations,
} from '../../../scripts/check-api-swagger.mjs'
import { createContractFromSwagger } from '../../../scripts/create-contract-from-swagger.mjs'

const commonError = {
  content: {
    'application/json': {
      schema: {
        properties: {
          message: { type: 'string' },
          status: { type: 'integer' },
        },
      },
    },
  },
}

const apiDocs = {
  security: [{ bearerAuth: [] }],
  paths: {
    '/work-log/{workLogId}': {
      patch: {
        operationId: 'updateWorkLog',
        parameters: [
          {
            in: 'path',
            name: 'workLogId',
            required: true,
            schema: { type: 'integer' },
          },
          {
            in: 'query',
            name: 'pageable',
            schema: { $ref: '#/components/schemas/Pageable' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WorkLogRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              '*/*': { schema: { $ref: '#/components/schemas/Message' } },
            },
          },
          403: { description: '권한 없음' },
          500: { description: '서버 오류', ...commonError },
        },
      },
    },
  },
  components: {
    schemas: {
      Pageable: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 0 },
          size: { type: 'integer', minimum: 1 },
          sort: { type: 'array', items: { type: 'string' } },
        },
      },
      WorkLogRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', maxLength: 50 },
          status: { type: 'string', enum: ['DRAFT', 'DONE'] },
          writtenAt: { type: ['string', 'null'], format: 'date-time' },
          answers: {
            type: 'array',
            items: {
              type: 'object',
              properties: { itemId: { type: 'integer' } },
            },
          },
        },
      },
      Message: { type: 'object', properties: { message: { type: 'string' } } },
    },
  },
}

const spec = {
  apiId: 'WORK_LOG_UPDATE',
  swagger: { method: 'PATCH', path: '/work-log/{id}', roles: ['ADMIN'] },
}

function create(overrides = {}) {
  return createContractFromSwagger({
    apiDocs,
    spec: { ...spec, ...overrides },
    swaggerUrl: 'https://api.example/v3/api-docs',
    checkedAt: '2026-10-12T00:00:00.000Z',
  })
}

test('Swagger operation 으로 검증을 통과하는 계약을 만든다', () => {
  const contract = create()

  assert.deepEqual(validateApiContract(contract), [])
  // path 변수 이름은 task spec 이 아니라 Swagger 경로를 따른다.
  assert.equal(contract.path, '/work-log/{workLogId}')
  assert.deepEqual(contract.authentication, {
    required: true,
    type: 'Bearer',
    roles: ['ADMIN'],
  })
  assert.deepEqual(
    contract.queryParameters.map(({ name }) => name),
    ['page', 'size', 'sort'],
  )

  const [title, status, writtenAt, answers] = contract.requestBody.fields
  assert.equal(title.required, true)
  assert.deepEqual(title.constraints, ['maxLength: 50'])
  assert.equal(status.type, 'enum')
  assert.deepEqual(status.allowedValues, ['DRAFT', 'DONE'])
  assert.equal(writtenAt.type, 'datetime')
  assert.equal(writtenAt.nullable, true)
  assert.equal(answers.type, 'array<object>')
  assert.deepEqual(
    answers.fields.map(({ name }) => name),
    ['itemId'],
  )

  assert.deepEqual(
    contract.responses.errors.map(({ status, noContent }) => [
      status,
      noContent,
    ]),
    [
      [403, true],
      [500, false],
    ],
  )
  assert.deepEqual(contract.source, {
    kind: 'swagger',
    swaggerUrl: 'https://api.example/v3/api-docs',
    operationId: 'updateWorkLog',
    method: 'PATCH',
    path: '/work-log/{workLogId}',
    checkedAt: '2026-10-12T00:00:00.000Z',
  })
})

test('만든 계약은 같은 Swagger 와 비교하면 차이가 없다', () => {
  const contract = create()
  const diffs = compareContracts(
    [
      {
        feature: 'work-log-update',
        method: contract.method,
        path: contract.path,
        status: contract.responses.success.map(({ status }) => status),
        query: contract.queryParameters.map(({ name }) => name),
        request: contract.requestBody.fields.map(({ name }) => name),
        response: contract.responses.success[0].body.fields.map(
          ({ name }) => name,
        ),
      },
    ],
    readSwaggerOperations(apiDocs),
  )
  assert.deepEqual(diffs, [])
})

test('역할은 추측하지 않는다 — task spec 에 없으면 검증에서 막힌다', () => {
  const errors = validateApiContract(
    create({ swagger: { ...spec.swagger, roles: [] } }),
  )
  assert.ok(errors.includes('authentication.roles: 인증 API는 접근 역할 필요'))
})

test('Swagger 에 없는 operation 이면 만들지 않는다', () => {
  assert.throws(
    () => create({ swagger: { ...spec.swagger, method: 'DELETE' } }),
    /Swagger 에 DELETE \/work-log\/\{id\} 가 없음/,
  )
})
