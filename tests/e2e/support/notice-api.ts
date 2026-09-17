import type { Page, Route } from '@playwright/test'

// 공지사항 화면(목록·상세·수정)이 쓰는 API mock.
// 대상: GET /notice, GET·PUT·DELETE /notice/{id}.
// 실제 서버는 호출하지 않는다. 삭제·수정은 mock 목록에 반영해 재조회 결과가 바뀐다.

export const noticeListPattern = /^https:\/\/[^/]+\/notice(?:\?.*)?$/
export const noticeItemPattern = /^https:\/\/[^/]+\/notice\/([^/?]+)(?:\?.*)?$/

export interface MockNotice {
  id: number
  title: string
  kind: string
  content: string
  /** YYYY-MM-DD */
  createAt: string
  files: { fileName: string; fileKey: string }[]
}

// 최신순: 1 → 6. 한 페이지 4건이라 2페이지는 5·6 이다.
export function createMockNotices(): MockNotice[] {
  return [
    notice(1, '7월 13일 휴관안내', 'ALL', '2026-07-06', [
      '당일 지침.pdf',
      '휴관안내.png',
      '휴관안내.jpg',
    ]),
    notice(2, '신규 프로그램 오픈 안내', '팀이름 1', '2026-07-05'),
    notice(3, '주차장 이용 변경 공지', 'ALL', '2026-07-04'),
    notice(4, '여름 운영시간 안내', '팀이름 2', '2026-07-03'),
    notice(5, '시설 점검 일정 공지', 'ALL', '2026-07-02'),
    notice(6, '사육사 교육 일정', '팀이름 1', '2026-07-01'),
  ]
}

interface NoticeApiOptions {
  notices?: MockNotice[]
  /** DELETE 응답 상태. 200 이 아니면 목록을 바꾸지 않는다. */
  deleteStatus?: number
  onDelete?: (id: number) => void
}

export async function mockNoticeApi(
  page: Page,
  {
    notices = createMockNotices(),
    deleteStatus = 200,
    onDelete,
  }: NoticeApiOptions = {},
) {
  const store = [...notices]

  await page.route(noticeListPattern, async (route) => {
    const url = new URL(route.request().url())
    // NOTICE_QUERY_ALL 은 page 가 1부터다.
    const pageNumber = Number(url.searchParams.get('page') ?? '1')
    const size = Number(url.searchParams.get('size') ?? '10')
    const notices = store
      .slice((pageNumber - 1) * size, pageNumber * size)
      .map(({ id, title, kind, createAt }) => ({
        id,
        title,
        kind,
        createdAt: createAt,
      }))
    await json(route, 200, {
      notices,
      totalPageSize: Math.ceil(store.length / size),
    })
  })

  await page.route(noticeItemPattern, async (route) => {
    const request = route.request()
    const id = Number(noticeItemPattern.exec(request.url())?.[1])
    const index = store.findIndex((item) => item.id === id)

    if (index < 0) {
      await json(route, 404, { message: '존재하지 않는 공지사항입니다.' })
      return
    }

    if (request.method() === 'DELETE') {
      onDelete?.(id)
      if (deleteStatus !== 200) {
        await json(route, deleteStatus, { message: '삭제 실패' })
        return
      }
      store.splice(index, 1)
      await json(route, 200, { message: '공지 삭제가 완료되었습니다.' })
      return
    }

    if (request.method() === 'PUT') {
      const body = request.postDataJSON() as { title: string; content: string }
      store[index] = {
        ...store[index],
        title: body.title,
        content: body.content,
      }
      await json(route, 200, { message: '공지 수정이 완료되었습니다.' })
      return
    }

    const { createAt, ...detail } = store[index]
    await json(route, 200, { ...detail, createdAt: createAt })
  })
}

function notice(
  id: number,
  title: string,
  kind: string,
  createAt: string,
  fileNames: string[] = [],
): MockNotice {
  return {
    id,
    title,
    kind,
    content: `그냥 더미 텍스트 입니다. (${title})`,
    createAt,
    files: fileNames.map((fileName, index) => ({
      fileName,
      fileKey: `notice-${id}-${index}`,
    })),
  }
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
