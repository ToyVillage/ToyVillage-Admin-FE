import type { OperatingHours, UpdateOperatingHoursInput } from './types'

export const operatingHoursStorageKey = 'toyvillage:operating-hours'

export function getDefaultOperatingHours(date: string): OperatingHours {
  return {
    id: null,
    date,
    opensAt: '07:40',
    closesAt: '19:40',
  }
}

export async function getMockOperatingHours(
  date: string,
): Promise<OperatingHours> {
  return readOperatingHours()[date] ?? getDefaultOperatingHours(date)
}

export async function updateMockOperatingHours(
  input: UpdateOperatingHoursInput,
): Promise<OperatingHours> {
  const hoursByDate = readOperatingHours()
  localStorage.setItem(
    operatingHoursStorageKey,
    JSON.stringify({ ...hoursByDate, [input.date]: input }),
  )
  return input
}

function readOperatingHours(): Record<string, OperatingHours> {
  const rawHours = localStorage.getItem(operatingHoursStorageKey)
  if (!rawHours) return {}

  try {
    const parsedHours: unknown = JSON.parse(rawHours)
    if (!parsedHours || typeof parsedHours !== 'object') return {}

    return Object.fromEntries(
      Object.entries(parsedHours).filter(
        (entry): entry is [string, OperatingHours] =>
          isOperatingHours(entry[1]),
      ),
    )
  } catch {
    return {}
  }
}

function isOperatingHours(value: unknown): value is OperatingHours {
  if (!value || typeof value !== 'object') return false

  const hours = value as Record<string, unknown>
  return (
    typeof hours.date === 'string' &&
    typeof hours.opensAt === 'string' &&
    typeof hours.closesAt === 'string'
  )
}
