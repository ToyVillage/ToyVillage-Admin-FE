import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { validateApiContract } from '../../../scripts/api-harness-lib.mjs'
import {
  compareContracts,
  readSwaggerOperations,
} from '../../../scripts/check-api-swagger.mjs'
import { extractSwaggerSource } from '../../../scripts/fetch-swagger-source.mjs'

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

function extract(method = 'PATCH', path = '/work-log/{id}') {
  return extractSwaggerSource({
    apiDocs,
    method,
    path,
    swaggerUrl: 'https://api.example/v3/api-docs',
    checkedAt: '2026-10-12T00:00:00.000Z',
  })
}

test('Notion 의 Method·Path 로 Swagger operation 을 계약 필드 모양으로 뽑는다', () => {
  const source = extract()

  // path 변수 이름이 Notion(`{id}`)과 달라도 찾고, Swagger 경로를 출처에 남긴다.
  assert.deepEqual(source.source, {
    swaggerUrl: 'https://api.example/v3/api-docs',
    operationId: 'updateWorkLog',
    method: 'PATCH',
    path: '/work-log/{workLogId}',
    checkedAt: '2026-10-12T00:00:00.000Z',
  })
  assert.equal(source.authenticated, true)
  assert.deepEqual(
    source.queryParameters.map(({ name }) => name),
    ['page', 'size', 'sort'],
  )

  const [title, status, writtenAt, answers] = source.requestBody.fields
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
    source.responses.errors.map(({ status, noContent }) => [status, noContent]),
    [
      [403, true],
      [500, false],
    ],
  )
})

test('뽑은 값을 계약으로 쓰면 같은 Swagger 와 비교해 차이가 없다', () => {
  const source = extract()
  const diffs = compareContracts(
    [
      {
        feature: 'work-log-update',
        method: source.source.method,
        path: source.source.path,
        status: source.responses.success.map(({ status }) => status),
        query: source.queryParameters.map(({ name }) => name),
        request: source.requestBody.fields.map(({ name }) => name),
        response: source.responses.success[0].body.fields.map(
          ({ name }) => name,
        ),
      },
    ],
    readSwaggerOperations(apiDocs),
  )
  assert.deepEqual(diffs, [])
})

test('Swagger 에 없는 Method·Path 면 STOP 한다', () => {
  assert.throws(
    () => extract('DELETE'),
    /Swagger 에 DELETE \/work-log\/\{id\} 가 없음/,
  )
})

test('계약 source.swagger 는 선택이고, 있으면 Method·Path 가 계약과 맞아야 한다', () => {
  const contract = JSON.parse(
    readFileSync(
      new URL(
        '../../../harness/api/approvals/task-query.contract.json',
        import.meta.url,
      ),
      'utf8',
    ),
  )
  assert.deepEqual(validateApiContract(contract), [])

  const swagger = {
    swaggerUrl: 'https://api.example/v3/api-docs',
    operationId: 'getDetail',
    method: 'GET',
    path: '/tasks/{taskId}',
    checkedAt: '2026-10-12T00:00:00.000Z',
  }
  assert.deepEqual(
    validateApiContract({
      ...contract,
      source: { ...contract.source, swagger },
    }),
    [],
  )
  // 2026-09 공지 계약처럼 출처만 남긴 형식도 받는다.
  assert.deepEqual(
    validateApiContract({
      ...contract,
      source: {
        ...contract.source,
        swagger: {
          swaggerUrl: swagger.swaggerUrl,
          checkedAt: swagger.checkedAt,
          note: 'Swagger 채택',
        },
      },
    }),
    [],
  )
  assert.deepEqual(
    validateApiContract({
      ...contract,
      source: {
        ...contract.source,
        swagger: { ...swagger, path: '/tasks', checkedAt: 'x' },
      },
    }),
    [
      'source.swagger.checkedAt: ISO date 형식 필요',
      'source.swagger path와 contract path 불일치',
    ],
  )
})
