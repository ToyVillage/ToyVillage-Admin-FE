import { useCallback, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { feedQueryKeys, getFeedHistory } from '@/entities/feed'
import {
  deleteIndividual,
  getIndividual,
  individualQueryKeys,
  IndividualProfileCard,
} from '@/entities/individual'
import {
  deleteObservation,
  getObservations,
  ObservationAttachmentCell,
  observationQueryKeys,
  ObservationTable,
} from '@/entities/observation'
import { isNotFoundError, speciesQueryKeys } from '@/entities/species'
import {
  BackLink,
  DeleteConfirmationDialog,
  KebabMenu,
  SectionHeader,
  Toast,
  useFocusFrame,
} from '@/shared/ui'
import { PageStatus } from './ui/PageStatus'
import { SpeciesDeleteDescription } from './ui/SpeciesDeleteDescription'
import { TABLE_PAGE_SIZE } from './ui/tablePage'
import { usePageToast } from './ui/usePageToast'

// 카드 케밥의 메뉴 id. 행 케밥은 관찰 id 를 쓴다(관찰 id 는 숫자 문자열).
const profileMenuId = 'profile'

type DeleteTarget =
  { kind: 'individual' } | { kind: 'observation'; observationId: string }

// `/species/:speciesId/individuals/:individualId` — 개체 상세(Figma `individual detail` 64:8735).
// 관찰은 앱에서 작성하므로 등록 버튼이 없다. 관찰 수정·삭제와 개체 수정·삭제는 케밥이 맡는다.
export function IndividualDetailPage() {
  const { speciesId = '', individualId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  // 카드·행 케밥과 첨부 팝오버는 각각 동시에 하나만 열린다.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  // 삭제 결과 토스트(이동 state 로 받은 것과 이 화면에서 발생한 것).
  const { toast, showToast, dismissToast } = usePageToast()
  const deletingRef = useRef(false)
  // 케밥 `⋮` 버튼. 삭제 모달을 닫은 뒤 초점을 되돌리는 데 쓴다.
  const menuTriggersRef = useRef(new Map<string, HTMLButtonElement>())
  const focusFrame = useFocusFrame()

  const individualQuery = useQuery({
    queryKey: individualQueryKeys.detail(individualId),
    queryFn: () => getIndividual({ animalManageId: Number(individualId) }),
    enabled: Boolean(individualId),
  })
  // 페이지는 서버가 자른다(`ANIMAL_OBSERVATION_QUERY_ALL`, 1부터).
  const observationsQuery = useQuery({
    queryKey: observationQueryKeys.list(individualId, page),
    queryFn: () =>
      getObservations({
        animalManageId: Number(individualId),
        page,
        size: TABLE_PAGE_SIZE,
      }),
    enabled: Boolean(individualId),
    placeholderData: (previousData) => previousData,
  })
  // `먹이 급여 기록 확인하기` 는 이 개체의 최신 급여 기록 상세로 간다. 이력이 있어야 누를 수 있다.
  const feedHistoryQuery = useQuery({
    queryKey: feedQueryKeys.history(individualId),
    queryFn: () => getFeedHistory(Number(individualId)),
    enabled: Boolean(individualId),
  })
  const latestFeedId = feedHistoryQuery.data?.[0]?.id

  const deleteIndividualMutation = useMutation({
    mutationFn: () =>
      deleteIndividual({ animalManageId: Number(individualId) }),
  })
  const deleteObservationMutation = useMutation({
    mutationFn: (observationId: string) =>
      deleteObservation({
        animalManageId: Number(individualId),
        animalObservationId: Number(observationId),
      }),
  })

  const pageCount = Math.max(1, observationsQuery.data?.totalPages ?? 1)
  // 삭제로 마지막 페이지가 사라지면 마지막 페이지로 당긴다. 렌더 중 상태 보정(effect 불필요).
  if (observationsQuery.data && page > pageCount) setPage(pageCount)

  const focusMenuTrigger = useCallback(
    (menuId: string) => {
      // 삭제된 행의 버튼은 이미 사라졌을 수 있어 남아 있을 때만 되돌린다.
      focusFrame(() => menuTriggersRef.current.get(menuId))
    },
    [focusFrame],
  )

  function registerMenuTrigger(menuId: string, node: HTMLButtonElement | null) {
    if (node) menuTriggersRef.current.set(menuId, node)
    else menuTriggersRef.current.delete(menuId)
  }

  function changeMenu(menuId: string, open: boolean) {
    setOpenMenuId((current) =>
      open ? menuId : current === menuId ? null : current,
    )
    // 케밥 메뉴를 열면 첨부 팝오버는 닫힌다.
    if (open) setOpenPopoverId(null)
  }

  function changePopover(observationId: string, open: boolean) {
    setOpenPopoverId((current) =>
      open ? observationId : current === observationId ? null : current,
    )
    // 첨부 팝오버를 열면 케밥 메뉴는 닫힌다(둘 중 하나만 열린다).
    if (open) setOpenMenuId(null)
  }

  function deleteTargetMenuId(target: DeleteTarget) {
    return target.kind === 'individual' ? profileMenuId : target.observationId
  }

  function handleCancelDelete() {
    if (!deleteTarget) return
    const menuId = deleteTargetMenuId(deleteTarget)
    setDeleteTarget(null)
    focusMenuTrigger(menuId)
  }

  function handleConfirmDelete() {
    if (!deleteTarget || deletingRef.current) return

    deletingRef.current = true
    if (deleteTarget.kind === 'individual') {
      deleteIndividualMutation.mutate(undefined, {
        // 관찰 기록도 함께 삭제된다(모달 문구). 종 마리수·관찰 query 도 함께 무효화한다.
        onSuccess: () => {
          deletingRef.current = false
          navigate(`/species/${speciesId}`, {
            state: { toast: 'delete-success' },
          })
          queryClient.removeQueries({
            queryKey: individualQueryKeys.detail(individualId),
          })
          void Promise.all([
            queryClient.invalidateQueries({
              queryKey: individualQueryKeys.all,
            }),
            queryClient.invalidateQueries({ queryKey: speciesQueryKeys.all }),
            queryClient.invalidateQueries({
              queryKey: observationQueryKeys.all,
            }),
          ])
        },
        onError: () => {
          deletingRef.current = false
          setDeleteTarget(null)
          showToast('delete-error')
          focusMenuTrigger(profileMenuId)
        },
      })
      return
    }

    const { observationId } = deleteTarget
    deleteObservationMutation.mutate(observationId, {
      onSuccess: async () => {
        deletingRef.current = false
        setDeleteTarget(null)
        queryClient.removeQueries({
          queryKey: observationQueryKeys.detail(observationId),
        })
        await queryClient.invalidateQueries({
          queryKey: observationQueryKeys.all,
        })
        showToast('delete-success')
      },
      onError: () => {
        deletingRef.current = false
        setDeleteTarget(null)
        showToast('delete-error')
        focusMenuTrigger(observationId)
      },
    })
  }

  if (
    individualQuery.isPending ||
    (observationsQuery.isPending && !observationsQuery.isError)
  ) {
    return <PageStatus state="loading" message="개체를 불러오는 중입니다." />
  }

  if (individualQuery.isError && !isNotFoundError(individualQuery.error)) {
    return (
      <PageStatus
        state="error"
        message="개체를 불러오지 못했습니다. 다시 시도해 주세요."
      />
    )
  }

  const individual = individualQuery.data
  // 관찰 목록 404 는 개체가 없어진 것이다.
  if (
    individualQuery.isError ||
    (observationsQuery.isError && isNotFoundError(observationsQuery.error)) ||
    !individual ||
    individual.speciesId !== speciesId
  ) {
    return (
      <PageStatus
        state="not-found"
        message="개체를 찾을 수 없습니다."
        linkTo={`/species/${speciesId}`}
        linkLabel="종 상세로 돌아가기"
      />
    )
  }

  const detailPath = `/species/${speciesId}/individuals/${individualId}`
  const observationPage = observationsQuery.data

  return (
    <Page>
      <Content>
        <BackLink to={`/species/${speciesId}`} />

        <ProfileSection>
          <IndividualProfileCard
            name={individual.name}
            sex={individual.sex}
            birthYear={individual.birthYear}
            note={individual.note}
            photo={individual.photo}
            actions={
              <>
                {/* 이력을 불러오는 중이거나 없으면(실패 포함) 초점은 받지만 동작하지 않는다. */}
                <FeedingRecordButton
                  type="button"
                  aria-disabled={latestFeedId ? undefined : 'true'}
                  onClick={() => {
                    if (!latestFeedId) return
                    // 급여 상세의 뒤로가기가 이 개체 상세로 돌아오게 한다.
                    navigate(`/feeds/${latestFeedId}`, {
                      state: { backPath: detailPath },
                    })
                  }}
                >
                  먹이 급여 기록 확인하기
                  <ChevronRightIcon viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 4 8 8-8 8" />
                  </ChevronRightIcon>
                </FeedingRecordButton>
                <KebabMenu
                  placement="below-trigger"
                  ariaLabel={`${individual.name} 개체 메뉴 열기`}
                  open={openMenuId === profileMenuId}
                  onOpenChange={(open) => changeMenu(profileMenuId, open)}
                  onTriggerRef={(node) =>
                    registerMenuTrigger(profileMenuId, node)
                  }
                  items={[
                    {
                      label: '수정',
                      onSelect: () => navigate(`${detailPath}/edit`),
                    },
                    {
                      label: '삭제',
                      tone: 'danger',
                      onSelect: () => setDeleteTarget({ kind: 'individual' }),
                    },
                  ]}
                />
              </>
            }
          />
        </ProfileSection>

        <ObservationSection>
          <SectionHeader
            title="관찰 및 특이사항"
            count={observationPage?.totalElements ?? 0}
          />
          <ObservationTable
            rows={observationPage?.items ?? []}
            page={Math.min(page, pageCount)}
            pageCount={pageCount}
            onPageChange={setPage}
            onRowClick={(observationId) =>
              navigate(`${detailPath}/observations/${observationId}`)
            }
            emptyLabel={
              observationsQuery.isError ? (
                <span role="alert">
                  관찰 기록을 불러오지 못했습니다. 다시 시도해 주세요.
                </span>
              ) : (
                '등록된 관찰 기록이 없습니다'
              )
            }
            renderAttachments={(observation) => (
              <ObservationAttachmentCell
                attachments={observation.attachments}
                observationTitle={observation.title}
                open={openPopoverId === observation.id}
                onOpenChange={(open) => changePopover(observation.id, open)}
                onDownloadError={() => showToast('download-error')}
              />
            )}
            renderRowAction={(observation) => (
              <KebabMenu
                placement="below-trigger"
                ariaLabel={`${observation.title} 관찰 메뉴 열기`}
                open={openMenuId === observation.id}
                onOpenChange={(open) => changeMenu(observation.id, open)}
                onTriggerRef={(node) =>
                  registerMenuTrigger(observation.id, node)
                }
                items={[
                  {
                    label: '수정',
                    onSelect: () =>
                      navigate(
                        `${detailPath}/observations/${observation.id}/edit`,
                      ),
                  },
                  {
                    label: '삭제',
                    tone: 'danger',
                    onSelect: () =>
                      setDeleteTarget({
                        kind: 'observation',
                        observationId: observation.id,
                      }),
                  },
                ]}
              />
            )}
          />
        </ObservationSection>
      </Content>

      {deleteTarget && (
        <DeleteConfirmationDialog
          pending={
            deleteTarget.kind === 'individual'
              ? deleteIndividualMutation.isPending
              : deleteObservationMutation.isPending
          }
          description={
            deleteTarget.kind === 'individual' ? (
              <SpeciesDeleteDescription target="individual" />
            ) : undefined
          }
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}

      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          onDismiss={dismissToast}
        />
      )}
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 120px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};

  @media (max-width: 980px) {
    padding: 0 20px 48px;
  }
`

// Figma 뒤로가기 @y75 → 카드 @y144(33px) → 섹션 헤더 @y499(카드 아래 60px).
const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  align-items: flex-start;
  margin: 0 auto;
  padding-top: 75px;
`

const ProfileSection = styled.div`
  align-self: stretch;
  margin-top: 33px;
`

const ObservationSection = styled.section`
  align-self: stretch;
  margin-top: 60px;
`

// Figma `link / 먹이 급여 기록`(949:26307) 245×52 — 누를 수 없을 때도 흐리게 두지 않고 외형을 유지한다.
const FeedingRecordButton = styled.button`
  display: inline-flex;
  min-height: 52px;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.accentBg};
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  font: inherit;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;

  &[aria-disabled='true'] {
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`

const ChevronRightIcon = styled.svg`
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
`
