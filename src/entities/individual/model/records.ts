// 개체 레코드 저장소(fixture + localStorage override + 삭제 기록). 종을 보지 않는 계층이라
// 개체 mock 과 종 mock 의 마리수 파생이 함께 쓴다 — 두 mock 이 서로를 import 하지 않게 여기에 둔다.
import { isPhoto, mockPhotoUrl } from '@/entities/species/model/mockPhoto'
import { individualSexes } from './types'
import type { Individual, IndividualSex } from './types'

export const individualStorageKey = 'toyvillage:individuals'
export const deletedIndividualStorageKey = 'toyvillage:individuals:deleted'

interface IndividualRow {
  id: string
  speciesId: string
  name: string
  sex: IndividualSex
  birthYear: number
  note?: string
}

// 종 mock 13종 기준 마리수: 1 → 3 · 2 → 12(2페이지) · 3 → 2 · 4~12 → 각 1 · 13 → 0(빈 상태).
// 개체 1~3 은 개체관리 공통 fixture 다.
const individualRows: IndividualRow[] = [
  {
    id: '1',
    speciesId: '1',
    name: '동식이',
    sex: 'MALE',
    birthYear: 2019,
    note: '알락꼬리여우원숭이와 합사 중',
  },
  { id: '2', speciesId: '1', name: '미미', sex: 'FEMALE', birthYear: 2020 },
  { id: '3', speciesId: '1', name: '두리', sex: 'MALE', birthYear: 2021 },
  { id: '4', speciesId: '2', name: '핑키', sex: 'FEMALE', birthYear: 2016 },
  { id: '5', speciesId: '2', name: '노을', sex: 'MALE', birthYear: 2016 },
  { id: '6', speciesId: '2', name: '산호', sex: 'FEMALE', birthYear: 2017 },
  { id: '7', speciesId: '2', name: '체리', sex: 'UNKNOWN', birthYear: 2018 },
  { id: '8', speciesId: '2', name: '연지', sex: 'FEMALE', birthYear: 2018 },
  { id: '9', speciesId: '2', name: '자몽', sex: 'MALE', birthYear: 2019 },
  { id: '10', speciesId: '2', name: '딸기', sex: 'FEMALE', birthYear: 2019 },
  { id: '11', speciesId: '2', name: '봄비', sex: 'UNKNOWN', birthYear: 2020 },
  { id: '12', speciesId: '2', name: '새벽', sex: 'MALE', birthYear: 2021 },
  { id: '13', speciesId: '2', name: '복숭아', sex: 'FEMALE', birthYear: 2022 },
  { id: '14', speciesId: '2', name: '분홍이', sex: 'MALE', birthYear: 2022 },
  { id: '15', speciesId: '2', name: '홍시', sex: 'UNKNOWN', birthYear: 2023 },
  { id: '16', speciesId: '3', name: '반달이', sex: 'MALE', birthYear: 2015 },
  { id: '17', speciesId: '3', name: '곰순이', sex: 'FEMALE', birthYear: 2017 },
  { id: '18', speciesId: '4', name: '럭키', sex: 'MALE', birthYear: 2018 },
  { id: '19', speciesId: '5', name: '망고', sex: 'FEMALE', birthYear: 2020 },
  { id: '20', speciesId: '6', name: '레오', sex: 'MALE', birthYear: 2019 },
  { id: '21', speciesId: '7', name: '느림보', sex: 'UNKNOWN', birthYear: 2012 },
  { id: '22', speciesId: '8', name: '용용', sex: 'MALE', birthYear: 2021 },
  { id: '23', speciesId: '9', name: '볼리', sex: 'FEMALE', birthYear: 2020 },
  {
    id: '24',
    speciesId: '10',
    name: '파랑이',
    sex: 'UNKNOWN',
    birthYear: 2014,
  },
  { id: '25', speciesId: '11', name: '뒤뚱이', sex: 'MALE', birthYear: 2022 },
  {
    id: '26',
    speciesId: '12',
    name: '주황이',
    sex: 'UNKNOWN',
    birthYear: 2024,
  },
]

const mockIndividuals: Individual[] = individualRows.map((row) => ({
  ...row,
  photo: {
    fileName: `${row.name}_2026.jpg`,
    fileKey: individualFileKey(row.id),
    url: mockPhotoUrl,
  },
}))

/**
 * 종 mock 의 마리수 파생용. 종 삭제 여부는 보지 않는다 —
 * `getMockSpecies` 가 이 함수를 쓰므로 여기서 종을 조회하면 순환한다.
 */
export function countMockIndividualsBySpecies(): Map<string, number> {
  const counts = new Map<string, number>()
  for (const individual of readIndividualRecords()) {
    counts.set(
      individual.speciesId,
      (counts.get(individual.speciesId) ?? 0) + 1,
    )
  }
  return counts
}

export function individualFileKey(id: string) {
  return `mock-individual-${id}`
}

/** 삭제된 개체를 뺀 전체 개체를 id 오름차순으로 준다. 종 삭제 여부는 보지 않는다. */
export function readIndividualRecords(): Individual[] {
  const storedIndividuals = readStoredIndividuals()
  const storedById = new Map(
    storedIndividuals.map((individual) => [individual.id, individual]),
  )
  const mockIds = new Set(mockIndividuals.map((individual) => individual.id))
  const createdIndividuals = storedIndividuals.filter(
    (individual) => !mockIds.has(individual.id),
  )
  const deletedIds = readDeletedIndividualIds()

  return [
    ...mockIndividuals.map(
      (individual) => storedById.get(individual.id) ?? individual,
    ),
    ...createdIndividuals,
  ]
    .filter((individual) => !deletedIds.has(individual.id))
    .sort((a, b) => Number(a.id) - Number(b.id))
}

// 삭제된 id 도 포함해 최대 id + 1 을 쓴다. 삭제 기록과 겹치면 새 개체가 조회에서 빠진다.
export function nextIndividualId(): string {
  const ids = [
    ...mockIndividuals.map((individual) => individual.id),
    ...readStoredIndividuals().map((individual) => individual.id),
    ...readDeletedIndividualIds(),
  ].map(Number)
  return String(Math.max(0, ...ids) + 1)
}

export function writeStoredIndividuals(individuals: Individual[]) {
  localStorage.setItem(individualStorageKey, JSON.stringify(individuals))
}

export function readStoredIndividuals(): Individual[] {
  const rawIndividuals = localStorage.getItem(individualStorageKey)
  if (!rawIndividuals) return []

  try {
    const individuals: unknown = JSON.parse(rawIndividuals)
    return Array.isArray(individuals) ? individuals.filter(isIndividual) : []
  } catch {
    return []
  }
}

export function readDeletedIndividualIds(): Set<string> {
  const rawIds = localStorage.getItem(deletedIndividualStorageKey)
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

function isIndividual(value: unknown): value is Individual {
  if (!value || typeof value !== 'object') return false

  const individual = value as Record<string, unknown>
  return (
    typeof individual.id === 'string' &&
    typeof individual.speciesId === 'string' &&
    typeof individual.name === 'string' &&
    individualSexes.some((sex) => sex === individual.sex) &&
    typeof individual.birthYear === 'number' &&
    (individual.note === undefined || typeof individual.note === 'string') &&
    isPhoto(individual.photo)
  )
}
