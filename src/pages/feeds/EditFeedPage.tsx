import { useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  feedQueryKeys,
  formatAnimalLabel,
  getFloorFeedDetail,
  isFeedNotFoundError,
  type FeedFloor,
} from '@/entities/feed'
import { FeedForm } from '@/features/feed-form'
import { BackLink, LeaveConfirmationDialog, LoadErrorCard } from '@/shared/ui'
import { FeedEditSkeleton } from './ui/FeedEditSkeleton'
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
  feedListPath,
  feedRecordPath,
  readFeedNavState,
  type FeedNavState,
} from './ui/feedRoutes'
import { useFormLeaveGuard } from './ui/useFormLeaveGuard'

// `/feeds/:id/edit` — 4층 급여 기록 수정(Figma `feeding correction (4층)` 2429:24034).
export function EditFeedPage() {
  return <EditFeed floor="4" />
}

// `/feeds/fifth-floor/:id/edit` — 5층 급여 기록 수정(Figma 3130:25801).
export function FifthFloorEditFeedPage() {
  return <EditFeed floor="5" />
}

// 목록·기록 상세·개체별 급여 이력의 케밥 `수정` 에서 들어온다.
// 뒤로가기·저장 성공은 들어온 화면으로 돌아간다(저장 성공은 그 화면에서 토스트).
function EditFeed({ floor }: { floor: FeedFloor }) {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { blocker, setIsDirty, allowNavigation } = useFormLeaveGuard()
  const navState = readFeedNavState(location.state)
  const origin = returnTarget(floor, id, navState)

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
    enabled: validId,
    retry: false,
  })

  const handleCompleted = useCallback(() => {
    allowNavigation()
    navigate(origin.path, {
      state: { ...origin.state, toast: 'edit-success' },
    })
  }, [allowNavigation, navigate, origin.path, origin.state])

  // 잘못된 id 나 없는 기록(404)은 목록으로 되돌린다.
  if (!validId) return <Navigate to={feedListPath} replace />

  if (isPending) {
    return (
      <FeedEditSkeleton
        backTo={origin.path}
        backState={origin.state}
        floor={floor}
      />
    )
  }

  if (!feed) {
    if (isFeedNotFoundError(error)) {
      return <Navigate to={feedListPath} replace />
    }
    return (
      <FeedPage>
        <FeedContent>
          <BackLink to={origin.path} state={origin.state} />
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
        <BackLink to={origin.path} state={origin.state} />
        <FeedHeader>
          <FeedHeading>
            <FeedTitle>급여 기록 수정</FeedTitle>
            <FeedSubtitle>
              {formatAnimalLabel(feed.animalType, feed.animalName)}의 급여
              기록을 수정합니다
            </FeedSubtitle>
          </FeedHeading>
        </FeedHeader>
        <FeedBody>
          <FeedForm
            feed={feed}
            onCompleted={handleCompleted}
            onDirtyChange={setIsDirty}
          />
        </FeedBody>
      </FeedContent>
      {blocker.state === 'blocked' && (
        <LeaveConfirmationDialog
          onCancel={blocker.reset}
          onConfirm={blocker.proceed}
        />
      )}
    </FeedPage>
  )
}

// 들어온 곳: 목록이면 그 조회 조건의 목록, 개체별 급여 이력이면 그 이력, 그 밖에는 그 기록 상세.
function returnTarget(
  floor: FeedFloor,
  id: string,
  navState: FeedNavState,
): { path: string; state: FeedNavState } {
  if (navState.from === 'list') {
    return {
      path: `${feedListPath}${navState.listSearch ?? ''}`,
      state: {},
    }
  }
  if (navState.from === 'history' && navState.backPath) {
    return { path: navState.backPath, state: navState.returnState ?? {} }
  }
  return {
    path: feedRecordPath(floor, id),
    state: {
      listSearch: navState.listSearch,
      backPath: navState.backPath,
      returnState: navState.returnState,
    },
  }
}
