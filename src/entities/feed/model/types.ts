// 개체 분류. 목록 화면의 탭 순서와 같다(Figma `animal species` 1443:15023).
export const animalSpeciesList = ['포유류', '파충류', '조류', '어류'] as const
export type AnimalSpecies = (typeof animalSpeciesList)[number]

// 탭 라벨 → 목록 조회의 `animalTaxonomic` query 값.
export const animalTaxonomicBySpecies = {
  포유류: 'MAMMALS',
  파충류: 'REPTILES',
  조류: 'BIRDS',
  어류: 'FISH',
} as const satisfies Record<AnimalSpecies, string>

// 급여 기록 한 건. 목록 표의 `대상 개체`/`먹이 종류 · 급여량`/`급여자`/`급여일시` 열에 대응한다.
export interface FeedRecord {
  id: string
  /**
   * 개체 분류. 목록·상세 응답에는 없고 조회 시 고른 분류 탭에서 온다.
   * `전체` 탭이나 상세 단독 진입이면 비어 있다.
   */
  species?: AnimalSpecies
  /** 종. `표범` */
  animalType: string
  /** 개체명. `레오` */
  animalName: string
  /** 먹이 종류. `생닭` */
  feedType: string
  /** 급여량 표기. 명세는 정수라 `1kg` 형태다. */
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
  /**
   * 특이사항. admin 급여 API 3개에는 `significant` 가 없어 채울 수 없다.
   * 서버가 내려주기 전까지 빈 값이다.
   */
  note: string
}

// `/feeds/:id` 상세. 급여 기록 하나와 그 개체의 급여 이력이다.
export interface FeedRecordDetail extends FeedRecord {
  /** 개체 id(`animalManageId`). 급여 이력 조회의 키다. */
  animalManageId: number
  /** 특이사항. 목록·이력과 같은 이유로 빈 값이다. */
  note: string
  animalPhotoUrl?: string
  history: FeedHistoryRecord[]
}
