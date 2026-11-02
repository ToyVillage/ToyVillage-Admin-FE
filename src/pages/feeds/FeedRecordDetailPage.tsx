import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  deleteFloorFeed,
  feedQueryKeys,
  FeedRecordFields,
  formatAnimalLabel,
  getFloorFeedDetail,
  isFeedNotFoundError,
  type FeedFloor,
} from '@/entities/feed'
import {
  BackLink,
  DeleteConfirmationDialog,
  KebabMenu,
  LoadErrorCard,
  ShortcutButton,
  SkeletonStatus,
  Toast,
  type ToastVariant,
} from '@/shared/ui'
import {
  FeedBody,
  FeedContent,
  FeedHeader,
  FeedHeading,
  FeedPage,
  FeedSubtitle,
  FeedTitle,
} from './ui/feedPageLayout'
import {
  feedAnimalHistoryPath,
  feedListPath,
  feedRecordPath,
  readFeedNavState,
  type FeedNavState,
} from './ui/feedRoutes'

type RecordToastKey = 'edit-success' | 'delete-error'

const toastByKey: Record<
  RecordToastKey,
  { variant: ToastVariant; message: string }
> = {
  'edit-success': { variant: 'success', message: '데이터 수정에 성공했습니다' },
  'delete-error': { variant: 'error', message: '데이터 삭제에 실패했습니다' },
}

// `/feeds/:id` — 4층 급여 기록 상세(Figma 3129:25402).
export function FeedRecordDetailPage() {
  return <FeedRecordDetail floor="4" />
}

// `/feeds/fifth-floor/:id` — 5층 급여 기록 상세(Figma 3130:25980).
export function FifthFloorFeedRecordDetailPage() {
  return <FeedRecordDetail floor="5" />
}

function FeedRecordDetail({ floor }: { floor: FeedFloor }) {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const navState = readFeedNavState(location.state)
  // 목록에서 왔으면 그때의 조회 조건으로, 개체 상세에서 왔으면 그 화면으로 돌아간다.
  const backPath =
    navState.backPath ?? `${feedListPath}${navState.listSearch ?? ''}`
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [localToast, setLocalToast] = useState<RecordToastKey | null>(null)
  // 삭제한 뒤에는 다시 조회하지 않는다. 다시 조회하면 404 로 '없는 기록' 이동이 일어나 이력으로 넘긴 토스트 state 를 덮어쓴다.
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const feedLogId = Number(id)
  const validId = Number.isSafeInteger(feedLogId) && feedLogId > 0
  const {
    data: feed,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: feedQueryKeys.detail(floor, id),
    queryFn: () => getFloorFeedDetail(floor, feedLogId),
    enabled: validId && !deleted,
    retry: false,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteFloorFeed(floor, feedLogId),
  })

  const stateToast = navState.toast === 'edit-success' ? 'edit-success' : null
  const toastKey = localToast ?? stateToast
  const toast = toastKey ? toastByKey[toastKey] : undefined

  // 닫을 때 이동 state 의 토스트만 비워 새로고침·재방문 시 다시 뜨지 않게 한다.
  const dismissToast = useCallback(() => {
    setLocalToast(null)
    if (stateToast) {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: { ...navState, toast: undefined },
      })
    }
  }, [location.pathname, location.search, navState, navigate, stateToast])

  function confirmDelete() {
    if (!feed || deleteMutation.isPending) return
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setDeleted(true)
        queryClient.removeQueries({ queryKey: feedQueryKeys.detail(floor, id) })
        void queryClient.invalidateQueries({ queryKey: feedQueryKeys.lists })
        void queryClient.invalidateQueries({ queryKey: ['feeds', 'history'] })
        // 지운 기록이 있던 개체의 급여 이력으로 옮겨 결과를 알린다(Figma 3133:26051).
        const historyPath = feedAnimalHistoryPath(floor, feed.animalManageId)
        // 그 이력에서 들어왔으면 이력의 원래 state 로 돌아가, 이력의 뒤로가기가 자기 자신을 가리키지 않게 한다.
        const historyState: FeedNavState =
          navState.backPath === historyPath
            ? (navState.returnState ?? {})
            : { listSearch: navState.listSearch, backPath: navState.backPath }
        navigate(historyPath, {
          replace: true,
          state: { ...historyState, toast: 'delete-success' },
        })
      },
      onError: () => {
        setConfirmingDelete(false)
        setLocalToast('delete-error')
      },
    })
  }

  if (!validId) return <Navigate to={feedListPath} replace />

  if (!isPending && !feed) {
    // 404(없는 기록)만 되돌린다. 500·네트워크 실패까지 되돌리면 '없는 기록'으로 오인된다.
    if (isFeedNotFoundError(error)) return <Navigate to={backPath} replace />
    return (
      <FeedPage>
        <FeedContent>
          <BackLink to={backPath} state={navState.returnState} />
          <FeedBody>
            <LoadErrorCard onRetry={() => void refetch()} />
          </FeedBody>
        </FeedContent>
      </FeedPage>
    )
  }

  return (
    <FeedPage>
      <FeedContent>
        <BackLink to={backPath} state={navState.returnState} />
        <FeedHeader>
          <FeedHeading>
            <FeedTitle>급여 기록 상세</FeedTitle>
            <FeedSubtitle>
              {feed &&
                `${formatAnimalLabel(feed.animalType, feed.animalName)}의 급여 기록입니다`}
            </FeedSubtitle>
          </FeedHeading>
          {feed && (
            <KebabMenu
              ariaLabel="급여 기록 메뉴"
              placement="below-trigger"
              open={menuOpen}
              onOpenChange={setMenuOpen}
              items={[
                {
                  label: '수정',
                  onSelect: () =>
                    navigate(`${feedRecordPath(floor, id)}/edit`, {
                      state: {
                        listSearch: navState.listSearch,
                        backPath: navState.backPath,
                        returnState: navState.returnState,
                        from: 'record',
                      },
                    }),
                },
                {
                  label: '삭제',
                  tone: 'danger',
                  onSelect: () => setConfirmingDelete(true),
                },
              ]}
            />
          )}
        </FeedHeader>

        <FeedBody>
          <SkeletonStatus busy={isPending}>
            <FeedRecordFields
              floor={floor}
              feed={feed}
              targetAction={
                feed && (
                  <ShortcutButton
                    onClick={() =>
                      navigate(
                        feedAnimalHistoryPath(floor, feed.animalManageId),
                        {
                          // 이력의 뒤로가기는 이 기록 상세로, 그때 이 화면의 조회 조건도 되돌려 준다.
                          state: {
                            backPath: feedRecordPath(floor, id),
                            returnState: { ...navState, toast: undefined },
                          },
                        },
                      )
                    }
                  >
                    급여 이력 보기
                  </ShortcutButton>
                )
              }
            />
          </SkeletonStatus>
        </FeedBody>
      </FeedContent>

      {confirmingDelete && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={() => setConfirmingDelete(false)}
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
