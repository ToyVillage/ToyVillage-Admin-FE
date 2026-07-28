import { api } from '@/shared/api/axios'
import type { Notice, NoticeListItem } from '../model/types'
import type {
  NoticeCreateRequest,
  NoticeCreateResponse,
  NoticeDeleteRequest,
  NoticeDeleteResponse,
  NoticeQueryAllRequest,
  NoticeQueryRequest,
  NoticeUpdateRequest,
  NoticeUpdateResponse,
} from './types'

interface NoticeQueryAllRuntimeItem {
  id: number | string
  title: string
  kind?: unknown
  createAt?: unknown
}

interface NoticeQueryRuntimeItem extends NoticeQueryAllRuntimeItem {
  content: string
}

export async function createNotice(
  input: NoticeCreateRequest,
): Promise<NoticeCreateResponse> {
  const { data } = await api.post<unknown>('/notice', input)

  if (!isNoticeMessageResponse(data)) {
    throw new Error('공지사항 생성 응답 형식이 올바르지 않습니다.')
  }

  return data
}

export async function updateNotice({
  id,
  input,
}: {
  id: number
  input: NoticeUpdateRequest
}): Promise<NoticeUpdateResponse> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('공지사항 ID가 올바르지 않습니다.')
  }

  const { data } = await api.put<unknown>(`/notice/${id}`, input)

  if (!isNoticeMessageResponse(data)) {
    throw new Error('공지사항 수정 응답 형식이 올바르지 않습니다.')
  }

  return data
}

export async function deleteNotice({
  id,
}: NoticeDeleteRequest): Promise<NoticeDeleteResponse> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('공지사항 ID가 올바르지 않습니다.')
  }

  const { data } = await api.delete<unknown>(`/notice/${id}`)

  if (!isNoticeMessageResponse(data)) {
    throw new Error('공지사항 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
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
    category: normalizeNoticeCategory(notice.kind),
    title: notice.title,
    date: typeof notice.createAt === 'string' ? notice.createAt : '',
  }))
}

export async function getNotice({ id }: NoticeQueryRequest): Promise<Notice> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('공지사항 ID가 올바르지 않습니다.')
  }

  const { data } = await api.get<unknown>(`/notice/${id}`)

  if (!isNoticeQueryResponse(data)) {
    throw new Error('공지사항 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    id: String(data.id),
    category: normalizeNoticeCategory(data.kind),
    title: data.title,
    content: data.content,
    date: typeof data.createAt === 'string' ? data.createAt : '',
  }
}

export function isNoticeNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false

  const response = (error as { response?: unknown }).response
  if (typeof response !== 'object' || response === null) return false

  return (response as { status?: unknown }).status === 404
}

function normalizeNoticeCategory(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return '미분류'

  return value.trim().toUpperCase() === 'ALL' ? '전체' : value
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

function isNoticeQueryResponse(
  value: unknown,
): value is NoticeQueryRuntimeItem {
  if (typeof value !== 'object' || value === null) return false

  const notice = value as Record<string, unknown>

  return (
    isNoticeQueryAllResponseItem(notice) && typeof notice.content === 'string'
  )
}

function isNoticeMessageResponse(
  value: unknown,
): value is NoticeCreateResponse | NoticeUpdateResponse | NoticeDeleteResponse {
  if (typeof value !== 'object' || value === null) return false

  return typeof (value as Record<string, unknown>).message === 'string'
}
