import type { Page, Route } from '@playwright/test'

// 휴관일 관리 화면(목록·수정)이 쓰는 API mock.
// 대상: GET /close-day, PUT·DELETE /close-day/{id}.
// 실제 서버는 호출하지 않는다. 삭제·수정은 mock 목록에 반영해 재조회 결과가 바뀐다.

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
  onDelete?: (id: number) => void
}

export async function mockCloseDayApi(
  page: Page,
  {
    closeDays = createMockCloseDays(),
    deleteStatus = 201,
    updateStatus = 200,
    onDelete,
  }: CloseDayApiOptions = {},
) {
  const store = [...closeDays]

  await page.route(closeDayListPattern, async (route) => {
    await json(route, 200, store)
  })

  await page.route(closeDayItemPattern, async (route) => {
    const request = route.request()
    const id = Number(closeDayItemPattern.exec(request.url())?.[1])
    const index = store.findIndex((item) => item.id === id)

    if (index < 0) {
      await json(route, 404, { message: '해당 휴관일을 찾을수없습니다.' })
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
      await json(route, 201, { message: '휴관일 삭제가 완료되었습니다.' })
      return
    }

    if (request.method() === 'PUT') {
      if (updateStatus !== 200) {
        await json(route, updateStatus, { message: '수정 실패' })
        return
      }
      const body = request.postDataJSON() as Omit<MockCloseDay, 'id'>
      store[index] = { id, ...body }
      await json(route, 200, { message: '휴관일 수정이 완료되었습니다.' })
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
