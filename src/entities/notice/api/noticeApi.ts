import { api } from '@/shared/api/axios'
import type { NoticeListItem } from '../model/types'
import type { NoticeQueryAllRequest, NoticeQueryAllResponseItem } from './types'

export async function getNotices(
  params: NoticeQueryAllRequest,
): Promise<NoticeListItem[]> {
  const { data } = await api.get<unknown>('/notice', { params })

  if (!isNoticeQueryAllResponse(data)) {
    throw new Error('공지사항 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.map((notice) => ({
    id: String(notice.id),
    category: notice.kind,
    title: notice.title,
    date: notice.createAt,
  }))
}

function isNoticeQueryAllResponse(
  value: unknown,
): value is NoticeQueryAllResponseItem[] {
  return Array.isArray(value) && value.every(isNoticeQueryAllResponseItem)
}

function isNoticeQueryAllResponseItem(
  value: unknown,
): value is NoticeQueryAllResponseItem {
  if (typeof value !== 'object' || value === null) return false

  const notice = value as Record<string, unknown>
  return (
    Number.isInteger(notice.id) &&
    typeof notice.title === 'string' &&
    notice.kind === '공지사항 분류' &&
    typeof notice.createAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(notice.createAt)
  )
}
