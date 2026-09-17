import {
  mockAnimals,
  type MockAnimal,
  type MockObservation,
} from './animal-manage-api'

// 관찰 API 시나리오 fixture — 개체 7(`체리`)을 종 1 로 옮기고 관찰 12건을 둔다.
// 최신 두 건은 31 `식욕 감소`(첨부 `obs/memo.pdf`)·30 `체중 측정`이다.

export const observationIndividualUrl = '/species/1/individuals/7'

export function observationAnimals(): MockAnimal[] {
  return mockAnimals().map((animal) =>
    animal.id === 7 ? { ...animal, kindId: 1 } : animal,
  )
}

export function observationFixture(): MockObservation[] {
  const older = Array.from({ length: 10 }, (_, index) => ({
    id: 20 + index,
    animalId: 7,
    title: `관찰 ${20 + index}`,
    content: `관찰 ${20 + index}`,
    createdAt: `2026-08-${String(10 + index).padStart(2, '0')}`,
    authorName: '박사육',
    files: [],
  }))

  return [
    {
      id: 31,
      animalId: 7,
      title: '식욕 감소',
      content: '아침 급여량의\n절반만 먹음',
      createdAt: '2026-09-16',
      authorName: '김사육',
      files: [{ fileName: 'memo.pdf', fileKey: 'obs/memo.pdf' }],
    },
    {
      id: 30,
      animalId: 7,
      title: '체중 측정',
      content: '체중 측정',
      createdAt: '2026-09-15',
      authorName: '이사육',
      files: [],
    },
    ...older,
  ]
}
