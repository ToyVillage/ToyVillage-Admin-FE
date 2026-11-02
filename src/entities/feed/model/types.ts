// 먹이 급여는 층마다 앱 입력 양식이 다르다(Linear TOY-67).
// 4층: 급여 일시·먹이 종류·급여량·잔량·특이사항 / 5층: 급여 날짜·먹이 종류·급여량
export const feedFloors = ['4', '5'] as const
export type FeedFloor = (typeof feedFloors)[number]

/** 층 탭·뱃지 라벨 */
export const feedFloorLabels = {
  '4': '4층',
  '5': '5층',
} as const satisfies Record<FeedFloor, string>

/** 앱이 고르는 급여량·잔량 단위. `GML` = g/ml, `KGL` = kg/l */
export type FeedUnit = 'GML' | 'KGL'

// 목록 표의 행. 5층에는 급여 시각·잔량·특이사항이 없다(빈 값).
export interface FeedRecord {
  id: string
  floor: FeedFloor
  /** 일반명(종). `카피바라` */
  animalType: string
  /** 개체명. `동식이` */
  animalName: string
  /** 먹이 종류. `염소사료` */
  feedType: string
  feedAmount: number
  /** 잔량. 5층이거나 잔량 도입 전 기록은 null 이다. */
  remainingAmount: number | null
  unit: FeedUnit
  /** 특이사항. 없으면 빈 문자열이다(5층은 항상 빈 문자열). */
  note: string
  feederName: string
  /** YYYY-MM-DD */
  fedDate: string
  /** HH:mm. 5층은 빈 문자열이다. */
  fedTime: string
}

// 개체별 급여 이력 표의 행.
export type FeedHistoryRecord = Omit<FeedRecord, 'animalType' | 'animalName'>

// 급여 기록 상세·수정 화면.
export interface FeedRecordDetail extends FeedRecord {
  /** 개체 id(`animalManageId`). 개체별 급여 이력의 키다. */
  animalManageId: number
  /**
   * 수정 요청에 그대로 보내는 급여 시각 원본. 4층은 상세 응답의 `feedDateTime`,
   * 5층은 `feedDate` 다(화면에서 바꾸지 않는다).
   */
  fedAtValue: string
}
