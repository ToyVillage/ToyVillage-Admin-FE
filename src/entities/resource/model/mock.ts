import type {
  CreateResourceInput,
  FileType,
  Resource,
  UpdateResourceInput,
} from './types'

export const resourceStorageKey = 'toyvillage:resources'
export const deletedResourceStorageKey = 'toyvillage:resources:deleted'

// 슬라이스용 mock. 추후 TanStack Query + Axios.
export const mockResources: Resource[] = [
  {
    id: '1',
    fileType: 'pdf',
    title: '근무지침요령 1',
    date: '2026.06.30',
    attachments: ['당일 지침.pdf', '휴관안내.png', '휴관안내.jpg'],
  },
  { id: '2', fileType: 'pdf', title: '근무안내서 1', date: '2026.06.28' },
  { id: '3', fileType: 'jpg', title: '근무 중 행동 요령', date: '2026.06.25' },
  { id: '4', fileType: 'png', title: '시설 안내도', date: '2026.06.20' },
  { id: '5', fileType: 'etc', title: '기타 참고자료.zip', date: '2026.06.18' },
]

// 파일 유형 탭(전체 포함)
export const fileTypeTabs = ['전체', 'pdf', 'jpg/jpeg', 'png', '기타'] as const

// 탭 라벨 → fileType (전체는 필터 안 함)
export const tabToFileType: Record<string, FileType | null> = {
  전체: null,
  pdf: 'pdf',
  'jpg/jpeg': 'jpg',
  png: 'png',
  기타: 'etc',
}

// fileType → 테이블 pill 라벨
export const fileTypeLabel: Record<FileType, string> = {
  pdf: 'pdf',
  jpg: 'jpg/jpeg',
  png: 'png',
  etc: '기타',
}

// 생성 페이지 분류 칩(전체 제외). tabToFileType 으로 FileType 매핑.
export const resourceCategories = fileTypeTabs.slice(1)

// 예외 모달(ErrorDialog) 경로 검증용 실패 주입 플래그. mock 은 항상 성공하므로,
// 이 localStorage 키에 'update' | 'delete' 를 넣으면 해당 요청이 한 번 실패한다.
// 실제 API 연동(/api) 시 제거한다.
export const resourceFailStorageKey = 'toyvillage:resources:fail'

function nextFailure(): string | null {
  const value = localStorage.getItem(resourceFailStorageKey)
  if (value) localStorage.removeItem(resourceFailStorageKey)
  return value
}

export async function getMockResources(): Promise<Resource[]> {
  const storedResources = readStoredResources()
  const storedById = new Map(
    storedResources.map((resource) => [resource.id, resource]),
  )
  const deletedIds = readDeletedResourceIds()
  const mergedMocks = mockResources
    .filter((resource) => !deletedIds.has(resource.id))
    .map((resource) => storedById.get(resource.id) ?? resource)
  const createdResources = storedResources.filter(
    (resource) =>
      !mockResources.some((mockResource) => mockResource.id === resource.id),
  )

  return [...createdResources, ...mergedMocks]
}

export async function getMockResource(id: string): Promise<Resource | null> {
  const resources = await getMockResources()
  return resources.find((resource) => resource.id === id) ?? null
}

export async function updateMockResource({
  id,
  input,
}: {
  id: string
  input: UpdateResourceInput
}): Promise<Resource> {
  if (nextFailure() === 'update') throw new Error('update failed')

  const currentResource = await getMockResource(id)
  if (!currentResource) throw new Error('Resource not found')

  const updatedResource: Resource = {
    ...currentResource,
    title: input.title,
    fileType: input.fileType,
    attachments: input.attachments,
  }
  const storedResources = readStoredResources()
  const nextResources = [
    updatedResource,
    ...storedResources.filter((resource) => resource.id !== id),
  ]

  localStorage.setItem(resourceStorageKey, JSON.stringify(nextResources))
  return updatedResource
}

export async function deleteMockResource(id: string): Promise<void> {
  if (nextFailure() === 'delete') throw new Error('delete failed')

  const currentResource = await getMockResource(id)
  if (!currentResource) throw new Error('Resource not found')

  const nextResources = readStoredResources().filter(
    (resource) => resource.id !== id,
  )
  const deletedIds = readDeletedResourceIds()
  deletedIds.add(id)

  localStorage.setItem(resourceStorageKey, JSON.stringify(nextResources))
  localStorage.setItem(
    deletedResourceStorageKey,
    JSON.stringify([...deletedIds]),
  )
}

export async function createMockResource(
  input: CreateResourceInput,
): Promise<Resource> {
  const resource: Resource = {
    id: `created-${crypto.randomUUID()}`,
    ...input,
    date: formatDisplayDate(new Date()),
  }
  const storedResources = readStoredResources()

  localStorage.setItem(
    resourceStorageKey,
    JSON.stringify([resource, ...storedResources]),
  )

  return resource
}

function readStoredResources(): Resource[] {
  const rawResources = localStorage.getItem(resourceStorageKey)
  if (!rawResources) return []

  try {
    const resources: unknown = JSON.parse(rawResources)
    return Array.isArray(resources) ? resources.filter(isResource) : []
  } catch {
    return []
  }
}

function readDeletedResourceIds(): Set<string> {
  const rawIds = localStorage.getItem(deletedResourceStorageKey)
  if (!rawIds) return new Set()

  try {
    const ids: unknown = JSON.parse(rawIds)
    return new Set(
      Array.isArray(ids)
        ? ids.filter((id): id is string => typeof id === 'string')
        : [],
    )
  } catch {
    return new Set()
  }
}

function isResource(value: unknown): value is Resource {
  if (!value || typeof value !== 'object') return false

  const resource = value as Record<string, unknown>
  return (
    typeof resource.id === 'string' &&
    typeof resource.fileType === 'string' &&
    typeof resource.title === 'string' &&
    typeof resource.date === 'string' &&
    (resource.attachments === undefined ||
      (Array.isArray(resource.attachments) &&
        resource.attachments.every((name) => typeof name === 'string')))
  )
}

function formatDisplayDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}
