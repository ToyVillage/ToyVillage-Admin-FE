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
  createdAt?: unknown
}

interface NoticeQueryAllRuntimeResponse {
  notices: NoticeQueryAllRuntimeItem[]
  totalPageSize: number
}

export interface NoticePage {
  notices: NoticeListItem[]
  totalPageSize: number
}

interface NoticeQueryRuntimeItem extends NoticeQueryAllRuntimeItem {
  content: string
  createdAt?: string
  files?: NoticeQueryRuntimeFile[]
}

interface NoticeQueryRuntimeFile {
  fileName: string
  fileKey: string
}

export async function createNotice(
  input: NoticeCreateRequest,
): Promise<NoticeCreateResponse> {
  const { status } = await api.post<NoticeCreateResponse>('/notice', input)

  if (status !== 200 && status !== 201) {
    throw new Error('공지사항 생성 응답 상태가 올바르지 않습니다.')
  }
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

// NOTICE_QUERY_ALL — page 는 1부터 시작한다(2026-09-17 사용자 결정).
export async function getNotices(
  params: NoticeQueryAllRequest,
): Promise<NoticePage> {
  const { data } = await api.get<unknown>('/notice', { params })

  if (!isNoticeQueryAllResponse(data)) {
    throw new Error('공지사항 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    notices: data.notices.map((notice) => ({
      id: String(notice.id),
      category: normalizeNoticeCategory(notice.kind),
      title: notice.title,
      date: typeof notice.createdAt === 'string' ? notice.createdAt : '',
    })),
    totalPageSize: data.totalPageSize,
  }
}

export async function getAllNotices({
  size,
}: Pick<NoticeQueryAllRequest, 'size'>): Promise<NoticeListItem[]> {
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error('공지사항 페이지 크기가 올바르지 않습니다.')
  }

  const allNotices: NoticeListItem[] = []
  const noticeIds = new Set<string>()

  // 분류 탭·검색·정렬이 전체 목록 기준이라 totalPageSize 까지 모두 읽어 합친다.
  let totalPageSize = 1
  for (let page = 1; page <= totalPageSize; page += 1) {
    const response = await getNotices({ page, size })
    const { notices } = response
    totalPageSize = response.totalPageSize

    if (notices.length > size) {
      throw new Error('공지사항 페이지 응답 크기가 올바르지 않습니다.')
    }

    for (const notice of notices) {
      if (noticeIds.has(notice.id)) {
        throw new Error('공지사항 페이지 응답에 중복 항목이 있습니다.')
      }

      noticeIds.add(notice.id)
      allNotices.push(notice)
    }
  }

  return allNotices
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
    date: data.createdAt ?? '',
    attachments: data.files?.map(({ fileName }) => fileName),
    attachmentFiles: data.files?.map(({ fileName, fileKey }) => ({
      fileName,
      fileKey,
    })),
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
): value is NoticeQueryAllRuntimeResponse {
  if (typeof value !== 'object' || value === null) return false

  const response = value as Record<string, unknown>
  return (
    Array.isArray(response.notices) &&
    response.notices.every(isNoticeQueryAllResponseItem) &&
    Number.isSafeInteger(response.totalPageSize) &&
    Number(response.totalPageSize) >= 0
  )
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
    isNoticeQueryAllResponseItem(notice) &&
    typeof notice.content === 'string' &&
    (notice.createdAt === undefined || typeof notice.createdAt === 'string') &&
    (notice.files === undefined ||
      (Array.isArray(notice.files) &&
        notice.files.every(isNoticeQueryFileResponse)))
  )
}

function isNoticeQueryFileResponse(
  value: unknown,
): value is NoticeQueryRuntimeFile {
  if (typeof value !== 'object' || value === null) return false

  const file = value as Record<string, unknown>
  return typeof file.fileName === 'string' && typeof file.fileKey === 'string'
}

function isNoticeMessageResponse(
  value: unknown,
): value is NoticeUpdateResponse | NoticeDeleteResponse {
  if (typeof value !== 'object' || value === null) return false

  return typeof (value as Record<string, unknown>).message === 'string'
}
