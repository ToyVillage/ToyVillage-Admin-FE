// 공개 index 끼리 순환하지 않도록 개체 model 파일을 직접 import 한다.
import { getMockIndividual } from '@/entities/individual/model/mock'
import type {
  Observation,
  ObservationAttachment,
  UpdateObservationInput,
} from './types'

export const observationStorageKey = 'toyvillage:observations'
export const deletedObservationStorageKey = 'toyvillage:observations:deleted'

// 실패 경로 검증용 주입 플래그. mock 은 항상 성공하므로,
// 이 localStorage 키에 'delete' | 'update' 를 넣으면 다음 해당 요청이 한 번 실패한다.
// 실제 API 연동(/api) 시 제거한다.
export const observationFailStorageKey = 'toyvillage:observations:fail'

type ObservationFailure = 'delete' | 'update'

interface ObservationRow {
  id: string
  individualId: string
  observedAt: string
  observerName: string
  title: string
  attachmentNames: string[]
}

// 동식이(개체 1) 11건 → 한 페이지 10행이라 2페이지가 생긴다. 최신 3행이 Figma 3행과 같다.
// 미미(개체 2) 1건, 두리(개체 3)와 나머지 개체는 0건(빈 상태).
const observationRows: ObservationRow[] = [
  {
    id: '1',
    individualId: '1',
    observedAt: '2026-06-01',
    observerName: '김유영',
    title: '얼굴 콧잔등 부위 약 3cm 긁힌 상처 있음',
    attachmentNames: ['상처사진.jpg', '상처사진_측면.jpg', '처치기록.pdf'],
  },
  {
    id: '2',
    individualId: '1',
    observedAt: '2026-05-10',
    observerName: '김유영',
    title: '배변상태 평소보다 조금 묽음',
    attachmentNames: ['배변사진.jpg'],
  },
  {
    id: '3',
    individualId: '1',
    observedAt: '2026-04-22',
    observerName: '김유영',
    title: '식욕 정상, 활동량 양호',
    attachmentNames: [],
  },
  {
    id: '4',
    individualId: '1',
    observedAt: '2026-04-08',
    observerName: '이승현',
    title: '체중 측정 결과 평소와 비슷함',
    attachmentNames: [],
  },
  {
    id: '5',
    individualId: '1',
    observedAt: '2026-03-27',
    observerName: '김수인',
    title: '발톱 손질 완료',
    attachmentNames: ['발톱손질.png'],
  },
  {
    id: '6',
    individualId: '1',
    observedAt: '2026-03-15',
    observerName: '김유영',
    title: '합사 개체와 다툼 흔적 없음',
    attachmentNames: [],
  },
  {
    id: '7',
    individualId: '1',
    observedAt: '2026-03-02',
    observerName: '이지아',
    title: '등 부위 피부 건조 증상 관찰',
    attachmentNames: ['피부상태.jpg', '피부상태_근접.jpg'],
  },
  {
    id: '8',
    individualId: '1',
    observedAt: '2026-02-18',
    observerName: '이승현',
    title: '수영장 이용 시간 증가',
    attachmentNames: [],
  },
  {
    id: '9',
    individualId: '1',
    observedAt: '2026-02-04',
    observerName: '김유영',
    title: '예방접종 후 특이반응 없음',
    attachmentNames: ['접종기록.pdf'],
  },
  {
    id: '10',
    individualId: '1',
    observedAt: '2026-01-21',
    observerName: '김수인',
    title: '털빠짐 부위 감소',
    attachmentNames: [],
  },
  {
    id: '11',
    individualId: '1',
    observedAt: '2026-01-07',
    observerName: '이지아',
    title: '겨울철 실내 적응 양호',
    attachmentNames: [],
  },
  {
    id: '12',
    individualId: '2',
    observedAt: '2026-05-28',
    observerName: '김유영',
    title: '귀 뒤 작은 딱지 확인',
    attachmentNames: ['귀상태.jpg'],
  },
]

// 관찰사항은 Figma 관찰 상세 값처럼 제목과 같은 문장으로 둔다.
const mockObservations: Observation[] = observationRows.map(
  ({ attachmentNames, ...row }) => ({
    ...row,
    content: row.title,
    attachments: attachmentNames.map((fileName, index) => ({
      fileName,
      fileKey: `mock-observation-${row.id}-${index + 1}`,
    })),
  }),
)

/** 날짜 내림차순, 같은 날짜는 id 내림차순. 삭제된 관찰과 소속 개체가 없는 관찰은 뺀다. */
export async function getMockObservations(
  individualId: string,
): Promise<Observation[]> {
  if (!(await getMockIndividual(individualId))) return []
  return readObservationRecords()
    .filter((observation) => observation.individualId === individualId)
    .sort(
      (a, b) =>
        b.observedAt.localeCompare(a.observedAt) || Number(b.id) - Number(a.id),
    )
}

/** 없는 id, 삭제된 관찰, 소속 개체가 없는 관찰은 `null` 이다. */
export async function getMockObservation(
  observationId: string,
): Promise<Observation | null> {
  const observation = readObservationRecords().find(
    (record) => record.id === observationId,
  )
  if (!observation) return null
  return (await getMockIndividual(observation.individualId))
    ? observation
    : null
}

export async function updateMockObservation({
  id,
  input,
}: {
  id: string
  input: UpdateObservationInput
}): Promise<Observation> {
  if (consumeFailure('update')) throw new Error('update failed')

  const currentObservation = await getMockObservation(id)
  if (!currentObservation) throw new Error('Observation not found')

  const updatedObservation: Observation = {
    ...currentObservation,
    title: input.title,
    content: input.content,
    // 새 첨부의 키는 기존 키 규칙(`mock-observation-{id}-{n}`)을 따르면서 저장 시각으로 갈라
    // 이전 저장분과 겹치지 않게 한다(보안 컨텍스트가 없는 배포에서도 쓸 수 있어야 한다).
    attachments: input.attachments.map(
      (attachment, index): ObservationAttachment => ({
        fileName: attachment.fileName,
        fileKey:
          attachment.fileKey ??
          `mock-observation-${id}-${Date.now()}-${index + 1}`,
      }),
    ),
  }
  writeStoredObservations([
    ...readStoredObservations().filter((record) => record.id !== id),
    updatedObservation,
  ])

  return updatedObservation
}

export async function deleteMockObservation(
  observationId: string,
): Promise<void> {
  if (consumeFailure('delete')) throw new Error('delete failed')

  const currentObservation = await getMockObservation(observationId)
  if (!currentObservation) throw new Error('Observation not found')

  const deletedIds = readDeletedObservationIds()
  deletedIds.add(observationId)

  writeStoredObservations(
    readStoredObservations().filter((record) => record.id !== observationId),
  )
  localStorage.setItem(
    deletedObservationStorageKey,
    JSON.stringify([...deletedIds]),
  )
}

// 웹에는 관찰 등록이 없어 저장소에는 수정 override 만 있다.
function readObservationRecords(): Observation[] {
  const storedById = new Map(
    readStoredObservations().map((observation) => [
      observation.id,
      observation,
    ]),
  )
  const deletedIds = readDeletedObservationIds()

  return mockObservations
    .filter((observation) => !deletedIds.has(observation.id))
    .map((observation) => storedById.get(observation.id) ?? observation)
}

function consumeFailure(failure: ObservationFailure): boolean {
  if (localStorage.getItem(observationFailStorageKey) !== failure) return false
  localStorage.removeItem(observationFailStorageKey)
  return true
}

function writeStoredObservations(observations: Observation[]) {
  localStorage.setItem(observationStorageKey, JSON.stringify(observations))
}

function readStoredObservations(): Observation[] {
  const rawObservations = localStorage.getItem(observationStorageKey)
  if (!rawObservations) return []

  try {
    const observations: unknown = JSON.parse(rawObservations)
    return Array.isArray(observations) ? observations.filter(isObservation) : []
  } catch {
    return []
  }
}

function readDeletedObservationIds(): Set<string> {
  const rawIds = localStorage.getItem(deletedObservationStorageKey)
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

function isObservation(value: unknown): value is Observation {
  if (!value || typeof value !== 'object') return false

  const observation = value as Record<string, unknown>
  return (
    typeof observation.id === 'string' &&
    typeof observation.individualId === 'string' &&
    typeof observation.title === 'string' &&
    typeof observation.observedAt === 'string' &&
    typeof observation.observerName === 'string' &&
    typeof observation.content === 'string' &&
    Array.isArray(observation.attachments) &&
    observation.attachments.every(isObservationAttachment)
  )
}

function isObservationAttachment(
  value: unknown,
): value is ObservationAttachment {
  if (!value || typeof value !== 'object') return false

  const attachment = value as Record<string, unknown>
  return (
    typeof attachment.fileName === 'string' &&
    typeof attachment.fileKey === 'string'
  )
}
