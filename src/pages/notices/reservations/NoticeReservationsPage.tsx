import { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ReservationTable,
  deleteReservation,
  getAdminReservations,
  reservationStatusToCode,
  type ReservationSortCode,
  type ReservationStatus,
} from '@/entities/reservation'
import type { ReservationFormCompletion } from '@/features/reservation-form'
import { readPageParam, useListSearchParams } from '@/shared/lib'
import {
  DeleteConfirmationDialog,
  Toast,
  useFocusFrame,
  type ToastVariant,
} from '@/shared/ui'
import { deleteToastMessage, successToastMessage } from './model/toast'
import { serverMessage } from './model/serverMessage'
import { ReservationStatusCards } from './ui/ReservationStatusCards'
import { ReservationListSkeleton } from './ui/ReservationListSkeleton'

// 한 페이지에 노출할 예약 수. 서버에 size 로 전달하고 page 이동 시 page 로 재요청한다.
const PAGE_SIZE = 10
// 검색 입력 디바운스(ms). 입력이 멈춘 뒤에만 조회 요청을 보낸다.
const SEARCH_DEBOUNCE_MS = 120

type ReservationSort = 'consult' | 'reserve'

const sortOptions = [
  { value: 'consult', label: '상담일순' },
  { value: 'reserve', label: '예약일순' },
]

// UI 정렬 값 → 서버 정렬 코드.
const sortToCode: Record<ReservationSort, ReservationSortCode> = {
  consult: 'COUNSEL_DATE',
  reserve: 'RESERVATION_DATE',
}

// URL 에 남기지 않을 기본값(사전답사 전 탭·상담일순·첫 페이지·검색어 없음).
const listParamDefaults = {
  status: 'pending',
  keyword: '',
  sort: 'consult',
  page: '1',
} as const

const emptyCounts: Record<ReservationStatus, number> = {
  pending: 0,
  approved: 0,
  rejected: 0,
}

export function NoticeReservationsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // 조회 조건(상태·검색어·정렬·페이지)은 URL 이 소유한다.
  // 상세에 다녀오거나 새로고침해도 걸어둔 조건이 그대로 남는다.
  const { values, update } = useListSearchParams(listParamDefaults)
  const queryClient = useQueryClient()
  // 케밥 메뉴는 동시에 하나만 열린다. 열린 행 id 를 목록이 소유한다.
  const [openKebabId, setOpenKebabId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [localToast, setLocalToast] = useState<{
    variant: ToastVariant
    message: string
  } | null>(null)
  const deletingRef = useRef(false)
  // 행별 `⋮` 버튼. 삭제 모달을 닫은 뒤 초점을 되돌리는 데 쓴다.
  const kebabTriggersRef = useRef(new Map<string, HTMLButtonElement>())
  const focusFrame = useFocusFrame()
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReservation(Number(id)),
  })
  const active: ReservationStatus =
    values.status === 'approved' || values.status === 'rejected'
      ? values.status
      : 'pending'
  const sort: ReservationSort =
    values.sort === 'reserve' ? 'reserve' : 'consult'
  const page = readPageParam(new URLSearchParams({ page: values.page }))
  const debouncedKeyword = values.keyword

  // 입력값은 즉시 반영하되, 실제 조회 키워드(URL)는 디바운스해 타이핑 중 요청을 막는다.
  const [query, setQuery] = useState(debouncedKeyword)
  useEffect(() => {
    if (query.trim() === debouncedKeyword) return

    const timer = setTimeout(
      () => update({ keyword: query.trim(), page: '1' }),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [query, debouncedKeyword, update])

  // 생성·수정 화면에서 넘겨받은 결과로 토스트를 띄운다. 첫 렌더에서 값을 읽어 두고
  // 이동 state 는 지운다 — 새로고침이나 뒤로가기로 같은 토스트가 다시 뜨지 않게 한다.
  const completion = (
    location.state as { toast?: ReservationFormCompletion } | null
  )?.toast
  const [toastMessage, setToastMessage] = useState<string | null>(
    completion ? successToastMessage[completion] : null,
  )
  useEffect(() => {
    if (!completion) return

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    })
  }, [completion, location.pathname, location.search, navigate])

  function setSort(next: ReservationSort) {
    update({ sort: next, page: '1' })
  }

  function setPage(next: number) {
    update({ page: String(next) })
  }

  // 서버 사이드 조회: 상태 필터·검색·정렬·페이지를 파라미터로 전달한다.
  const { data, isPending, isError } = useQuery({
    queryKey: [
      'reservations',
      'list',
      { status: active, title: debouncedKeyword, sort, page },
    ],
    queryFn: () =>
      getAdminReservations({
        status: reservationStatusToCode[active],
        title: debouncedKeyword || undefined,
        sort: sortToCode[sort],
        // 단체예약 목록은 화면과 같은 1-based 로 보낸다(다른 목록은 0-based 다 — 개발자 결정).
        page,
        size: PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  })

  // 상태 카운트는 필터와 무관하게 항상 전체 기준(서버 응답값).
  const counts = data?.counts ?? emptyCounts
  const pageReservations = data?.reservations ?? []
  const pageCount = Math.max(1, data?.totalPages ?? 1)

  const currentPage = Math.min(page, pageCount)

  // 삭제·필터로 전체 페이지 수가 줄어 URL 의 page 가 범위를 벗어나면 마지막 페이지로
  // 되돌려 빈 페이지에 고착되지 않게 한다.
  useEffect(() => {
    if (data && page > pageCount) setPage(pageCount)
    // setPage 는 렌더마다 새로 만들어지므로 의존성에 넣지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, page, pageCount])

  // 상태 필터를 바꾸면 검색어를 초기화한다(다른 상태에서 이전 검색어로 빈 결과가 뜨는 혼란 방지).
  function handleStatusSelect(next: ReservationStatus) {
    if (next === active) return

    setQuery('')
    update({ status: next, keyword: '', page: '1' })
  }

  function focusKebabTrigger(id: string) {
    // 삭제된 행의 버튼은 이미 사라졌을 수 있어 남아 있을 때만 되돌린다.
    focusFrame(() => kebabTriggersRef.current.get(id))
  }

  function handleDelete() {
    if (!deleteTargetId || deletingRef.current || deleteMutation.isPending) {
      return
    }

    deletingRef.current = true
    const targetId = deleteTargetId
    deleteMutation.mutate(targetId, {
      onSuccess: async () => {
        // 목록만 무효화한다. 상세 쿼리까지 넓히면 삭제된 id 를 다시 GET 해 404 가 난다.
        await queryClient.invalidateQueries({
          queryKey: ['reservations', 'list'],
        })
        deletingRef.current = false
        setDeleteTargetId(null)
        setLocalToast({
          variant: 'success',
          message: deleteToastMessage.success,
        })
      },
      onError: (error) => {
        deletingRef.current = false
        setDeleteTargetId(null)
        setLocalToast({
          variant: 'error',
          // 서버가 사유를 주면 그 문장을, 없으면 Figma 기본 문구를 보인다.
          message: serverMessage(error, deleteToastMessage.failure),
        })
        focusKebabTrigger(targetId)
      },
    })
  }

  if (isPending) {
    return (
      <Page>
        <Content>
          <ReservationListSkeleton />
        </Content>
      </Page>
    )
  }

  return (
    <Page>
      <Content>
        <Header>
          <Title>단체예약 현황</Title>
          <Subtitle>토이빌리지의 단체 방문 일정을 모니터링</Subtitle>
        </Header>

        {isError && (
          <ErrorAlert role="alert">
            단체예약을 불러오지 못했습니다. 다시 시도해 주세요.
          </ErrorAlert>
        )}

        <StatusRow>
          <ReservationStatusCards
            counts={counts}
            active={active}
            onSelect={handleStatusSelect}
          />
          <CreateButton
            type="button"
            onClick={() => navigate('/notices/reservations/create')}
          >
            단체예약 생성하기
          </CreateButton>
        </StatusRow>

        <ReservationTable
          reservations={pageReservations}
          onRowClick={(id) =>
            navigate(`/notices/reservations/${id}`, {
              state: { listSearch: location.search },
            })
          }
          onEdit={(id) =>
            navigate(`/notices/reservations/${id}/edit`, {
              state: { listSearch: location.search },
            })
          }
          onDelete={(id) => {
            setOpenKebabId(null)
            setDeleteTargetId(id)
          }}
          openKebabId={openKebabId}
          onOpenKebabChange={setOpenKebabId}
          onKebabTriggerRef={(id, node) => {
            if (node) kebabTriggersRef.current.set(id, node)
            else kebabTriggersRef.current.delete(id)
          }}
          search={{
            value: query,
            onChange: setQuery,
            placeholder: '제목을 입력해주세요',
            ariaLabel: '예약 검색',
          }}
          sort={{
            value: sort,
            options: sortOptions,
            onChange: (value) => setSort(value as ReservationSort),
            ariaLabel: '예약 정렬',
          }}
          pagination={{ page: currentPage, pageCount, onChange: setPage }}
          emptyLabel={
            debouncedKeyword
              ? '검색결과가 없습니다'
              : '아직 단체예약이 없습니다'
          }
        />
      </Content>

      {deleteTargetId && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={() => {
            const targetId = deleteTargetId
            setDeleteTargetId(null)
            focusKebabTrigger(targetId)
          }}
          onConfirm={handleDelete}
        />
      )}

      {localToast && (
        <Toast
          variant={localToast.variant}
          message={localToast.message}
          onDismiss={() => setLocalToast(null)}
        />
      )}

      {!localToast && toastMessage && (
        <Toast
          variant="success"
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </Page>
  )
}

const Page = styled.main`
  padding: 32px;
  background: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-top: calc(124px - 32px);
`

const Header = styled.header`
  display: flex;
  flex-direction: column;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 60px;
  font-weight: 600;
  line-height: 1.2;
`

const Subtitle = styled.p`
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

const ErrorAlert = styled.div`
  margin-top: 24px;
  padding: 20px 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const StatusRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-top: 24px;
`

const CreateButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 12px 16px;
  border: 0;
  border-radius: 53px;
  background: ${({ theme }) => theme.colors.textStrong};
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font: inherit;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`
