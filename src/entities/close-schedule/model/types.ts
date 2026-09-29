export interface CloseSchedule {
  id: string
  startDate: string
  endDate: string
  title: string
}

export type CreateCloseScheduleInput = Omit<CloseSchedule, 'id'>

export type UpdateCloseScheduleInput = CloseSchedule
