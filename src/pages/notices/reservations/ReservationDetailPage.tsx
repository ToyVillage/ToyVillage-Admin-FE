import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import {
  ReservationInfoCard,
  deleteReservationPermission,
  getReservation,
  getReservationPermissions,
  type Staff,
} from '@/entities/reservation'
import { ReservationAccessCard } from './ui/ReservationAccessCard'
import { ReservationBackLink } from './ui/ReservationBackLink'
import { RemoveAccessConfirmDialog } from './ui/RemoveAccessConfirmDialog'

export function ReservationDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [staffQuery, setStaffQuery] = useState('')
  const [removalTarget, setRemovalTarget] = useState<Staff | null>(null)

  const { data: reservation, isPending: reservationPending } = useQuery({
    queryKey: ['reservations', id],
    queryFn: () => getReservation({ id: Number(id) }),
    enabled: Boolean(id),
    retry: false,
  })

  const { data: accessStaff = [] } = useQuery({
    queryKey: ['reservations', id, 'access'],
    queryFn: () => getReservationPermissions(Number(id)),
    enabled: Boolean(id),
    retry: false,
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      deleteReservationPermission({ reservationId: Number(id), userId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['reservations', id, 'access'],
      })
      setRemovalTarget(null)
    },
  })

  const filteredStaff = useMemo(() => {
    const keyword = staffQuery.trim().toLowerCase()
    if (!keyword) return accessStaff
    return accessStaff.filter((member) =>
      member.name.toLowerCase().includes(keyword),
    )
  }, [accessStaff, staffQuery])

  function requestRemove(staffId: string) {
    const target = accessStaff.find((member) => member.id === staffId)
    if (target) setRemovalTarget(target)
  }

  function confirmRemove() {
    if (removalTarget) {
      removeMutation.mutate(removalTarget.id)
    }
  }

  if (reservationPending) {
    return (
      <StatePage>
        <StateCard role="status">예약 정보를 불러오는 중입니다.</StateCard>
      </StatePage>
    )
  }

  if (!reservation) {
    return (
      <StatePage>
        <StateCard>
          <StateTitle>예약을 찾을 수 없습니다.</StateTitle>
          <ReservationBackLink />
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <ReservationBackLink />
        <Cards>
          <ReservationInfoCard reservation={reservation} />
          <ReservationAccessCard
            staff={filteredStaff}
            query={staffQuery}
            onQueryChange={setStaffQuery}
            removing={removeMutation.isPending}
            onRemove={requestRemove}
          />
        </Cards>
      </Content>

      {removalTarget && (
        <RemoveAccessConfirmDialog
          pending={removeMutation.isPending}
          onCancel={() => setRemovalTarget(null)}
          onConfirm={confirmRemove}
        />
      )}
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 66px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  gap: 32px;
  margin: 0 auto;
  padding-top: 76px;

  @media (max-width: 980px) {
    padding-top: 88px;
  }
`

const Cards = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;

  @media (max-width: 980px) {
    flex-direction: column;

    & > * {
      width: 100%;
    }
  }
`

const StatePage = styled.main`
  display: grid;
  min-height: 100vh;
  padding: 32px;
  place-items: center;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const StateCard = styled.section`
  display: flex;
  width: min(100%, 560px);
  flex-direction: column;
  gap: 24px;
  padding: 48px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  text-align: center;
`

const StateTitle = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
`
