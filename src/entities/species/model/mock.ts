// 마리수는 개체 레코드에서 파생한다. 개체 mock 은 삭제된 종의 개체를 빼려고 이 파일을 참조하므로,
// 순환을 피해 레코드 계층만 참조한다. 공개 index 끼리 순환하지 않도록 model 파일을 직접 import 한다.
import { countMockIndividualsBySpecies } from '@/entities/individual/model/records'
import { isPhoto, mockPhotoUrl, toMockPhoto } from './mockPhoto'
import { taxonGroups } from './types'
import type {
  CreateSpeciesInput,
  Photo,
  Species,
  TaxonGroup,
  UpdateSpeciesInput,
} from './types'

export const speciesStorageKey = 'toyvillage:species'
export const deletedSpeciesStorageKey = 'toyvillage:species:deleted'

// 실패 경로 검증용 주입 플래그. mock 은 항상 성공하므로,
// 이 localStorage 키에 'delete' | 'create' | 'update' 를 넣으면 다음 해당 요청이 한 번 실패한다.
// 실제 API 연동(/api) 시 제거한다.
export const speciesFailStorageKey = 'toyvillage:species:fail'

type SpeciesFailure = 'delete' | 'create' | 'update'

// 마리수는 저장하지 않고 조회 때 개체 mock 에서 센다.
type SpeciesRecord = Omit<Species, 'individualCount'>

// 한 페이지 10행이라 `전체` 탭에서 2페이지가 나오고, 네 분류군이 모두 있으며,
// 개체가 0마리인 종(13 피라냐)이 있다. id 1~3 은 개체관리 공통 fixture 다.
const mockSpecies: SpeciesRecord[] = [
  {
    id: '1',
    koreanName: '카피바라',
    englishName: 'Capybara',
    scientificName: 'Hydrochoerus hydrochaeris',
    taxonGroup: 'MAMMAL',
    subClassification: '설치목 - 천축서과',
    legalDesignations: ['지정관리 야생동물'],
    photo: fixturePhoto('1', '카피바라'),
  },
  {
    id: '2',
    koreanName: '플라밍고',
    englishName: 'Flamingo',
    scientificName: 'Phoenicopterus roseus',
    taxonGroup: 'BIRD',
    legalDesignations: [],
    photo: fixturePhoto('2', '플라밍고'),
  },
  {
    id: '3',
    koreanName: '반달가슴곰',
    englishName: 'Asiatic black bear',
    scientificName: 'Ursus thibetanus',
    taxonGroup: 'MAMMAL',
    legalDesignations: ['멸종위기 야생생물 I급', '천연기념물'],
    photo: fixturePhoto('3', '반달가슴곰'),
  },
  {
    id: '4',
    koreanName: '알락꼬리여우원숭이',
    englishName: 'Ring-tailed lemur',
    scientificName: 'Lemur catta',
    taxonGroup: 'MAMMAL',
    legalDesignations: [],
    photo: fixturePhoto('4', '알락꼬리여우원숭이'),
  },
  {
    id: '5',
    koreanName: '미어캣',
    englishName: 'Meerkat',
    scientificName: 'Suricata suricatta',
    taxonGroup: 'MAMMAL',
    subClassification: '몽구스과',
    legalDesignations: [],
    photo: fixturePhoto('5', '미어캣'),
  },
  {
    id: '6',
    koreanName: '레서판다',
    englishName: 'Red panda',
    scientificName: 'Ailurus fulgens',
    taxonGroup: 'MAMMAL',
    subClassification: '레서판다과',
    legalDesignations: [],
    photo: fixturePhoto('6', '레서판다'),
  },
  {
    id: '7',
    koreanName: '설카타육지거북',
    englishName: 'African spurred tortoise',
    scientificName: 'Centrochelys sulcata',
    taxonGroup: 'REPTILE',
    legalDesignations: [],
    photo: fixturePhoto('7', '설카타육지거북'),
  },
  {
    id: '8',
    koreanName: '비어디드래곤',
    englishName: 'Central bearded dragon',
    scientificName: 'Pogona vitticeps',
    taxonGroup: 'REPTILE',
    legalDesignations: [],
    photo: fixturePhoto('8', '비어디드래곤'),
  },
  {
    id: '9',
    koreanName: '볼파이톤',
    englishName: 'Ball python',
    scientificName: 'Python regius',
    taxonGroup: 'REPTILE',
    legalDesignations: [],
    photo: fixturePhoto('9', '볼파이톤'),
  },
  {
    id: '10',
    koreanName: '금강앵무',
    englishName: 'Blue-and-yellow macaw',
    scientificName: 'Ara ararauna',
    taxonGroup: 'BIRD',
    subClassification: '앵무과',
    legalDesignations: [],
    photo: fixturePhoto('10', '금강앵무'),
  },
  {
    id: '11',
    koreanName: '훔볼트펭귄',
    englishName: 'Humboldt penguin',
    scientificName: 'Spheniscus humboldti',
    taxonGroup: 'BIRD',
    subClassification: '펭귄과',
    legalDesignations: [],
    photo: fixturePhoto('11', '훔볼트펭귄'),
  },
  {
    id: '12',
    koreanName: '흰동가리',
    englishName: 'Clown anemonefish',
    scientificName: 'Amphiprion ocellaris',
    taxonGroup: 'FISH',
    subClassification: '자리돔과',
    legalDesignations: [],
    photo: fixturePhoto('12', '흰동가리'),
  },
  {
    id: '13',
    koreanName: '피라냐',
    englishName: 'Red-bellied piranha',
    scientificName: 'Pygocentrus nattereri',
    taxonGroup: 'FISH',
    legalDesignations: [],
    photo: fixturePhoto('13', '피라냐'),
  },
]

/** id 오름차순. 필터·검색·정렬·페이지 슬라이싱은 페이지가 한다. */
export async function getMockSpeciesList(): Promise<Species[]> {
  const individualCounts = countMockIndividualsBySpecies()
  return readSpeciesRecords().map((record) => ({
    ...record,
    individualCount: individualCounts.get(record.id) ?? 0,
  }))
}

/** 없는 id 와 삭제된 종은 `null` 이다. */
export async function getMockSpecies(id: string): Promise<Species | null> {
  const speciesList = await getMockSpeciesList()
  return speciesList.find((species) => species.id === id) ?? null
}

export async function createMockSpecies(
  input: CreateSpeciesInput,
): Promise<Species> {
  if (consumeFailure('create')) throw new Error('create failed')

  const record = toSpeciesRecord(nextSpeciesId(), input)
  writeStoredSpecies([...readStoredSpecies(), record])

  return { ...record, individualCount: 0 }
}

export async function updateMockSpecies({
  id,
  input,
}: {
  id: string
  input: UpdateSpeciesInput
}): Promise<Species> {
  if (consumeFailure('update')) throw new Error('update failed')

  const currentSpecies = await getMockSpecies(id)
  if (!currentSpecies) throw new Error('Species not found')

  const record = toSpeciesRecord(id, input)
  writeStoredSpecies([
    ...readStoredSpecies().filter((species) => species.id !== id),
    record,
  ])

  return { ...record, individualCount: currentSpecies.individualCount }
}

/** 삭제 id 만 기록한다. 그 종의 개체·관찰은 각 mock 이 조회에서 뺀다. */
export async function deleteMockSpecies(id: string): Promise<void> {
  if (consumeFailure('delete')) throw new Error('delete failed')

  const currentSpecies = await getMockSpecies(id)
  if (!currentSpecies) throw new Error('Species not found')

  const deletedIds = readDeletedSpeciesIds()
  deletedIds.add(id)

  writeStoredSpecies(readStoredSpecies().filter((species) => species.id !== id))
  localStorage.setItem(
    deletedSpeciesStorageKey,
    JSON.stringify([...deletedIds]),
  )
}

function fixturePhoto(id: string, koreanName: string): Photo {
  return {
    fileName: `${koreanName}_2026.jpg`,
    fileKey: speciesFileKey(id),
    url: mockPhotoUrl,
  }
}

function speciesFileKey(id: string) {
  return `mock-species-${id}`
}

function toSpeciesRecord(id: string, input: CreateSpeciesInput): SpeciesRecord {
  return {
    id,
    koreanName: input.koreanName,
    englishName: input.englishName,
    scientificName: input.scientificName,
    taxonGroup: input.taxonGroup,
    ...(input.subClassification
      ? { subClassification: input.subClassification }
      : {}),
    legalDesignations: input.legalDesignations,
    photo: toMockPhoto(input.photo, speciesFileKey(id)),
  }
}

function readSpeciesRecords(): SpeciesRecord[] {
  const storedSpecies = readStoredSpecies()
  const storedById = new Map(
    storedSpecies.map((species) => [species.id, species]),
  )
  const mockIds = new Set(mockSpecies.map((species) => species.id))
  const createdSpecies = storedSpecies.filter(
    (species) => !mockIds.has(species.id),
  )
  const deletedIds = readDeletedSpeciesIds()

  return [
    ...mockSpecies.map((species) => storedById.get(species.id) ?? species),
    ...createdSpecies,
  ]
    .filter((species) => !deletedIds.has(species.id))
    .sort((a, b) => Number(a.id) - Number(b.id))
}

// 삭제된 id 도 포함해 최대 id + 1 을 쓴다. 삭제 기록과 겹치면 새 종이 조회에서 빠진다.
function nextSpeciesId(): string {
  const ids = [
    ...mockSpecies.map((species) => species.id),
    ...readStoredSpecies().map((species) => species.id),
    ...readDeletedSpeciesIds(),
  ].map(Number)
  return String(Math.max(0, ...ids) + 1)
}

function consumeFailure(failure: SpeciesFailure): boolean {
  if (localStorage.getItem(speciesFailStorageKey) !== failure) return false
  localStorage.removeItem(speciesFailStorageKey)
  return true
}

function writeStoredSpecies(records: SpeciesRecord[]) {
  localStorage.setItem(speciesStorageKey, JSON.stringify(records))
}

function readStoredSpecies(): SpeciesRecord[] {
  const rawSpecies = localStorage.getItem(speciesStorageKey)
  if (!rawSpecies) return []

  try {
    const species: unknown = JSON.parse(rawSpecies)
    return Array.isArray(species) ? species.filter(isSpeciesRecord) : []
  } catch {
    return []
  }
}

function readDeletedSpeciesIds(): Set<string> {
  const rawIds = localStorage.getItem(deletedSpeciesStorageKey)
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

function isSpeciesRecord(value: unknown): value is SpeciesRecord {
  if (!value || typeof value !== 'object') return false

  const species = value as Record<string, unknown>
  return (
    typeof species.id === 'string' &&
    typeof species.koreanName === 'string' &&
    typeof species.englishName === 'string' &&
    typeof species.scientificName === 'string' &&
    isTaxonGroup(species.taxonGroup) &&
    (species.subClassification === undefined ||
      typeof species.subClassification === 'string') &&
    Array.isArray(species.legalDesignations) &&
    species.legalDesignations.every((name) => typeof name === 'string') &&
    isPhoto(species.photo)
  )
}

function isTaxonGroup(value: unknown): value is TaxonGroup {
  return taxonGroups.some((taxonGroup) => taxonGroup === value)
}
