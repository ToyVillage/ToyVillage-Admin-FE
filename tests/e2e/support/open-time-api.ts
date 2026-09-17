import type { Page, Route } from '@playwright/test'

// 날짜별 영업시간 화면이 쓰는 API mock.
// 대상: GET /open-time/date?date=, POST /open-time, PUT /open-time/{id}.
// 실제 서버는 호출하지 않는다. 저장은 mock 에 반영해 재조회 결과가 바뀐다.

export const openTimeByDatePattern =
  /^https:\/\/[^/]+\/open-time\/date(?:\?.*)?$/
export const openTimeCreatePattern = /^https:\/\/[^/]+\/open-time(?:\?.*)?$/
export const openTimeUpdatePattern =
  /^https:\/\/[^/]+\/open-time\/(\d+)(?:\?.*)?$/

interface StoredOpenTime {
  id: number
  startOpenTime: string
  endOpenTime: string
}

export interface OpenTimeApiOptions {
  /** 저장·수정 응답 상태. 201 이 아니면 mock 을 바꾸지 않는다. */
  saveStatus?: number
  onSave?: (method: string, body: unknown) => void
}

export async function mockOpenTimeApi(
  page: Page,
  { saveStatus = 201, onSave }: OpenTimeApiOptions = {},
) {
  const store = new Map<string, StoredOpenTime>()
  let nextId = 1

  // 휴관일 관리 화면(뒤로가기·저장 후 이동)과 영업시간 제목 아래 휴관 요약 조회.
  await page.route(/^https:\/\/[^/]+\/close-day(?:\?.*)?$/, async (route) => {
    await json(route, 200, [])
  })

  await page.route(openTimeByDatePattern, async (route) => {
    const date = new URL(route.request().url()).searchParams.get('date') ?? ''
    const stored = store.get(date)
    await json(route, 200, [
      stored
        ? { id: stored.id, openDate: date, ...pick(stored) }
        : {
            id: null,
            openDate: date,
            startOpenTime: '07:40:00',
            endOpenTime: '19:40:00',
          },
    ])
  })

  await page.route(openTimeCreatePattern, async (route) => {
    const body = route.request().postDataJSON() as {
      openDate: string
      startOpenTime: string
      endOpenTime: string
    }
    onSave?.('POST', body)
    if (saveStatus !== 201) {
      await json(route, saveStatus, { message: '저장 실패' })
      return
    }
    store.set(body.openDate, {
      id: nextId++,
      startOpenTime: body.startOpenTime,
      endOpenTime: body.endOpenTime,
    })
    await json(route, 201, { message: '운영시간이 생성되었습니다.' })
  })

  await page.route(openTimeUpdatePattern, async (route) => {
    const body = route.request().postDataJSON() as {
      openDate: string
      startOpenTime: string
      endOpenTime: string
    }
    onSave?.('PUT', body)
    if (saveStatus !== 201) {
      await json(route, saveStatus, { message: '저장 실패' })
      return
    }
    const id = Number(openTimeUpdatePattern.exec(route.request().url())?.[1])
    store.set(body.openDate, {
      id,
      startOpenTime: `${body.startOpenTime}:00`,
      endOpenTime: `${body.endOpenTime}:00`,
    })
    await json(route, 201, { message: '운영시간이 수정되었습니다.' })
  })
}

function pick({ startOpenTime, endOpenTime }: StoredOpenTime) {
  return { startOpenTime, endOpenTime }
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
