import { useCallback, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  deleteMockIndividual,
  getMockIndividuals,
  IndividualTable,
  individualQueryKeys,
} from '@/entities/individual'
import { observationQueryKeys } from '@/entities/observation'
import {
  deleteMockSpecies,
  getMockSpecies,
  SpeciesProfileCard,
  speciesQueryKeys,
} from '@/entities/species'
import {
  BackLink,
  DeleteConfirmationDialog,
  KebabMenu,
  LinkButton,
  SectionHeader,
  Toast,
  useFocusFrame,
  type DataTableSortValue,
} from '@/shared/ui'
import { PageStatus } from './ui/PageStatus'
import { SpeciesDeleteDescription } from './ui/SpeciesDeleteDescription'
import { SpeciesEmptyMessage } from './ui/SpeciesEmptyMessage'
import { tablePage } from './ui/tablePage'
import { usePageToast } from './ui/usePageToast'

type DeleteTarget =
  { kind: 'species' } | { kind: 'individual'; individualId: string }

// 카드 케밥과 행 케밥을 합쳐 동시에 하나만 열린다. 열린 메뉴를 한 키로 구분한다.
const speciesMenuKey = 'species'

// `/species/:speciesId` — 읽기 전용 종 상세(Figma `species detail` yot 58:8717).
// 종 수정은 `/species/:speciesId/edit`, 종·개체 삭제는 이 화면의 케밥이 맡는다.
export function SpeciesDetailPage() {
  const { speciesId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<DataTableSortValue>('newest')
  const [page, setPage] = useState(1)
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  // 개체 등록 성공·개체 삭제 결과 토스트(이동 state 로 받은 것과 이 화면에서 발생한 것).
  const { toast, showToast, dismissToast } = usePageToast()
  const deletingRef = useRef(false)
  // 삭제 모달을 닫은 뒤 초점을 되돌릴 `⋮` 버튼들(카드 1개 + 행별).
  const speciesMenuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const individualMenuTriggersRef = useRef(new Map<string, HTMLButtonElement>())
  const focusFrame = useFocusFrame()

  const speciesQuery = useQuery({
    queryKey: speciesQueryKeys.detail(speciesId),
    queryFn: () => getMockSpecies(speciesId),
  })
  const individualsQuery = useQuery({
    queryKey: individualQueryKeys.list(speciesId),
    queryFn: () => getMockIndividuals(speciesId),
  })
  const individuals = useMemo(
    () => individualsQuery.data ?? [],
    [individualsQuery.data],
  )

  const deleteMutation = useMutation({
    mutationFn: (target: DeleteTarget) =>
      target.kind === 'species'
        ? deleteMockSpecies(speciesId)
        : deleteMockIndividual(target.individualId),
  })

  // 검색 대상은 개체명이다(같은 종이라 국명 검색은 의미가 없다).
  const keyword = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      individuals
        .filter(
          (individual) =>
            !keyword || individual.name.toLowerCase().includes(keyword),
        )
        .sort((a, b) =>
          sort === 'newest'
            ? Number(b.id) - Number(a.id)
            : Number(a.id) - Number(b.id),
        ),
    [individuals, keyword, sort],
  )

  const {
    pageCount,
    currentPage,
    pageRows: pageIndividuals,
  } = tablePage(filtered, page)

  // 검색어·정렬이 바뀌면 첫 페이지로, 삭제로 페이지가 범위를 벗어나면 마지막 페이지로 되돌린다.
  // 렌더 중 상태 보정(effect 불필요).
  const filterKey = `${query}|${sort}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  } else if (page > pageCount) {
    setPage(pageCount)
  }

  const focusMenuTrigger = useCallback(
    (target: DeleteTarget) => {
      // 삭제된 행의 버튼은 이미 사라졌을 수 있어 남아 있을 때만 되돌린다.
      focusFrame(() =>
        target.kind === 'species'
          ? speciesMenuTriggerRef.current
          : individualMenuTriggersRef.current.get(target.individualId),
      )
    },
    [focusFrame],
  )

  async function handleSpeciesDeleted() {
    // 이 화면이 보고 있는 종·개체 query 를 지금 다시 부르면 이동 전에 `종을 찾을 수 없습니다.` 가
    // 잠깐 보인다. 목록만 새로 받아 두고 이동한 뒤 나머지는 stale 로만 표시한다(다음 조회 때 새로 받는다).
    await queryClient.invalidateQueries({
      queryKey: speciesQueryKeys.list,
      refetchType: 'all',
    })
    navigate('/species', { state: { toast: 'delete-success' } })
    // 종 삭제는 그 종의 개체·관찰 기록도 함께 숨긴다(연쇄 삭제).
    for (const queryKey of [
      speciesQueryKeys.detail(speciesId),
      individualQueryKeys.all,
      observationQueryKeys.all,
    ]) {
      void queryClient.invalidateQueries({ queryKey, refetchType: 'none' })
    }
  }

  async function handleIndividualDeleted(individualId: string) {
    queryClient.removeQueries({
      queryKey: individualQueryKeys.detail(individualId),
    })
    // 마리수는 개체 수에서 파생하므로 종 query 도, 개체의 관찰 기록도 함께 무효화한다.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: individualQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: speciesQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: observationQueryKeys.all }),
    ])
    deletingRef.current = false
    setDeleteTarget(null)
    showToast('delete-success')
  }

  function handleDelete() {
    if (!deleteTarget || deletingRef.current || deleteMutation.isPending) {
      return
    }

    deletingRef.current = true
    const target = deleteTarget
    deleteMutation.mutate(target, {
      onSuccess: () =>
        target.kind === 'species'
          ? handleSpeciesDeleted()
          : handleIndividualDeleted(target.individualId),
      onError: () => {
        deletingRef.current = false
        setDeleteTarget(null)
        showToast('delete-error')
        focusMenuTrigger(target)
      },
    })
  }

  function handleCancelDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    focusMenuTrigger(target)
  }

  if (speciesQuery.isPending || individualsQuery.isPending) {
    return <PageStatus state="loading" message="종 정보를 불러오는 중입니다." />
  }

  const species = speciesQuery.data
  if (speciesQuery.isError || !species) {
    return (
      <PageStatus
        state="not-found"
        message="종을 찾을 수 없습니다."
        linkTo="/species"
        linkLabel="목록으로 돌아가기"
      />
    )
  }

  // 0마리 종은 검색어가 있어도 빈 상태 문구를 유지한다(검색할 개체 자체가 없다).
  const emptyLabel =
    individuals.length === 0 ? (
      <SpeciesEmptyMessage
        title="등록된 개체가 없습니다"
        description="오른쪽 위 [개체 등록하기]로 첫 개체를 추가해주세요"
      />
    ) : (
      '검색결과가 없습니다'
    )

  return (
    <Page>
      <Content>
        <BackToSpeciesList to="/species" />

        <ProfileArea>
          <SpeciesProfileCard
            species={species}
            action={
              <KebabMenu
                placement="below-trigger"
                ariaLabel={`${species.koreanName} 종 메뉴 열기`}
                open={openMenuKey === speciesMenuKey}
                onOpenChange={(open) =>
                  setOpenMenuKey(open ? speciesMenuKey : null)
                }
                onTriggerRef={(node) => {
                  speciesMenuTriggerRef.current = node
                }}
                items={[
                  {
                    label: '수정',
                    onSelect: () => navigate(`/species/${speciesId}/edit`),
                  },
                  {
                    label: '삭제',
                    tone: 'danger',
                    onSelect: () => setDeleteTarget({ kind: 'species' }),
                  },
                ]}
              />
            }
          />
        </ProfileArea>

        <IndividualsSection>
          <SectionHeader
            title="개체"
            count={individuals.length}
            unit="마리"
            action={
              <LinkButton to={`/species/${speciesId}/individuals/create`}>
                개체 등록하기
              </LinkButton>
            }
          />

          <IndividualTable
            individuals={pageIndividuals}
            onRowClick={(id) =>
              navigate(`/species/${speciesId}/individuals/${id}`)
            }
            search={{
              value: query,
              onChange: setQuery,
              placeholder: '개체이름 또는 국명을 입력해주세요',
              ariaLabel: '개체 검색',
            }}
            sort={{
              value: sort,
              onChange: (value) => setSort(value as DataTableSortValue),
              ariaLabel: '개체 정렬',
            }}
            pagination={{ page: currentPage, pageCount, onChange: setPage }}
            emptyLabel={emptyLabel}
            renderRowAction={(individual) => (
              <KebabMenu
                placement="below-trigger"
                ariaLabel={`${individual.name} 개체 메뉴 열기`}
                open={openMenuKey === individualMenuKey(individual.id)}
                onOpenChange={(open) =>
                  setOpenMenuKey(open ? individualMenuKey(individual.id) : null)
                }
                onTriggerRef={(node) => {
                  if (node) {
                    individualMenuTriggersRef.current.set(individual.id, node)
                  } else {
                    individualMenuTriggersRef.current.delete(individual.id)
                  }
                }}
                items={[
                  {
                    label: '수정',
                    onSelect: () =>
                      navigate(
                        `/species/${speciesId}/individuals/${individual.id}/edit`,
                      ),
                  },
                  {
                    label: '삭제',
                    tone: 'danger',
                    onSelect: () =>
                      setDeleteTarget({
                        kind: 'individual',
                        individualId: individual.id,
                      }),
                  },
                ]}
              />
            )}
          />
        </IndividualsSection>
      </Content>

      {deleteTarget && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          description={<SpeciesDeleteDescription target={deleteTarget.kind} />}
          onCancel={handleCancelDelete}
          onConfirm={handleDelete}
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

function individualMenuKey(individualId: string) {
  return `individual:${individualId}`
}

const Page = styled.main`
  min-height: 100vh;
  padding: 75px 32px 120px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  margin: 0 auto;
`

const BackToSpeciesList = styled(BackLink)`
  align-self: flex-start;
`

// Figma: 뒤로가기(y=75, 높이 36) → 프로필 카드 y=144.
const ProfileArea = styled.div`
  margin-top: 33px;
`

// Figma: 프로필 카드 하단(y=484) → 섹션 헤더 y=544. 표는 섹션 헤더 하단 24(DataTable offsetTop).
const IndividualsSection = styled.section`
  margin-top: 60px;

  @media (max-width: 980px) {
    margin-top: 40px;
  }
`
