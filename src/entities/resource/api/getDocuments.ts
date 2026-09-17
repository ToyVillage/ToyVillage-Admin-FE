import { api } from '@/shared/api/axios'
import { documentTypeToFileType } from '../model/types'
import type { DocumentType, FileType, Resource } from '../model/types'

export type DocumentOrderDirection = 'ASC' | 'DESC'

// DOCUMENTS_QUERY_ALL (GET /documents) 요청 파라미터.
export interface DocumentsQueryAllRequest {
  page: number
  size: number
  keyword?: string
  orderDirection?: DocumentOrderDirection
  // 자료 타입 필터. 선택된 타입에 해당하는 자료만 조회된다(미지정이면 전체).
  types?: DocumentType[]
}

// DOCUMENTS_QUERY_ALL 응답: 자료 한 페이지 + 전체 페이지 수.
export interface DocumentsPage {
  resources: Resource[]
  totalPageSize: number
}

interface DocumentQueryAllRuntimeItem {
  id: number | string
  title: string
  type?: unknown
  createdAt?: unknown
}

interface DocumentsQueryAllRuntimeResponse {
  documents: DocumentQueryAllRuntimeItem[]
  totalPageSize: number
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

// 서버 사이드 페이지네이션. 해당 page(0부터)의 자료 한 페이지와 전체 페이지 수를 조회한다.
export async function getDocuments(
  params: DocumentsQueryAllRequest,
): Promise<DocumentsPage> {
  const { data } = await api.get<unknown>('/documents', {
    params,
    // types 는 배열이지만 `types[]=` 가 아니라 `types=PDF&types=PNG` 로 보내야 한다.
    paramsSerializer: { indexes: null },
  })

  if (!isDocumentsQueryAllResponse(data)) {
    throw new Error('자료 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    resources: data.documents.map(toResource),
    totalPageSize: data.totalPageSize,
  }
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
): value is DocumentsQueryAllRuntimeResponse {
  if (typeof value !== 'object' || value === null) return false

  const { documents, totalPageSize } = value as Record<string, unknown>
  return (
    Array.isArray(documents) &&
    documents.every(isDocumentsQueryAllItem) &&
    // 전체 페이지 수는 0 이상의 정수다. 음수·소수는 페이지 번호 계산을 망가뜨린다.
    typeof totalPageSize === 'number' &&
    Number.isInteger(totalPageSize) &&
    totalPageSize >= 0
  )
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
