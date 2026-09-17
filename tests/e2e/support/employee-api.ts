import type { Page } from '@playwright/test'

// 직원 계정 생성 API(`POST /app/admin/employees`) 가짜 서버.
// 실제 서버는 호출하지 않으며, 그 밖의 https 요청은 abort 한다.

export const employeeCreatePattern =
  /^https:\/\/[^/]+\/app\/admin\/employees(?:\?.*)?$/

export interface EmployeeCreateRequest {
  body: unknown
  authorization: string | undefined
}

export interface EmployeeApiOptions {
  /** 기본 201 `{ message }`. */
  status?: number
  body?: unknown
  /** 응답 전 대기(ms). 중복 제출 확인용. */
  delay?: number
}

export interface EmployeeApiHandle {
  requests: EmployeeCreateRequest[]
}

export function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-08-10T22:30:00.000000',
    description: message,
  }
}

export async function mockEmployeeApi(
  page: Page,
  { status = 201, body, delay = 0 }: EmployeeApiOptions = {},
): Promise<EmployeeApiHandle> {
  const handle: EmployeeApiHandle = { requests: [] }

  await page.route(/^https:\/\//, (route) => route.abort())
  await page.route(employeeCreatePattern, async (route) => {
    const request = route.request()
    if (request.method() !== 'POST') return route.abort()

    handle.requests.push({
      body: request.postDataJSON(),
      authorization: request.headers().authorization,
    })
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))

    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body ?? { message: '직원이 생성되었습니다.' }),
    })
  })

  return handle
}
