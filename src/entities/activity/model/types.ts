// 전체 활동은 앱에서 입력한 기록을 날짜별로 모아 보여준다. 앱 입력 칸에 없는 값은 두지 않는다.

export type ActivityFloor = '4' | '5'

/** 앱이 고르는 급여량 단위. `GML` = g/ml, `KGL` = kg/l */
export type FeedUnit = 'GML' | 'KGL'

// 앱 4층 작성: 급여 날짜·급여 시간·먹이 급여량·먹이 종류·잔여량·특이사항
export interface FloorFourFeedActivity {
  id: string
  /** 일반명. `카피바라` */
  commonName: string
  /** 개체명. `동식이` */
  individualName: string
  /** HH:mm */
  fedTime: string
  feedType: string
  feedAmount: number
  /** 잔량 도입 전 기록은 null 이다. */
  remainingAmount: number | null
  unit: FeedUnit
  /** 없으면 빈 문자열 */
  note: string
  feederName: string
}

// 앱 5층 작성: 급여 날짜·먹이 종류·먹이 급여량
export interface FloorFiveFeedActivity {
  id: string
  commonName: string
  individualName: string
  feedType: string
  feedAmount: number
  unit: FeedUnit
  feederName: string
}

// 앱 개체 특이사항 작성: 제목·내용·첨부. 목록에는 내용을 싣지 않는다.
export interface ObservationActivity {
  id: string
  /** HH:mm */
  writtenTime: string
  commonName: string
  individualName: string
  title: string
  observerName: string
  attachmentCount: number
}

export interface WorkLogActivity {
  id: string
  /** HH:mm */
  writtenTime: string
  formName: string
  title: string
  writerName: string
  attachmentCount: number
}
