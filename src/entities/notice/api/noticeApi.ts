import { api } from '@/shared/api/axios'
import type { NoticeListItem } from '../model/types'
import type { NoticeQueryAllRequest, NoticeQueryAllResponse } from './types'

export async function getNotices(
  params: NoticeQueryAllRequest,
): Promise<NoticeListItem[]> {
  const { data } = await api.get<NoticeQueryAllResponse>('/notice', { params })

  return data.map((notice) => ({
    id: String(notice.id),
    category: notice.kind,
    title: notice.title,
    date: notice.createAt,
  }))
}
