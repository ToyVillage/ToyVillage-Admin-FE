import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  classifyDiffs,
  compareContracts,
  normalizePath,
  readContracts,
  readSwaggerOperations,
} from '../../../scripts/check-api-swagger.mjs'

function field(name, fields) {
  return { name, location: 'body', type: fields ? 'object' : 'string', fields }
}

function writeContract(root, feature, contract) {
  const dir = join(root, 'harness', 'api', 'approvals')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${feature}.contract.json`), JSON.stringify(contract))
}

const apiDocs = {
  paths: {
    '/tasks/{taskId}': {
      get: {
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskResponse' },
              },
            },
          },
        },
      },
    },
    '/tasks': {
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { title: {}, priority: {} },
              },
            },
          },
        },
        responses: { 200: { content: {} } },
      },
      get: {
        parameters: [
          { in: 'query', name: 'pageable', schema: { type: 'object' } },
          {
            in: 'query',
            name: 'condition',
            schema: { type: 'object', properties: { status: {} } },
          },
        ],
        responses: { 200: {} },
      },
    },
  },
  components: {
    schemas: {
      TaskResponse: {
        type: 'object',
        properties: {
          title: {},
          assignees: {
            type: 'array',
            items: { $ref: '#/components/schemas/Assignee' },
          },
          extra: {},
        },
      },
      Assignee: { type: 'object', properties: { id: {}, name: {} } },
    },
  },
}

test('path 변수 이름이 달라도 같은 경로로 본다', () => {
  assert.equal(normalizePath('/tasks/{id}'), normalizePath('/tasks/{taskId}'))
  assert.equal(normalizePath('/tasks/:id/'), '/tasks/{}')
  assert.equal(normalizePath('/close-day?date=x'), '/close-day')
})

test('Swagger 쿼리는 Pageable·ModelAttribute 객체를 실제 이름으로 펼친다', () => {
  const operation = readSwaggerOperations(apiDocs).get('GET /tasks')
  assert.deepEqual(operation.query.sort(), ['page', 'size', 'sort', 'status'])
})

test('계약과 Swagger 의 차이를 항목별로 찾는다', () => {
  const root = mkdtempSync(join(tmpdir(), 'swagger-check-'))
  writeContract(root, 'task-query', {
    method: 'GET',
    path: '/tasks/{id}',
    queryParameters: [],
    requestBody: null,
    responses: {
      success: [
        {
          status: 200,
          body: { fields: [field('title'), field('assignees', [field('id')])] },
        },
      ],
    },
  })
  writeContract(root, 'task-create', {
    method: 'POST',
    path: '/tasks',
    queryParameters: [],
    requestBody: { fields: [field('title'), field('content')] },
    responses: { success: [{ status: 201, body: { fields: [] } }] },
  })
  writeContract(root, 'task-delete', {
    method: 'DELETE',
    path: '/tasks/{id}',
    queryParameters: [],
    requestBody: null,
    responses: { success: [{ status: 200, noContent: false }] },
  })

  const diffs = compareContracts(
    readContracts(root),
    readSwaggerOperations(apiDocs),
  )

  assert.deepEqual(diffs, [
    {
      feature: 'task-create',
      kind: 'status',
      contract: [201],
      swagger: [200],
    },
    {
      feature: 'task-create',
      kind: 'request',
      contract: ['content'],
      swagger: ['priority'],
    },
    {
      feature: 'task-delete',
      kind: 'operation',
      contract: ['DELETE /tasks/{id}'],
      swagger: [],
    },
    {
      // Swagger 쪽 assignees.name 같은 중첩 필드는 계약이 펼친 부모라도 최상위만 비교한다.
      feature: 'task-query',
      kind: 'response',
      contract: [],
      swagger: ['extra'],
    },
  ])
})

test('알려진 차이는 실패에서 빼고, 사라진 알려진 차이는 따로 알린다', () => {
  const status = {
    feature: 'task-create',
    kind: 'status',
    contract: [201],
    swagger: [200],
  }
  const query = { feature: 'a', kind: 'query', contract: ['x'], swagger: [] }
  const resolved = {
    feature: 'b',
    kind: 'status',
    contract: [200],
    swagger: [204],
    reason: '공지 삭제',
  }

  const result = classifyDiffs(
    [status, query],
    [{ ...status, reason: '실서버 201' }, resolved],
  )

  assert.deepEqual(result.newDiffs, [query])
  assert.deepEqual(result.knownDiffs, [{ ...status, reason: '실서버 201' }])
  assert.deepEqual(result.resolvedDiffs, [resolved])
})
