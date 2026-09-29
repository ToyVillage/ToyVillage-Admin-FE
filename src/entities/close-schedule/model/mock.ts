import type {
  CloseSchedule,
  CreateCloseScheduleInput,
  UpdateCloseScheduleInput,
} from './types'

export const closeScheduleStorageKey = 'toyvillage:close-schedules'

interface DeletedCloseSchedule {
  id: string
  deleted: true
}

type StoredCloseSchedule = CloseSchedule | DeletedCloseSchedule

export const mockCloseSchedules: CloseSchedule[] = [
  {
    id: 'animal-checkup',
    startDate: '2026-07-13',
    endDate: '2026-07-14',
    title: '토이빌리지 동물 정기검진',
  },
  {
    id: 'seunghyun-birthday',
    startDate: '2026-07-13',
    endDate: '2026-07-13',
    title: '이승현 생일',
  },
  {
    id: 'hansaem-birthday',
    startDate: '2026-03-23',
    endDate: '2026-03-23',
    title: '이한샘 생일',
  },
  {
    id: 'jeonguk-birthday',
    startDate: '2026-07-09',
    endDate: '2026-07-09',
    title: '김정욱 생일',
  },
  {
    id: 'dayeon-birthday',
    startDate: '2026-08-25',
    endDate: '2026-08-25',
    title: '이다연 생일',
  },
]

export async function getMockCloseSchedules(): Promise<CloseSchedule[]> {
  const deletedIds = new Set(
    readStoredEntries()
      .filter(isDeletedCloseSchedule)
      .map(({ id }) => id),
  )
  const schedulesById = new Map(
    mockCloseSchedules
      .filter((schedule) => !deletedIds.has(schedule.id))
      .map((schedule) => [schedule.id, schedule]),
  )

  for (const schedule of readStoredSchedules()) {
    schedulesById.set(schedule.id, schedule)
  }

  return [...schedulesById.values()]
}

export async function getMockCloseSchedule(
  id: string,
): Promise<CloseSchedule | undefined> {
  const schedules = await getMockCloseSchedules()
  return schedules.find((schedule) => schedule.id === id)
}

export async function createMockCloseSchedule(
  input: CreateCloseScheduleInput,
): Promise<CloseSchedule> {
  const schedule = {
    id: `created-${crypto.randomUUID()}`,
    ...input,
  }
  const entries = readStoredEntries()

  localStorage.setItem(
    closeScheduleStorageKey,
    JSON.stringify([...entries, schedule]),
  )

  return schedule
}

export async function updateMockCloseSchedule(
  input: UpdateCloseScheduleInput,
): Promise<CloseSchedule> {
  const currentSchedule = await getMockCloseSchedule(input.id)
  if (!currentSchedule) throw new Error('Close schedule not found')

  const nextSchedules = readStoredEntries().filter(
    (schedule) => schedule.id !== input.id,
  )
  nextSchedules.push(input)

  localStorage.setItem(closeScheduleStorageKey, JSON.stringify(nextSchedules))
  return input
}

export async function deleteMockCloseSchedule(id: string): Promise<void> {
  const currentSchedule = await getMockCloseSchedule(id)
  if (!currentSchedule) throw new Error('Close schedule not found')

  const nextSchedules: StoredCloseSchedule[] = readStoredEntries().filter(
    (schedule) => schedule.id !== id,
  )
  nextSchedules.push({ id, deleted: true })

  localStorage.setItem(closeScheduleStorageKey, JSON.stringify(nextSchedules))
}

function readStoredSchedules(): CloseSchedule[] {
  return readStoredEntries().filter(isCloseSchedule)
}

function readStoredEntries(): StoredCloseSchedule[] {
  const rawSchedules = localStorage.getItem(closeScheduleStorageKey)
  if (!rawSchedules) return []

  try {
    const schedules: unknown = JSON.parse(rawSchedules)
    return Array.isArray(schedules)
      ? schedules.filter(
          (schedule): schedule is StoredCloseSchedule =>
            isCloseSchedule(schedule) || isDeletedCloseSchedule(schedule),
        )
      : []
  } catch {
    return []
  }
}

function isDeletedCloseSchedule(value: unknown): value is DeletedCloseSchedule {
  if (!value || typeof value !== 'object') return false

  const schedule = value as Record<string, unknown>
  return typeof schedule.id === 'string' && schedule.deleted === true
}

function isCloseSchedule(value: unknown): value is CloseSchedule {
  if (!value || typeof value !== 'object') return false

  const schedule = value as Record<string, unknown>
  return (
    typeof schedule.id === 'string' &&
    typeof schedule.startDate === 'string' &&
    typeof schedule.endDate === 'string' &&
    typeof schedule.title === 'string'
  )
}
