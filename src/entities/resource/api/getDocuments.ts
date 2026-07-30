import { api } from '@/shared/api/axios'
import { documentTypeToFileType } from '../model/types'
import type { FileType, Resource } from '../model/types'

export type DocumentOrderDirection = 'ASC' | 'DESC'

// DOCUMENTS_QUERY_ALL (GET /documents) 요청 파라미터.
export interface DocumentsQueryAllRequest {
  page: number
  size: number
  keyword?: string
  orderDirection?: DocumentOrderDirection
}

interface DocumentQueryAllRuntimeItem {
  id: number | string
  title: string
  type?: unknown
  createdAt?: unknown
}

export interface DocumentQueryRequest {
  id: number
}

interface DocumentQueryRuntimeFile {
  fileName: string
  fileKey: string
}

interface DocumentQueryRuntimeItem extends DocumentQueryAllRuntimeItem {
  files?: DocumentQueryRuntimeFile[]
}

// 서버 사이드 페이지네이션. 해당 page(0부터)의 자료 한 페이지를 조회한다.
export async function getDocuments(
  params: DocumentsQueryAllRequest,
): Promise<Resource[]> {
  const { data } = await api.get<unknown>('/documents', { params })

  if (!isDocumentsQueryAllResponse(data)) {
    throw new Error('자료 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.map(toResource)
}

// DOCUMENTS_QUERY (GET /documents/{id}) — id로 자료 상세 조회.
export async function getDocument({ id }: DocumentQueryRequest): Promise<Resource> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('자료 ID가 올바르지 않습니다.')
  }

  const { data } = await api.get<unknown>(`/documents/${id}`)

  if (!isDocumentQueryResponse(data)) {
    throw new Error('자료 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    id: String(data.id),
    fileType: toFileType(data.type),
    title: data.title,
    date: toDisplayDate(data.createdAt),
    attachments: data.files?.map(({ fileName }) => fileName),
    attachmentFiles: data.files?.map(({ fileName, fileKey }) => ({
      fileName,
      fileKey,
    })),
  }
}

function toResource(item: DocumentQueryAllRuntimeItem): Resource {
  return {
    id: String(item.id),
    fileType: toFileType(item.type),
    title: item.title,
    date: toDisplayDate(item.createdAt),
  }
}

function toFileType(value: unknown): FileType {
  if (typeof value === 'string' && value in documentTypeToFileType) {
    return documentTypeToFileType[value as keyof typeof documentTypeToFileType]
  }
  return 'etc'
}

function toDisplayDate(value: unknown): string {
  if (typeof value !== 'string' || value.length < 10) return ''
  return value.slice(0, 10).replace(/-/g, '.')
}

function isDocumentsQueryAllResponse(
  value: unknown,
): value is DocumentQueryAllRuntimeItem[] {
  return Array.isArray(value) && value.every(isDocumentsQueryAllItem)
}

function isDocumentsQueryAllItem(
  value: unknown,
): value is DocumentQueryAllRuntimeItem {
  if (typeof value !== 'object' || value === null) return false

  const item = value as Record<string, unknown>
  const hasValidId =
    (typeof item.id === 'number' && Number.isFinite(item.id)) ||
    (typeof item.id === 'string' && item.id.trim().length > 0)

  return (
    hasValidId &&
    typeof item.title === 'string' &&
    item.title.trim().length > 0
  )
}

function isDocumentQueryResponse(
  value: unknown,
): value is DocumentQueryRuntimeItem {
  if (!isDocumentsQueryAllItem(value)) return false

  const { files } = value as { files?: unknown }
  return (
    files === undefined ||
    (Array.isArray(files) && files.every(isDocumentQueryFile))
  )
}

function isDocumentQueryFile(value: unknown): value is DocumentQueryRuntimeFile {
  if (typeof value !== 'object' || value === null) return false

  const file = value as Record<string, unknown>
  return typeof file.fileName === 'string' && typeof file.fileKey === 'string'
}
