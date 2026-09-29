export interface OperatingHours {
  /** 운영시간 ID. 그 날짜에 저장값이 없으면 null(서버 기본값) */
  id: number | null
  date: string
  opensAt: string
  closesAt: string
}

export type UpdateOperatingHoursInput = OperatingHours
