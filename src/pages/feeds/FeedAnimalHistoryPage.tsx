import { useCallback, useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  deleteFloorFeed,
  feedQueryKeys,
  FeedFloorBadge,
  FeedHistoryTable,
  feedHistoryTableMinWidth,
  getFloorFeedHistory,
  type FeedFloor,
  type FeedHistoryRecord,
} from '@/entities/feed'
import {
  getIndividual,
  IndividualProfileCard,
  individualQueryKeys,
} from '@/entities/individual'
import {
  BackLink,
  DeleteConfirmationDialog,
  KebabMenu,
  LoadErrorCard,
  SectionHeader,
  ShortcutButton,
  Skeleton,
  SkeletonStatus,
  Toast,
  useFocusFrame,
  type ToastVariant,
} from '@/shared/ui'
import { FeedContent, FeedPage } from './ui/feedPageLayout'
import { feedListPath, feedRecordPath, readFeedNavState } from './ui/feedRoutes'

type HistoryToastKey = 'edit-success' | 'delete-success' | 'delete-error'

const toastByKey: Record<
  HistoryToastKey,
  { variant: ToastVariant; message: string }
> = {
  'edit-success': { variant: 'success', message: '데이터 수정에 성공했습니다' },
  'delete-success': {
    variant: 'success',
    message: '데이터 삭제에 성공했습니다',
  },
  'delete-error': { variant: 'error', message: '데이터 삭제에 실패했습니다' },
}

// `/feeds/animals/:animalId` — 4층 개체별 급여 이력(Figma 749:14665).
export function FeedAnimalHistoryPage() {
  return <FeedAnimalHistory floor="4" />
}

// `/feeds/fifth-floor/animals/:animalId` — 5층 개체별 급여 이력(Figma 3316:25799).
export function FifthFloorFeedAnimalHistoryPage() {
  return <FeedAnimalHistory floor="5" />
}

function FeedAnimalHistory({ floor }: { floor: FeedFloor }) {
  const { animalId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const navState = readFeedNavState(location.state)
  const backPath =
    navState.backPath ?? `${feedListPath}${navState.listSearch ?? ''}`
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FeedHistoryRecord | null>(
    null,
  )
  const [localToast, setLocalToast] = useState<HistoryToastKey | null>(null)
  const menuTriggersRef = useRef(new Map<string, HTMLButtonElement>())
  const focusFrame = useFocusFrame()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const animalManageId = Number(animalId)
  const validId = Number.isSafeInteger(animalManageId) && animalManageId > 0

  const individualQuery = useQuery({
    queryKey: individualQueryKeys.detail(animalId),
    queryFn: () => getIndividual({ animalManageId }),
    enabled: validId,
    retry: false,
  })
  const historyQuery = useQuery({
    queryKey: feedQueryKeys.history(floor, animalId),
    queryFn: () => getFloorFeedHistory(floor, animalManageId),
    enabled: validId,
    retry: false,
    staleTime: 0,
  })

  const deleteMutation = useMutation({
    mutationFn: (record: FeedHistoryRecord) =>
      deleteFloorFeed(floor, Number(record.id)),
  })

  const stateToast = navState.toast ?? null
  const toastKey = localToast ?? stateToast
  const toast = toastKey ? toastByKey[toastKey] : undefined

  const dismissToast = useCallback(() => {
    setLocalToast(null)
    if (stateToast) {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: { ...navState, toast: undefined },
      })
    }
  }, [location.pathname, location.search, navState, navigate, stateToast])

  function focusMenuTrigger(recordId: string) {
    focusFrame(() => menuTriggersRef.current.get(recordId))
  }

  function cancelDelete() {
    if (!deleteTarget) return
    const targetId = deleteTarget.id
    setDeleteTarget(null)
    focusMenuTrigger(targetId)
  }

  function confirmDelete() {
    if (!deleteTarget || deleteMutation.isPending) return
    const target = deleteTarget
    deleteMutation.mutate(target, {
      onSuccess: async () => {
        // 재조회를 기다리는 동안 확인 모달이 열려 있으면 다시 삭제할 수 있어 먼저 닫는다.
        setDeleteTarget(null)
        queryClient.removeQueries({
          queryKey: feedQueryKeys.detail(floor, target.id),
        })
        void queryClient.invalidateQueries({ queryKey: feedQueryKeys.lists })
        await queryClient.invalidateQueries({
          queryKey: feedQueryKeys.history(floor, animalId),
        })
        setLocalToast('delete-success')
      },
      onError: () => {
        setDeleteTarget(null)
        setLocalToast('delete-error')
        focusMenuTrigger(target.id)
      },
    })
  }

  if (!validId) return <Navigate to={feedListPath} replace />

  if (individualQuery.isError || historyQuery.isError) {
    return (
      <FeedPage>
        <FeedContent>
          <BackLink to={backPath} state={navState.returnState} />
          <Body>
            <LoadErrorCard
              onRetry={() => {
                if (individualQuery.isError) void individualQuery.refetch()
                if (historyQuery.isError) void historyQuery.refetch()
              }}
            />
          </Body>
        </FeedContent>
      </FeedPage>
    )
  }

  const individual = individualQuery.data
  const history = historyQuery.data ?? []

  return (
    <FeedPage>
      <FeedContent>
        <BackLink to={backPath} state={navState.returnState} />

        <Body>
          <SkeletonStatus
            busy={individualQuery.isPending || historyQuery.isPending}
          >
            {individual ? (
              <IndividualProfileCard
                name={individual.name}
                sex={individual.sex}
                birthYear={individual.birthYear}
                note={individual.note}
                photo={individual.photo}
                badges={<FeedFloorBadge floor={floor} />}
                actions={
                  <ShortcutButton
                    to={`/species/${individual.speciesId}/individuals/${individual.id}`}
                  >
                    관찰 및 특이사항 보러가기
                  </ShortcutButton>
                }
              />
            ) : (
              <ProfileSkeleton>
                <Skeleton width={180} height={180} radius={20} />
                <ProfileSkeletonText>
                  <Skeleton width={200} height={48} />
                  <Skeleton width={260} height={24} />
                  <Skeleton width={320} height={24} />
                </ProfileSkeletonText>
              </ProfileSkeleton>
            )}

            <HistorySection>
              <SectionHeader
                title="급여 이력"
                count={historyQuery.isPending ? undefined : history.length}
              />
              <HistoryTableArea>
                <FeedHistoryTable
                  floor={floor}
                  records={history}
                  emptyLabel="급여 이력이 없습니다."
                  loading={historyQuery.isPending}
                  // 상세의 뒤로가기가 이 이력으로 돌아온다.
                  onRowClick={(id) =>
                    navigate(feedRecordPath(floor, id), {
                      state: {
                        backPath: location.pathname,
                        returnState: { ...navState, toast: undefined },
                      },
                    })
                  }
                  renderRowAction={(record) => (
                    <KebabMenu
                      placement="below-trigger"
                      ariaLabel={`${record.fedDate} 급여 기록 메뉴`}
                      open={openMenuId === record.id}
                      onOpenChange={(open) =>
                        setOpenMenuId(open ? record.id : null)
                      }
                      onTriggerRef={(node) => {
                        if (node) menuTriggersRef.current.set(record.id, node)
                        else menuTriggersRef.current.delete(record.id)
                      }}
                      items={[
                        {
                          label: '수정',
                          onSelect: () =>
                            navigate(
                              `${feedRecordPath(floor, record.id)}/edit`,
                              {
                                state: {
                                  from: 'history',
                                  backPath: location.pathname,
                                  returnState: {
                                    ...navState,
                                    toast: undefined,
                                  },
                                },
                              },
                            ),
                        },
                        {
                          label: '삭제',
                          tone: 'danger',
                          onSelect: () => setDeleteTarget(record),
                        },
                      ]}
                    />
                  )}
                />
              </HistoryTableArea>
            </HistorySection>
          </SkeletonStatus>
        </Body>
      </FeedContent>

      {deleteTarget && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}

      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          onDismiss={dismissToast}
        />
      )}
    </FeedPage>
  )
}

// Figma: 뒤로가기 하단(111) → 개체 카드(144) 33px.
const Body = styled.div`
  align-self: stretch;
  margin-top: 33px;
`

const ProfileSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: 40px;
  min-height: 296px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const ProfileSkeletonText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

// Figma: 개체 카드 하단(440) → `급여 이력` 머리(510) 70px.
const HistorySection = styled.section`
  margin-top: 70px;
`

// 화면이 열 폭 합계보다 좁으면 표만 가로로 스크롤한다.
const HistoryTableArea = styled.div`
  width: 100%;

  > * {
    min-width: ${feedHistoryTableMinWidth}px;
  }

  @media (max-width: ${feedHistoryTableMinWidth + 64 + 20}px) {
    overflow-x: auto;
    padding-bottom: 140px;
    margin-bottom: -140px;
  }
`
