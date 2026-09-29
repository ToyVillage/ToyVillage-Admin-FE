import type { Page, Route } from '@playwright/test'

// 휴무일 관리 화면(목록·수정)이 쓰는 API mock.
// 대상: GET·POST /close-day, PUT·DELETE /close-day/{id}.
// 실제 서버는 호출하지 않는다. 생성·삭제·수정은 mock 목록에 반영해 재조회 결과가 바뀐다.

export const closeDayListPattern = /^https:\/\/[^/]+\/close-day(?:\?.*)?$/
export const closeDayItemPattern =
  /^https:\/\/[^/]+\/close-day\/([^/?]+)(?:\?.*)?$/

export interface MockCloseDay {
  id: number
  title: string
  /** YYYY-MM-DD */
  startCloseTime: string
  /** YYYY-MM-DD */
  endCloseTime: string
}

// 화면은 오늘이 속한 달을 먼저 보여 주므로 이번 달 날짜로 만든다.
export function thisMonthDate(day: number): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${String(day).padStart(2, '0')}`
}

export function createMockCloseDays(): MockCloseDay[] {
  return [
    {
      id: 1,
      title: '토이빌리지 동물 정기검진',
      startCloseTime: thisMonthDate(13),
      endCloseTime: thisMonthDate(14),
    },
    {
      id: 2,
      title: '시설 점검',
      startCloseTime: thisMonthDate(20),
      endCloseTime: thisMonthDate(20),
    },
  ]
}

interface CloseDayApiOptions {
  closeDays?: MockCloseDay[]
  /** DELETE 응답 상태. 201 이 아니면 목록을 바꾸지 않는다. */
  deleteStatus?: number
  /** PUT 응답 상태. 200 이 아니면 목록을 바꾸지 않는다. */
  updateStatus?: number
  /** POST 응답 상태. 200 이 아니면 목록을 바꾸지 않는다. */
  createStatus?: number
  onDelete?: (id: number) => void
  onCreate?: (body: Omit<MockCloseDay, 'id'>) => void
}

export async function mockCloseDayApi(
  page: Page,
  {
    closeDays = createMockCloseDays(),
    deleteStatus = 201,
    updateStatus = 200,
    createStatus = 200,
    onDelete,
    onCreate,
  }: CloseDayApiOptions = {},
) {
  const store = [...closeDays]

  await page.route(closeDayListPattern, async (route) => {
    const request = route.request()
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as Omit<MockCloseDay, 'id'>
      onCreate?.(body)
      if (createStatus !== 200) {
        await json(route, createStatus, { message: '생성 실패' })
        return
      }
      const id = Math.max(0, ...store.map((item) => item.id)) + 1
      store.push({ id, ...body })
      // CLOSE_DAT_CREATE 는 응답 본문을 쓰지 않고 200 으로 성공을 판단한다.
      await route.fulfill({ status: 200 })
      return
    }

    await json(route, 200, store)
  })

  await page.route(closeDayItemPattern, async (route) => {
    const request = route.request()
    const id = Number(closeDayItemPattern.exec(request.url())?.[1])
    const index = store.findIndex((item) => item.id === id)

    if (index < 0) {
      await json(route, 404, { message: '해당 휴무일을 찾을수없습니다.' })
      return
    }

    if (request.method() === 'DELETE') {
      onDelete?.(id)
      if (deleteStatus !== 201) {
        await json(route, deleteStatus, { message: '삭제 실패' })
        return
      }
      store.splice(index, 1)
      // CLOSE_DAT_DELETE 의 성공 status 는 201 이다.
      await json(route, 201, { message: '휴무일 삭제가 완료되었습니다.' })
      return
    }

    if (request.method() === 'PUT') {
      if (updateStatus !== 200) {
        await json(route, updateStatus, { message: '수정 실패' })
        return
      }
      const body = request.postDataJSON() as Omit<MockCloseDay, 'id'>
      store[index] = { id, ...body }
      await json(route, 200, { message: '휴무일 수정이 완료되었습니다.' })
      return
    }

    await route.fallback()
  })
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
