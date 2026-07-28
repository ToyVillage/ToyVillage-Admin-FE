import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import {
  getMockCloseSchedule,
  type CloseSchedule,
} from '@/entities/close-schedule'
import { CloseScheduleForm } from '@/features/create-close-schedule'
import { CloseScheduleFormPage } from './ui/CloseScheduleFormPage'

export function EditCloseSchedulePage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { data: schedule, isPending } = useQuery({
    queryKey: ['close-schedules', id],
    queryFn: async () => {
      const cachedSchedules = queryClient.getQueryData<CloseSchedule[]>([
        'close-schedules',
      ])
      const cachedSchedule = cachedSchedules?.find(
        (schedule) => schedule.id === id,
      )

      return cachedSchedule ?? getMockCloseSchedule(id ?? '')
    },
    enabled: Boolean(id),
  })

  if (!id) return <Navigate to="/notices/guide" replace />
  if (isPending) return null
  if (!schedule) return <Navigate to="/notices/guide" replace />

  return (
    <CloseScheduleFormPage>
      <CloseScheduleForm initialSchedule={schedule} />
    </CloseScheduleFormPage>
  )
}
