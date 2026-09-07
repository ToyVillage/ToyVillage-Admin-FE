// 작성된 업무일지 한 건. 목록 표의 `작성자`/`양식`/`날짜` 열에 대응한다.
export interface WorkLog {
  id: string
  authorName: string
  formName: string
  /** YYYY-MM-DD */
  date: string
}

// 일지 작성에 쓰이는 양식. 목록 표의 `양식`/`작성자`/`날짜` 열에 대응한다.
export interface WorkLogForm {
  id: string
  name: string
  authorName: string
  /** YYYY-MM-DD */
  date: string
}

// 조회날짜 필터. 년/월/일 셀렉트 3개가 함께 움직인다.
export interface WorkLogDate {
  year: number
  /** 1-12 */
  month: number
  /** 1-31 */
  day: number
}
