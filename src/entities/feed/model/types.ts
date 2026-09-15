// 개체 분류. 목록 화면의 탭 순서와 같다(Figma `animal species` 1443:15023).
export const animalSpeciesList = ['포유류', '파충류', '조류', '어류'] as const
export type AnimalSpecies = (typeof animalSpeciesList)[number]

// 급여 기록 한 건. 목록 표의 `대상 개체`/`먹이 종류 · 급여량`/`급여자`/`급여일시` 열에 대응한다.
export interface FeedRecord {
  id: string
  species: AnimalSpecies
  /** 종. `표범` */
  animalType: string
  /** 개체명. `레오` */
  animalName: string
  /** 먹이 종류. `생닭` */
  feedType: string
  /** 급여량. `1.2kg` */
  feedAmount: string
  feederName: string
  /** YYYY-MM-DD */
  fedDate: string
  /** HH:mm */
  fedTime: string
}

// 상세 화면 아래 `급여 이력` 표의 행.
export interface FeedHistoryRecord {
  id: string
  /** YYYY-MM-DD */
  fedDate: string
  /** HH:mm */
  fedTime: string
  feederName: string
  feedType: string
  feedAmount: string
  note: string
}

// `/feeds/:id` 상세. 급여 기록 하나와 그 개체의 급여 이력이다.
export interface FeedRecordDetail extends FeedRecord {
  note: string
  animalPhotoUrl?: string
  history: FeedHistoryRecord[]
}
