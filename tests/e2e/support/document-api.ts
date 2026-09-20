import type { Page, Route } from '@playwright/test'

// 자료실 화면(목록·생성·수정)이 쓰는 API mock.
// 대상: GET·POST /documents, GET·PUT·DELETE /documents/{id}, POST /file.
// 실제 서버는 호출하지 않는다. 생성·수정·삭제는 mock 목록에 반영해 재조회 결과가 바뀐다.

export const documentListPattern = /^https:\/\/[^/]+\/documents(?:\?.*)?$/
export const documentItemPattern =
  /^https:\/\/[^/]+\/documents\/([^/?]+)(?:\?.*)?$/
export const fileUploadPattern = /^https:\/\/[^/]+\/file(?:\?.*)?$/

export type MockDocumentType = 'PDF' | 'JPG' | 'PNG' | 'OTHER'

export interface MockDocument {
  id: number
  title: string
  type: MockDocumentType
  /** YYYY-MM-DDTHH:mm:ss */
  createdAt: string
  files: { fileName: string; fileKey: string }[]
}

export interface DocumentRequestBody {
  title: string
  type: MockDocumentType
  files: string[]
}

// 최신순 11건. 한 페이지 10건이라 2페이지는 가장 오래된 `기타 참고자료.zip` 한 건이다.
export function createMockDocuments(): MockDocument[] {
  return [
    document(1, '근무지침요령 1', 'PDF', '2026-06-30', [
      '당일 지침.pdf',
      '휴관안내.png',
      '휴관안내.jpg',
    ]),
    document(2, '근무안내서 1', 'PDF', '2026-06-28'),
    document(3, '근무 중 행동 요령', 'JPG', '2026-06-25'),
    document(4, '시설 안내도', 'PNG', '2026-06-20'),
    document(6, '동물 먹이 급여표', 'PDF', '2026-06-19'),
    document(7, '사육장 청소 체크리스트', 'PDF', '2026-06-19'),
    document(8, '방문객 동선 안내', 'PNG', '2026-06-19'),
    document(9, '응급 연락망', 'JPG', '2026-06-19'),
    document(10, '체험 프로그램 소개', 'PDF', '2026-06-19'),
    document(11, '안전 교육 자료', 'OTHER', '2026-06-19'),
    document(5, '기타 참고자료.zip', 'OTHER', '2026-06-18'),
  ]
}

interface DocumentApiOptions {
  documents?: MockDocument[]
  /** PUT 응답 상태. 성공(2xx)이 아니면 목록을 바꾸지 않는다. */
  updateStatus?: number
  /** DELETE 응답 상태. 성공(2xx)이 아니면 목록을 바꾸지 않는다. */
  deleteStatus?: number
}

export interface DocumentApiHandle {
  createRequests: DocumentRequestBody[]
  updateRequests: { id: number; body: DocumentRequestBody }[]
  deleteRequests: number[]
}

export async function mockDocumentApi(
  page: Page,
  {
    documents = createMockDocuments(),
    updateStatus = 201,
    deleteStatus = 200,
  }: DocumentApiOptions = {},
): Promise<DocumentApiHandle> {
  const store = [...documents]
  // 업로드한 file key → 파일 이름. 생성·수정 요청의 files 를 파일 이름으로 되돌린다.
  const uploadedFileNames = new Map<string, string>()
  const handle: DocumentApiHandle = {
    createRequests: [],
    updateRequests: [],
    deleteRequests: [],
  }

  const toFiles = (fileKeys: string[]) =>
    fileKeys.map((fileKey) => ({
      fileKey,
      fileName:
        uploadedFileNames.get(fileKey) ??
        store
          .flatMap(({ files }) => files)
          .find((file) => file.fileKey === fileKey)?.fileName ??
        fileKey,
    }))

  await page.route(fileUploadPattern, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    const fileKey = `uploaded-${uploadedFileNames.size + 1}`
    uploadedFileNames.set(fileKey, uploadedFileName(route) ?? fileKey)
    await json(route, 201, { fileKey })
  })

  await page.route(documentListPattern, async (route) => {
    const request = route.request()

    if (request.method() === 'POST') {
      const body = request.postDataJSON() as DocumentRequestBody
      handle.createRequests.push(body)
      store.unshift({
        id: Math.max(0, ...store.map(({ id }) => id)) + 1,
        title: body.title,
        type: body.type,
        createdAt: '2026-07-01T00:00:00',
        files: toFiles(body.files),
      })
      await json(route, 201, { message: '자료 등록 성공' })
      return
    }

    // DOCUMENTS_QUERY_ALL 의 page 는 화면과 같은 1부터다. types 는 반복 파라미터로 온다.
    const url = new URL(request.url())
    const pageNumber = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
    const size = Number(url.searchParams.get('size') ?? '10')
    const keyword = url.searchParams.get('keyword') ?? ''
    const types = url.searchParams.getAll('types')
    const filtered = store.filter(
      ({ title, type }) =>
        title.includes(keyword) && (types.length === 0 || types.includes(type)),
    )
    await json(route, 200, {
      documents: filtered
        .slice((pageNumber - 1) * size, pageNumber * size)
        .map(({ id, title, type, createdAt }) => ({
          id,
          title,
          type,
          createdAt,
        })),
      totalPageSize: Math.ceil(filtered.length / size),
    })
  })

  await page.route(documentItemPattern, async (route) => {
    const request = route.request()
    const id = Number(documentItemPattern.exec(request.url())?.[1])
    const index = store.findIndex((item) => item.id === id)

    if (index < 0) {
      await json(route, 404, errorBody(404, '존재하지 않는 자료입니다.'))
      return
    }

    if (request.method() === 'PUT') {
      const body = request.postDataJSON() as DocumentRequestBody
      handle.updateRequests.push({ id, body })
      if (!isSuccess(updateStatus)) {
        await json(route, updateStatus, errorBody(updateStatus, '수정 실패'))
        return
      }
      store[index] = {
        ...store[index],
        title: body.title,
        type: body.type,
        files: toFiles(body.files),
      }
      await json(route, updateStatus, { message: '자료 수정 성공' })
      return
    }

    if (request.method() === 'DELETE') {
      handle.deleteRequests.push(id)
      if (!isSuccess(deleteStatus)) {
        await json(route, deleteStatus, errorBody(deleteStatus, '삭제 실패'))
        return
      }
      store.splice(index, 1)
      await json(route, deleteStatus, { message: '자료 삭제 성공' })
      return
    }

    await json(route, 200, store[index])
  })

  return handle
}

function document(
  id: number,
  title: string,
  type: MockDocumentType,
  date: string,
  fileNames: string[] = [],
): MockDocument {
  return {
    id,
    title,
    type,
    createdAt: `${date}T10:00:00`,
    files: fileNames.map((fileName, index) => ({
      fileName,
      fileKey: `document-${id}-${index}`,
    })),
  }
}

// multipart 본문에서 업로드한 파일 이름을 꺼낸다.
function uploadedFileName(route: Route): string | undefined {
  const body = route.request().postDataBuffer()?.toString('utf8') ?? ''
  return /filename="([^"]*)"/.exec(body)?.[1]
}

function isSuccess(status: number) {
  return status >= 200 && status < 300
}

function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-02-06T19:56:53.62201',
    description: '에러 설명',
  }
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
