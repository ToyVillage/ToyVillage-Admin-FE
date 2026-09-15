// 종 mock 을 단방향으로 참조한다(삭제된 종의 개체 제외). 마리수 파생이 쓰는 레코드 계층은
// `./records` 에 있어 종 mock 과 순환하지 않는다. 공개 index 끼리 순환하지 않게 model 을 직접 import 한다.
import { getMockSpecies } from '@/entities/species/model/mock'
import { toMockPhoto } from '@/entities/species/model/mockPhoto'
import {
  individualFileKey,
  nextIndividualId,
  readDeletedIndividualIds,
  readIndividualRecords,
  readStoredIndividuals,
  writeStoredIndividuals,
  deletedIndividualStorageKey,
} from './records'
import type {
  CreateIndividualInput,
  Individual,
  UpdateIndividualInput,
} from './types'

// 실패 경로 검증용 주입 플래그. mock 은 항상 성공하므로,
// 이 localStorage 키에 'delete' | 'create' | 'update' 를 넣으면 다음 해당 요청이 한 번 실패한다.
// 실제 API 연동(/api) 시 제거한다.
export const individualFailStorageKey = 'toyvillage:individuals:fail'

type IndividualFailure = 'delete' | 'create' | 'update'

/** 그 종의 개체를 id 오름차순으로 준다. 삭제된 개체와 삭제된 종의 개체는 뺀다. */
export async function getMockIndividuals(
  speciesId: string,
): Promise<Individual[]> {
  if (!(await getMockSpecies(speciesId))) return []
  return readIndividualRecords().filter(
    (individual) => individual.speciesId === speciesId,
  )
}

/** 없는 id, 삭제된 개체, 삭제된 종에 속한 개체는 `null` 이다. */
export async function getMockIndividual(
  individualId: string,
): Promise<Individual | null> {
  const individual = readIndividualRecords().find(
    (record) => record.id === individualId,
  )
  if (!individual) return null
  return (await getMockSpecies(individual.speciesId)) ? individual : null
}

export async function createMockIndividual(
  input: CreateIndividualInput,
): Promise<Individual> {
  if (consumeFailure('create')) throw new Error('create failed')
  if (!(await getMockSpecies(input.speciesId))) {
    throw new Error('Species not found')
  }

  const individual = toIndividual(nextIndividualId(), input.speciesId, input)
  writeStoredIndividuals([...readStoredIndividuals(), individual])

  return individual
}

export async function updateMockIndividual({
  id,
  input,
}: {
  id: string
  input: UpdateIndividualInput
}): Promise<Individual> {
  if (consumeFailure('update')) throw new Error('update failed')

  const currentIndividual = await getMockIndividual(id)
  if (!currentIndividual) throw new Error('Individual not found')

  const individual = toIndividual(id, currentIndividual.speciesId, input)
  writeStoredIndividuals([
    ...readStoredIndividuals().filter((record) => record.id !== id),
    individual,
  ])

  return individual
}

/** 삭제 id 만 기록한다. 그 개체의 관찰은 관찰 mock 이 조회에서 뺀다. */
export async function deleteMockIndividual(
  individualId: string,
): Promise<void> {
  if (consumeFailure('delete')) throw new Error('delete failed')

  const currentIndividual = await getMockIndividual(individualId)
  if (!currentIndividual) throw new Error('Individual not found')

  const deletedIds = readDeletedIndividualIds()
  deletedIds.add(individualId)

  writeStoredIndividuals(
    readStoredIndividuals().filter((record) => record.id !== individualId),
  )
  localStorage.setItem(
    deletedIndividualStorageKey,
    JSON.stringify([...deletedIds]),
  )
}

function toIndividual(
  id: string,
  speciesId: string,
  input: UpdateIndividualInput,
): Individual {
  return {
    id,
    speciesId,
    name: input.name,
    sex: input.sex,
    birthYear: input.birthYear,
    ...(input.note ? { note: input.note } : {}),
    photo: toMockPhoto(input.photo, individualFileKey(id)),
  }
}

function consumeFailure(failure: IndividualFailure): boolean {
  if (localStorage.getItem(individualFailStorageKey) !== failure) return false
  localStorage.removeItem(individualFailStorageKey)
  return true
}
