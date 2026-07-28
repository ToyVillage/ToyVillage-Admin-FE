import { api } from '@/shared/api/axios'
import type { NoticeListItem } from '../model/types'
import type { NoticeQueryAllRequest } from './types'

interface NoticeQueryAllRuntimeItem {
  id: number | string
  title: string
  kind?: unknown
  createAt?: unknown
}

export async function getNotices(
  params: NoticeQueryAllRequest,
): Promise<NoticeListItem[]> {
  const { data } = await api.get<unknown>('/notice', { params })

  if (!isNoticeQueryAllResponse(data)) {
    throw new Error('공지사항 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.map((notice) => ({
    id: String(notice.id),
    category:
      typeof notice.kind === 'string' && notice.kind.trim()
        ? notice.kind
        : '미분류',
    title: notice.title,
    date: typeof notice.createAt === 'string' ? notice.createAt : '',
  }))
}

function isNoticeQueryAllResponse(
  value: unknown,
): value is NoticeQueryAllRuntimeItem[] {
  return Array.isArray(value) && value.every(isNoticeQueryAllResponseItem)
}

function isNoticeQueryAllResponseItem(
  value: unknown,
): value is NoticeQueryAllRuntimeItem {
  if (typeof value !== 'object' || value === null) return false

  const notice = value as Record<string, unknown>
  const hasValidId =
    (typeof notice.id === 'number' && Number.isFinite(notice.id)) ||
    (typeof notice.id === 'string' && notice.id.trim().length > 0)

  return (
    hasValidId &&
    typeof notice.title === 'string' &&
    notice.title.trim().length > 0
  )
}
