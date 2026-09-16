import type { Page, Route } from '@playwright/test'

// 개체관리(종·법정지정분류·개체·관찰) 화면 시나리오가 쓰는 API mock.
// 옛 앱 내부 mock(13종 · 개체 26 · 관찰 12)을 그대로 옮겨 메모리 상태로 흉내 낸다.
// 실제 서버는 호출하지 않으며, 실패 경로는 `failNext` 로 다음 한 번만 실패시킨다
// (Playwright 는 나중에 등록한 route 를 먼저 매칭하므로 spec 이 개별 route 를 덮어써도 된다).

export const animalManagePattern = /^https:\/\/[^/]+\/animal-manage(?:[/?].*)?$/
export const animalFilePattern = /^https:\/\/[^/]+\/file(?:\?.*)?$/
export const storedFilePattern = /^https:\/\/cdn\.e2e\.invalid\/.*/

export type MockTaxonGroup = 'MAMMALS' | 'REPTILES' | 'BIRDS' | 'FISH'
export type MockSex = 'WOMAN' | 'MAN' | 'UNKNOWN'

export interface MockFile {
  fileName: string
  fileKey: string
}

export interface MockKind {
  id: number
  kindName: string
  engName: string
  scientificName: string
  animalTaxonomic: MockTaxonGroup
  detailKind: string | null
  /** 선택된 법정지정분류 이름, 저장 순서 */
  legalDesignations: string[]
  kindImage: MockFile
}

export interface MockLegalStatus {
  id: number
  kind: string
}

export interface MockAnimal {
  id: number
  kindId: number
  animalName: string
  animalGender: MockSex
  birthYear: number
  otherInfo: string | null
  animalImage: MockFile
}

export interface MockObservation {
  id: number
  animalId: number
  title: string
  content: string
  createdAt: string
  authorName: string
  files: MockFile[]
}

export type AnimalManageOperation =
  | 'kind.list'
  | 'kind.detail'
  | 'kind.create'
  | 'kind.update'
  | 'kind.delete'
  | 'legalStatus.list'
  | 'legalStatus.create'
  | 'legalStatus.delete'
  | 'animal.list'
  | 'animal.detail'
  | 'animal.create'
  | 'animal.update'
  | 'animal.delete'
  | 'observation.list'
  | 'observation.detail'
  | 'observation.update'
  | 'observation.delete'
  | 'file.upload'

export interface AnimalManageRequest {
  operation: AnimalManageOperation
  url: URL
  body: unknown
}

export interface AnimalManageApiHandle {
  kinds: MockKind[]
  legalStatuses: MockLegalStatus[]
  animals: MockAnimal[]
  observations: MockObservation[]
  requests: AnimalManageRequest[]
  /** 다음 `operation` 요청 한 번을 `status` 로 실패시킨다. */
  failNext(operation: AnimalManageOperation, status?: number): void
  /** `operation` 요청을 `ms` 만큼 늦춘다. */
  delay(operation: AnimalManageOperation, ms: number): void
  count(operation: AnimalManageOperation): number
}

function photo(name: string, prefix: string, id: number): MockFile {
  return {
    fileName: `${name}_2026.jpg`,
    fileKey: `2026/06/01/${prefix}-${id}.jpg`,
  }
}

// 한 페이지 10행이라 `전체` 탭에서 2페이지가 나오고, 네 분류군이 모두 있으며,
// 개체가 0마리인 종(13 피라냐)이 있다. 서버는 최신순(id 내림차순)으로 준다.
const kindRows: Omit<MockKind, 'kindImage'>[] = [
  {
    id: 1,
    kindName: '카피바라',
    engName: 'Capybara',
    scientificName: 'Hydrochoerus hydrochaeris',
    animalTaxonomic: 'MAMMALS',
    detailKind: '설치목 - 천축서과',
    legalDesignations: ['지정관리 야생동물'],
  },
  {
    id: 2,
    kindName: '플라밍고',
    engName: 'Flamingo',
    scientificName: 'Phoenicopterus roseus',
    animalTaxonomic: 'BIRDS',
    detailKind: null,
    legalDesignations: [],
  },
  {
    id: 3,
    kindName: '반달가슴곰',
    engName: 'Asiatic black bear',
    scientificName: 'Ursus thibetanus',
    animalTaxonomic: 'MAMMALS',
    detailKind: null,
    legalDesignations: ['멸종위기 야생생물 I급', '천연기념물'],
  },
  {
    id: 4,
    kindName: '알락꼬리여우원숭이',
    engName: 'Ring-tailed lemur',
    scientificName: 'Lemur catta',
    animalTaxonomic: 'MAMMALS',
    detailKind: null,
    legalDesignations: [],
  },
  {
    id: 5,
    kindName: '미어캣',
    engName: 'Meerkat',
    scientificName: 'Suricata suricatta',
    animalTaxonomic: 'MAMMALS',
    detailKind: '몽구스과',
    legalDesignations: [],
  },
  {
    id: 6,
    kindName: '레서판다',
    engName: 'Red panda',
    scientificName: 'Ailurus fulgens',
    animalTaxonomic: 'MAMMALS',
    detailKind: '레서판다과',
    legalDesignations: [],
  },
  {
    id: 7,
    kindName: '설카타육지거북',
    engName: 'African spurred tortoise',
    scientificName: 'Centrochelys sulcata',
    animalTaxonomic: 'REPTILES',
    detailKind: null,
    legalDesignations: [],
  },
  {
    id: 8,
    kindName: '비어디드래곤',
    engName: 'Central bearded dragon',
    scientificName: 'Pogona vitticeps',
    animalTaxonomic: 'REPTILES',
    detailKind: null,
    legalDesignations: [],
  },
  {
    id: 9,
    kindName: '볼파이톤',
    engName: 'Ball python',
    scientificName: 'Python regius',
    animalTaxonomic: 'REPTILES',
    detailKind: null,
    legalDesignations: [],
  },
  {
    id: 10,
    kindName: '금강앵무',
    engName: 'Blue-and-yellow macaw',
    scientificName: 'Ara ararauna',
    animalTaxonomic: 'BIRDS',
    detailKind: '앵무과',
    legalDesignations: [],
  },
  {
    id: 11,
    kindName: '훔볼트펭귄',
    engName: 'Humboldt penguin',
    scientificName: 'Spheniscus humboldti',
    animalTaxonomic: 'BIRDS',
    detailKind: '펭귄과',
    legalDesignations: [],
  },
  {
    id: 12,
    kindName: '흰동가리',
    engName: 'Clown anemonefish',
    scientificName: 'Amphiprion ocellaris',
    animalTaxonomic: 'FISH',
    detailKind: '자리돔과',
    legalDesignations: [],
  },
  {
    id: 13,
    kindName: '피라냐',
    engName: 'Red-bellied piranha',
    scientificName: 'Pygocentrus nattereri',
    animalTaxonomic: 'FISH',
    detailKind: null,
    legalDesignations: [],
  },
]

export function mockKinds(): MockKind[] {
  return kindRows.map((row) => ({
    ...row,
    legalDesignations: [...row.legalDesignations],
    kindImage: photo(row.kindName, 'kind', row.id),
  }))
}

// 기존 종이 선택한 분류만 공용 목록에 있다(서버는 기본 항목을 미리 만들지 않는다).
export function mockLegalStatuses(): MockLegalStatus[] {
  return [
    { id: 1, kind: '지정관리 야생동물' },
    { id: 2, kind: '멸종위기 야생생물 I급' },
    { id: 3, kind: '천연기념물' },
  ]
}

// 마리수: 1 → 3 · 2 → 12(2페이지) · 3 → 2 · 4~12 → 각 1 · 13 → 0(빈 상태).
const animalRows: [number, number, string, MockSex, number, string?][] = [
  [1, 1, '동식이', 'MAN', 2019, '알락꼬리여우원숭이와 합사 중'],
  [2, 1, '미미', 'WOMAN', 2020],
  [3, 1, '두리', 'MAN', 2021],
  [4, 2, '핑키', 'WOMAN', 2016],
  [5, 2, '노을', 'MAN', 2016],
  [6, 2, '산호', 'WOMAN', 2017],
  [7, 2, '체리', 'UNKNOWN', 2018],
  [8, 2, '연지', 'WOMAN', 2018],
  [9, 2, '자몽', 'MAN', 2019],
  [10, 2, '딸기', 'WOMAN', 2019],
  [11, 2, '봄비', 'UNKNOWN', 2020],
  [12, 2, '새벽', 'MAN', 2021],
  [13, 2, '복숭아', 'WOMAN', 2022],
  [14, 2, '분홍이', 'MAN', 2022],
  [15, 2, '홍시', 'UNKNOWN', 2023],
  [16, 3, '반달이', 'MAN', 2015],
  [17, 3, '곰순이', 'WOMAN', 2017],
  [18, 4, '럭키', 'MAN', 2018],
  [19, 5, '망고', 'WOMAN', 2020],
  [20, 6, '레오', 'MAN', 2019],
  [21, 7, '느림보', 'UNKNOWN', 2012],
  [22, 8, '용용', 'MAN', 2021],
  [23, 9, '볼리', 'WOMAN', 2020],
  [24, 10, '파랑이', 'UNKNOWN', 2014],
  [25, 11, '뒤뚱이', 'MAN', 2022],
  [26, 12, '주황이', 'UNKNOWN', 2024],
]

export function mockAnimals(): MockAnimal[] {
  return animalRows.map(
    ([id, kindId, animalName, animalGender, birthYear, otherInfo]) => ({
      id,
      kindId,
      animalName,
      animalGender,
      birthYear,
      otherInfo: otherInfo ?? null,
      animalImage: photo(animalName, 'animal', id),
    }),
  )
}

// 동식이(개체 1) 11건 → 2페이지. 미미(개체 2) 1건, 나머지 개체는 0건.
// 관찰사항은 Figma 관찰 상세 값처럼 제목과 같은 문장으로 둔다.
const observationRows: [number, number, string, string, string, string[]][] = [
  [
    1,
    1,
    '2026-06-01',
    '김유영',
    '얼굴 콧잔등 부위 약 3cm 긁힌 상처 있음',
    ['상처사진.jpg', '상처사진_측면.jpg', '처치기록.pdf'],
  ],
  [
    2,
    1,
    '2026-05-10',
    '김유영',
    '배변상태 평소보다 조금 묽음',
    ['배변사진.jpg'],
  ],
  [3, 1, '2026-04-22', '김유영', '식욕 정상, 활동량 양호', []],
  [4, 1, '2026-04-08', '이승현', '체중 측정 결과 평소와 비슷함', []],
  [5, 1, '2026-03-27', '김수인', '발톱 손질 완료', ['발톱손질.png']],
  [6, 1, '2026-03-15', '김유영', '합사 개체와 다툼 흔적 없음', []],
  [
    7,
    1,
    '2026-03-02',
    '이지아',
    '등 부위 피부 건조 증상 관찰',
    ['피부상태.jpg', '피부상태_근접.jpg'],
  ],
  [8, 1, '2026-02-18', '이승현', '수영장 이용 시간 증가', []],
  [9, 1, '2026-02-04', '김유영', '예방접종 후 특이반응 없음', ['접종기록.pdf']],
  [10, 1, '2026-01-21', '김수인', '털빠짐 부위 감소', []],
  [11, 1, '2026-01-07', '이지아', '겨울철 실내 적응 양호', []],
  [12, 2, '2026-05-28', '김유영', '귀 뒤 작은 딱지 확인', ['귀상태.jpg']],
]

export function mockObservations(): MockObservation[] {
  return observationRows.map(
    ([id, animalId, date, authorName, title, names]) => ({
      id,
      animalId,
      title,
      content: title,
      createdAt: `${date}T10:00:00`,
      authorName,
      files: names.map((fileName, index) => ({
        fileName,
        fileKey: `2026/06/01/observation-${id}-${index + 1}`,
      })),
    }),
  )
}

export interface AnimalManageApiOptions {
  kinds?: MockKind[]
  legalStatuses?: MockLegalStatus[]
  animals?: MockAnimal[]
  observations?: MockObservation[]
}

// 1x1 투명 PNG. 사진 요청이 도달 불가 CDN 으로 새지 않게 한다.
const pixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
  'base64',
)

export async function mockAnimalManageApi(
  page: Page,
  options: AnimalManageApiOptions = {},
): Promise<AnimalManageApiHandle> {
  const failures = new Map<AnimalManageOperation, number>()
  const delays = new Map<AnimalManageOperation, number>()
  let uploadCount = 0

  const handle: AnimalManageApiHandle = {
    kinds: options.kinds ?? mockKinds(),
    legalStatuses: options.legalStatuses ?? mockLegalStatuses(),
    animals: options.animals ?? mockAnimals(),
    observations: options.observations ?? mockObservations(),
    requests: [],
    failNext(operation, status = 500) {
      failures.set(operation, status)
    },
    delay(operation, ms) {
      delays.set(operation, ms)
    },
    count(operation) {
      return handle.requests.filter(
        (request) => request.operation === operation,
      ).length
    },
  }

  // 요청을 기록하고, 주입된 지연·실패를 적용한다. 실패로 응답했으면 true.
  async function begin(
    route: Route,
    operation: AnimalManageOperation,
    body: unknown = null,
  ) {
    handle.requests.push({
      operation,
      url: new URL(route.request().url()),
      body,
    })
    const ms = delays.get(operation) ?? 0
    if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms))

    const status = failures.get(operation)
    if (status === undefined) return false
    failures.delete(operation)
    await json(route, status, errorBody(status, '요청 처리에 실패했습니다.'))
    return true
  }

  await page.route(storedFilePattern, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: pixelPng }),
  )

  await page.route(animalFilePattern, async (route) => {
    const raw = route.request().postDataBuffer()?.toString('utf8') ?? ''
    if (await begin(route, 'file.upload', raw)) return

    uploadCount += 1
    const fileName = /filename="([^"]+)"/.exec(raw)?.[1] ?? 'upload.bin'
    await json(route, 200, {
      fileKey: `2026/09/17/upload-${uploadCount}_${fileName}`,
    })
  })

  await page.route(animalManagePattern, async (route) => {
    const request = route.request()
    const method = request.method()
    const url = new URL(request.url())
    const segments = url.pathname.split('/').filter(Boolean).slice(1)
    const body =
      method === 'POST' || method === 'PATCH' ? request.postDataJSON() : null
    const [first, second, third] = segments

    if (first === 'kind') {
      if (second === undefined) {
        if (method === 'POST') return createKind(route, body)
        return listKinds(route, url)
      }
      const kindId = Number(second)
      if (third === 'animal') return listAnimals(route, url, kindId)
      if (method === 'PATCH') return updateKind(route, kindId, body)
      if (method === 'DELETE') return deleteKind(route, kindId)
      return getKind(route, kindId)
    }

    if (first === 'legal-status') {
      if (second !== undefined) return deleteLegalStatus(route, Number(second))
      if (method === 'POST') return createLegalStatus(route, body)
      return listLegalStatuses(route)
    }

    if (first === undefined) return createAnimal(route, body)

    const animalId = Number(first)
    if (second === 'observations') {
      if (third === undefined) return listObservations(route, url, animalId)
      const observationId = Number(third)
      if (method === 'PATCH') {
        return updateObservation(route, animalId, observationId, body)
      }
      if (method === 'DELETE') {
        return deleteObservation(route, animalId, observationId)
      }
      return getObservation(route, animalId, observationId)
    }
    if (method === 'PATCH') return updateAnimal(route, animalId, body)
    if (method === 'DELETE') return deleteAnimal(route, animalId)
    return getAnimal(route, animalId)
  })

  async function listKinds(route: Route, url: URL) {
    if (await begin(route, 'kind.list')) return

    const { page: pageNumber, size } = pageQuery(url)
    const taxonomic = url.searchParams.get('animalTaxonomic')
    const keyword = url.searchParams.get('keyword') ?? ''
    const filtered = [...handle.kinds]
      .sort((a, b) => b.id - a.id)
      .filter((kind) => !taxonomic || kind.animalTaxonomic === taxonomic)
      .filter(
        (kind) =>
          !keyword ||
          kind.kindName.includes(keyword) ||
          handle.animals.some(
            (animal) =>
              animal.kindId === kind.id && animal.animalName.includes(keyword),
          ),
      )

    await json(route, 200, {
      animalKinds: slice(filtered, pageNumber, size).map((kind) => ({
        animalKindId: kind.id,
        animalTaxonomic: kind.animalTaxonomic,
        kindName: kind.kindName,
        scientificName: kind.scientificName,
        animalCount: animalCount(kind.id),
        kindImage: kind.kindImage,
      })),
      totalPageSize: Math.ceil(filtered.length / size),
    })
  }

  async function getKind(route: Route, kindId: number) {
    if (await begin(route, 'kind.detail')) return

    const kind = findKind(kindId)
    if (!kind) return notFound(route, '존재하지 않는 종입니다.')

    await json(route, 200, {
      animalKindId: kind.id,
      kindName: kind.kindName,
      engName: kind.engName,
      scientificName: kind.scientificName,
      animalTaxonomic: kind.animalTaxonomic,
      detailKind: kind.detailKind,
      // 공용 목록에서 삭제된 분류는 id 가 null 이다(BE PR #162).
      legalStatuses: kind.legalDesignations.map((name) => ({
        animalLegalStatusId:
          handle.legalStatuses.find((status) => status.kind === name)?.id ??
          null,
        kind: name,
      })),
      animalCount: animalCount(kind.id),
      kindImage: kind.kindImage,
    })
  }

  async function createKind(route: Route, body: unknown) {
    if (await begin(route, 'kind.create', body)) return

    const request = body as KindRequest
    const names = legalNames(request.animalLegalDesignation ?? [])
    if (!names) return notFound(route, '존재하지 않는 법정지정분류입니다.')

    handle.kinds.push({
      id: nextId(handle.kinds),
      ...kindFields(request),
      legalDesignations: names,
    })
    await json(route, 201, { message: '종이 등록되었습니다.' })
  }

  async function updateKind(route: Route, kindId: number, body: unknown) {
    if (await begin(route, 'kind.update', body)) return

    const kind = findKind(kindId)
    if (!kind) return notFound(route, '존재하지 않는 종입니다.')
    const request = body as KindRequest
    const names = legalNames(request.animalLegalDesignation ?? [])
    if (!names) return notFound(route, '존재하지 않는 법정지정분류입니다.')

    Object.assign(kind, kindFields(request, kind), { legalDesignations: names })
    await json(route, 200, { message: '종이 수정되었습니다.' })
  }

  async function deleteKind(route: Route, kindId: number) {
    if (await begin(route, 'kind.delete')) return

    if (!findKind(kindId)) return notFound(route, '존재하지 않는 종입니다.')
    const animalIds = new Set(
      handle.animals
        .filter((animal) => animal.kindId === kindId)
        .map((a) => a.id),
    )
    handle.kinds = handle.kinds.filter((kind) => kind.id !== kindId)
    handle.animals = handle.animals.filter(
      (animal) => !animalIds.has(animal.id),
    )
    handle.observations = handle.observations.filter(
      (observation) => !animalIds.has(observation.animalId),
    )
    await json(route, 200, { message: '종이 삭제되었습니다.' })
  }

  async function listLegalStatuses(route: Route) {
    if (await begin(route, 'legalStatus.list')) return

    await json(
      route,
      200,
      handle.legalStatuses.map((status) => ({
        animalLegalStatusId: status.id,
        kind: status.kind,
      })),
    )
  }

  async function createLegalStatus(route: Route, body: unknown) {
    if (await begin(route, 'legalStatus.create', body)) return

    const { kind } = body as { kind: string }
    handle.legalStatuses.push({ id: nextId(handle.legalStatuses), kind })
    await json(route, 201, { message: '법정지정분류가 등록되었습니다.' })
  }

  async function deleteLegalStatus(route: Route, statusId: number) {
    if (await begin(route, 'legalStatus.delete')) return

    if (!handle.legalStatuses.some((status) => status.id === statusId)) {
      return notFound(route, '존재하지 않는 법정지정분류입니다.')
    }
    handle.legalStatuses = handle.legalStatuses.filter(
      (status) => status.id !== statusId,
    )
    await json(route, 200, { message: '법정지정분류가 삭제되었습니다.' })
  }

  async function listAnimals(route: Route, url: URL, kindId: number) {
    if (await begin(route, 'animal.list')) return

    if (!findKind(kindId)) return notFound(route, '존재하지 않는 종입니다.')
    const { page: pageNumber, size } = pageQuery(url)
    const keyword = url.searchParams.get('keyword') ?? ''
    const filtered = handle.animals
      .filter((animal) => animal.kindId === kindId)
      .filter((animal) => !keyword || animal.animalName.includes(keyword))
      .sort((a, b) => b.id - a.id)

    await json(
      route,
      200,
      pageBody(
        slice(filtered, pageNumber, size).map((animal) => ({
          animalManageId: animal.id,
          animalName: animal.animalName,
          animalGender: animal.animalGender,
          birthYear: animal.birthYear,
        })),
        filtered.length,
        pageNumber,
        size,
      ),
    )
  }

  async function getAnimal(route: Route, animalId: number) {
    if (await begin(route, 'animal.detail')) return

    const animal = findAnimal(animalId)
    const kind = animal && findKind(animal.kindId)
    if (!animal || !kind) return notFound(route, '존재하지 않는 개체입니다.')

    await json(route, 200, {
      animalManageId: animal.id,
      animalName: animal.animalName,
      animalGender: animal.animalGender,
      birthYear: animal.birthYear,
      otherInfo: animal.otherInfo,
      animalImage: animal.animalImage,
      animalKindId: kind.id,
      kindName: kind.kindName,
      scientificName: kind.scientificName,
      animalTaxonomic: kind.animalTaxonomic,
      detailKind: kind.detailKind,
    })
  }

  async function createAnimal(route: Route, body: unknown) {
    if (await begin(route, 'animal.create', body)) return

    const request = body as AnimalRequest
    if (!findKind(request.animalKindId)) {
      return notFound(route, '존재하지 않는 종입니다.')
    }
    handle.animals.push({
      id: nextId(handle.animals),
      ...animalFields(request),
    })
    await json(route, 201, { message: '개체가 등록되었습니다.' })
  }

  async function updateAnimal(route: Route, animalId: number, body: unknown) {
    if (await begin(route, 'animal.update', body)) return

    const animal = findAnimal(animalId)
    if (!animal) return notFound(route, '존재하지 않는 개체입니다.')
    Object.assign(animal, animalFields(body as AnimalRequest, animal))
    await json(route, 200, { message: '개체가 수정되었습니다.' })
  }

  async function deleteAnimal(route: Route, animalId: number) {
    if (await begin(route, 'animal.delete')) return

    if (!findAnimal(animalId))
      return notFound(route, '존재하지 않는 개체입니다.')
    handle.animals = handle.animals.filter((animal) => animal.id !== animalId)
    handle.observations = handle.observations.filter(
      (observation) => observation.animalId !== animalId,
    )
    await json(route, 200, { message: '개체가 삭제되었습니다.' })
  }

  async function listObservations(route: Route, url: URL, animalId: number) {
    if (await begin(route, 'observation.list')) return

    if (!findAnimal(animalId))
      return notFound(route, '존재하지 않는 개체입니다.')
    const { page: pageNumber, size } = pageQuery(url)
    const filtered = handle.observations
      .filter((observation) => observation.animalId === animalId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)

    await json(
      route,
      200,
      pageBody(
        slice(filtered, pageNumber, size).map((item) => ({
          animalObservationId: item.id,
          title: item.title,
          createdAt: item.createdAt,
          authorName: item.authorName,
          files: item.files,
        })),
        filtered.length,
        pageNumber,
        size,
      ),
    )
  }

  async function getObservation(
    route: Route,
    animalId: number,
    observationId: number,
  ) {
    if (await begin(route, 'observation.detail')) return

    const observation = findObservation(animalId, observationId)
    if (!observation) return notFound(route, '존재하지 않는 관찰 기록입니다.')

    await json(route, 200, {
      animalObservationId: observation.id,
      title: observation.title,
      content: observation.content,
      createdAt: observation.createdAt,
      authorName: observation.authorName,
      files: observation.files,
    })
  }

  async function updateObservation(
    route: Route,
    animalId: number,
    observationId: number,
    body: unknown,
  ) {
    if (await begin(route, 'observation.update', body)) return

    const observation = findObservation(animalId, observationId)
    if (!observation) return notFound(route, '존재하지 않는 관찰 기록입니다.')
    const request = body as {
      title: string
      content: string
      fileKeys: string[]
    }

    Object.assign(observation, {
      title: request.title,
      content: request.content,
      files: request.fileKeys.map((fileKey) =>
        fileFromKey(fileKey, observation.files),
      ),
    })
    await json(route, 200, { message: '관찰 기록이 수정되었습니다.' })
  }

  async function deleteObservation(
    route: Route,
    animalId: number,
    observationId: number,
  ) {
    if (await begin(route, 'observation.delete')) return

    if (!findObservation(animalId, observationId)) {
      return notFound(route, '존재하지 않는 관찰 기록입니다.')
    }
    handle.observations = handle.observations.filter(
      (observation) => observation.id !== observationId,
    )
    await json(route, 200, { message: '관찰 기록이 삭제되었습니다.' })
  }

  function findKind(kindId: number) {
    return handle.kinds.find((kind) => kind.id === kindId)
  }

  function findAnimal(animalId: number) {
    const animal = handle.animals.find((item) => item.id === animalId)
    return animal && findKind(animal.kindId) ? animal : undefined
  }

  function findObservation(animalId: number, observationId: number) {
    if (!findAnimal(animalId)) return undefined
    return handle.observations.find(
      (item) => item.id === observationId && item.animalId === animalId,
    )
  }

  function animalCount(kindId: number) {
    return handle.animals.filter((animal) => animal.kindId === kindId).length
  }

  // 없는 id 가 섞이면 null(서버는 404).
  function legalNames(ids: number[]) {
    const names = ids.map(
      (id) => handle.legalStatuses.find((status) => status.id === id)?.kind,
    )
    return names.every((name) => name !== undefined)
      ? (names as string[])
      : null
  }

  return handle
}

interface KindRequest {
  animalName: string
  animalEngName: string
  animalScientificName: string
  animalTaxonomic: MockTaxonGroup
  fileKey: string
  animalDetailKind?: string | null
  animalLegalDesignation?: number[]
}

interface AnimalRequest {
  animalKindId: number
  animalName: string
  animalGender: MockSex
  birthYear: number
  otherInfo?: string | null
  fileKey: string
}

function kindFields(request: KindRequest, current?: MockKind) {
  return {
    kindName: request.animalName,
    engName: request.animalEngName,
    scientificName: request.animalScientificName,
    animalTaxonomic: request.animalTaxonomic,
    detailKind: request.animalDetailKind ?? null,
    kindImage: fileFromKey(request.fileKey, current ? [current.kindImage] : []),
  }
}

function animalFields(request: AnimalRequest, current?: MockAnimal) {
  return {
    kindId: request.animalKindId,
    animalName: request.animalName,
    animalGender: request.animalGender,
    birthYear: request.birthYear,
    otherInfo: request.otherInfo ?? null,
    animalImage: fileFromKey(
      request.fileKey,
      current ? [current.animalImage] : [],
    ),
  }
}

// 유지한 파일은 저장된 이름을, 새 업로드는 키에 붙인 원래 이름을 쓴다.
function fileFromKey(fileKey: string, existing: MockFile[]): MockFile {
  const kept = existing.find((file) => file.fileKey === fileKey)
  if (kept) return kept

  const name = fileKey.split('/').at(-1) ?? fileKey
  return { fileName: name.replace(/^upload-\d+_/, ''), fileKey }
}

function pageQuery(url: URL) {
  return {
    page: Number(url.searchParams.get('page') ?? 1),
    size: Number(url.searchParams.get('size') ?? 10),
  }
}

function slice<Item>(items: Item[], page: number, size: number) {
  return items.slice((page - 1) * size, page * size)
}

function pageBody<Item>(
  content: Item[],
  total: number,
  page: number,
  size: number,
) {
  return {
    content,
    totalPages: Math.ceil(total / size),
    totalElements: total,
    number: page - 1,
    size,
  }
}

function nextId(items: { id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

async function notFound(route: Route, message: string) {
  await json(route, 404, errorBody(404, message))
}

function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-09-17T10:00:00.00000',
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
