import { toIsoDate, todayCalendarDate } from '@/shared/lib'
import type { AnimalSpecies, FeedRecordDetail } from './types'

// 슬라이스용 mock. 추후 TanStack Query + Axios로 대체.
// 기본 진입(오늘)에서 Figma `748:14288` 과 같은 목록이 보이도록 오늘 날짜로 생성한다.
// 페이지네이션(1·2)이 재현되도록 오늘 급여 내역을 6건 둔다.
const todayRows = [
  {
    species: '포유류' as AnimalSpecies,
    animalType: '표범',
    animalName: '레오',
    feedType: '생닭',
    feedAmount: '1.2kg',
    feederName: '김수인',
    fedTime: '09:30',
    note: '평소보다 식욕이 왕성함. 잔반 없음.',
  },
  {
    species: '포유류' as AnimalSpecies,
    animalType: '사자',
    animalName: '심바',
    feedType: '소고기',
    feedAmount: '3.0kg',
    feederName: '박도현',
    fedTime: '09:10',
    note: '정상',
  },
  {
    species: '포유류' as AnimalSpecies,
    animalType: '호랑이',
    animalName: '라라',
    feedType: '닭가슴살',
    feedAmount: '2.5kg',
    feederName: '김수인',
    fedTime: '08:40',
    note: '잔반 없음',
  },
  {
    species: '포유류' as AnimalSpecies,
    animalType: '곰',
    animalName: '우니',
    feedType: '사료',
    feedAmount: '1.8kg',
    feederName: '이서준',
    fedTime: '08:20',
    note: '정상',
  },
  {
    species: '파충류' as AnimalSpecies,
    animalType: '이구아나',
    animalName: '동식이',
    feedType: '채소',
    feedAmount: '0.3kg',
    feederName: '김수인',
    fedTime: '08:00',
    note: '평소보다 식욕이 왕성하고 활동량이 많아 보임. 잔반 없음.',
  },
  {
    species: '조류' as AnimalSpecies,
    animalType: '앵무',
    animalName: '초코',
    feedType: '견과',
    feedAmount: '0.1kg',
    feederName: '이서준',
    fedTime: '07:40',
    note: '정상',
  },
]

// 급여 이력이 없는 개체(엣지 케이스). 마지막 항목은 이력을 비워 둔다.
const noHistoryIndex = todayRows.length - 1

export const mockFeeds: FeedRecordDetail[] = todayRows.map((row, index) => {
  const fedDate = toIsoDate(todayCalendarDate())
  const id = `feed-${index + 1}`

  return {
    id,
    species: row.species,
    animalType: row.animalType,
    animalName: row.animalName,
    feedType: row.feedType,
    feedAmount: row.feedAmount,
    feederName: row.feederName,
    fedDate,
    fedTime: row.fedTime,
    note: row.note,
    history:
      index === noHistoryIndex
        ? []
        : [
            {
              id: `${id}-h1`,
              fedDate,
              fedTime: row.fedTime,
              feederName: row.feederName,
              feedType: row.feedType,
              feedAmount: row.feedAmount,
              note: row.note,
            },
            {
              id: `${id}-h2`,
              fedDate: shiftIsoDate(fedDate, -1),
              fedTime: '17:20',
              feederName: '김수인',
              feedType: '닭가슴살',
              feedAmount: '2.5kg',
              note: '잔반 없음',
            },
            {
              id: `${id}-h3`,
              fedDate: shiftIsoDate(fedDate, -2),
              fedTime: '09:15',
              feederName: '박도현',
              feedType: '소고기',
              feedAmount: '3.0kg',
              note: '정상',
            },
          ],
  }
})

export async function getMockFeeds(
  isoDate: string,
  species: AnimalSpecies | null,
): Promise<FeedRecordDetail[]> {
  return mockFeeds.filter(
    (feed) =>
      feed.fedDate === isoDate &&
      (species == null || feed.species === species),
  )
}

export async function getMockFeedDetail(
  id: string,
): Promise<FeedRecordDetail | null> {
  return mockFeeds.find((feed) => feed.id === id) ?? null
}

function shiftIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const shifted = new Date(year, month - 1, day + days)
  return toIsoDate({
    year: shifted.getFullYear(),
    month: shifted.getMonth() + 1,
    day: shifted.getDate(),
  })
}
