import { useCallback, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  getMockIndividuals,
  individualQueryKeys,
  type Individual,
} from '@/entities/individual'
import { observationQueryKeys } from '@/entities/observation'
import {
  deleteMockSpecies,
  getMockSpeciesList,
  SpeciesTable,
  speciesQueryKeys,
  TaxonGroupTabs,
  type Species,
  type TaxonGroupTabValue,
} from '@/entities/species'
import {
  DeleteConfirmationDialog,
  KebabMenu,
  LinkButton,
  PageHeader,
  Toast,
  useFocusFrame,
  type DataTableSortValue,
} from '@/shared/ui'
import { SpeciesDeleteDescription } from './ui/SpeciesDeleteDescription'
import { SpeciesEmptyMessage } from './ui/SpeciesEmptyMessage'
import { tablePage } from './ui/tablePage'
import { usePageToast } from './ui/usePageToast'

interface SpeciesIndividualNames {
  namesBySpecies: Map<string, string[]>
  /** 아직 개체를 읽는 중인 종이 있다 — 이름을 모르는 종은 검색에서 빼지 않는다. */
  loading: boolean
}

// `/species` — 종 목록(Figma `individual (kebab)` yot 39:8751).
// 필터·검색·정렬·페이지 슬라이싱은 mock 전체 목록을 받아 이 화면이 한다.
export function SpeciesListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [taxonGroup, setTaxonGroup] = useState<TaxonGroupTabValue>('ALL')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<DataTableSortValue>('newest')
  const [page, setPage] = useState(1)
  // 케밥 메뉴는 동시에 하나만 열린다. 열린 행 id 를 목록이 소유한다.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  // 생성·삭제 결과 토스트(이동 state 로 받은 것과 이 화면에서 발생한 것).
  const { toast, showToast, dismissToast } = usePageToast()
  const deletingRef = useRef(false)
  // 행별 `⋮` 버튼. 삭제 모달을 닫은 뒤 초점을 되돌리는 데 쓴다.
  const menuTriggersRef = useRef(new Map<string, HTMLButtonElement>())
  const focusFrame = useFocusFrame()

  const speciesQuery = useQuery({
    queryKey: speciesQueryKeys.list,
    queryFn: getMockSpeciesList,
  })
  const speciesList = useMemo(
    () => speciesQuery.data ?? [],
    [speciesQuery.data],
  )

  const keyword = query.trim().toLowerCase()

  // 검색은 국명과 그 종에 속한 개체명을 함께 본다. 개체는 검색어가 있을 때만,
  // 종 상세와 같은 query 로 종마다 읽는다(캐시를 함께 쓴다).
  const individualNames = useQueries({
    queries: speciesList.map((species) => ({
      queryKey: individualQueryKeys.list(species.id),
      queryFn: () => getMockIndividuals(species.id),
      enabled: Boolean(keyword),
    })),
    combine: collectIndividualNames,
  })

  const deleteMutation = useMutation({ mutationFn: deleteMockSpecies })

  const filtered = useMemo(
    () =>
      speciesList
        .filter(
          (species) =>
            taxonGroup === 'ALL' || species.taxonGroup === taxonGroup,
        )
        .filter(
          (species) =>
            !keyword || matchesKeyword(species, individualNames, keyword),
        )
        .sort((a, b) =>
          sort === 'newest'
            ? Number(b.id) - Number(a.id)
            : Number(a.id) - Number(b.id),
        ),
    [individualNames, keyword, sort, speciesList, taxonGroup],
  )

  const {
    pageCount,
    currentPage,
    pageRows: pageSpecies,
  } = tablePage(filtered, page)

  // 탭·검색어·정렬이 바뀌면 첫 페이지로, 삭제로 페이지가 범위를 벗어나면 마지막 페이지로 되돌린다.
  // 렌더 중 상태 보정(effect 불필요).
  const filterKey = `${taxonGroup}|${query}|${sort}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  } else if (page > pageCount) {
    setPage(pageCount)
  }

  const focusMenuTrigger = useCallback(
    (speciesId: string) => {
      // 삭제된 행의 버튼은 이미 사라졌을 수 있어 남아 있을 때만 되돌린다.
      focusFrame(() => menuTriggersRef.current.get(speciesId))
    },
    [focusFrame],
  )

  function handleDelete() {
    if (!deleteTargetId || deletingRef.current || deleteMutation.isPending) {
      return
    }

    deletingRef.current = true
    const targetId = deleteTargetId
    deleteMutation.mutate(targetId, {
      onSuccess: async () => {
        queryClient.removeQueries({
          queryKey: speciesQueryKeys.detail(targetId),
        })
        // 종 삭제는 그 종의 개체·관찰 기록도 함께 숨긴다(연쇄 삭제).
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: speciesQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: individualQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: observationQueryKeys.all }),
        ])
        deletingRef.current = false
        setDeleteTargetId(null)
        showToast('delete-success')
      },
      onError: () => {
        deletingRef.current = false
        setDeleteTargetId(null)
        showToast('delete-error')
        focusMenuTrigger(targetId)
      },
    })
  }

  function handleCancelDelete() {
    if (!deleteTargetId) return
    const targetId = deleteTargetId
    setDeleteTargetId(null)
    focusMenuTrigger(targetId)
  }

  // 로딩 중에는 빈 상태 문구를 띄우지 않는다.
  const emptyLabel = speciesQuery.isPending ? undefined : keyword ? (
    '검색결과가 없습니다'
  ) : (
    <SpeciesEmptyMessage
      title="등록된 개체 카드가 없습니다"
      description="오른쪽 위 [개체 등록하기]로 첫 개체 카드를 추가해주세요"
    />
  )

  return (
    <Page>
      <Content>
        <PageHeader
          title="개체 카드"
          subtitle="토이빌리지의 등록된 개체 목록"
          action={<LinkButton to="/species/create">개체 등록하기</LinkButton>}
        />

        <TaxonGroupTabs value={taxonGroup} onChange={setTaxonGroup} />

        <SpeciesTable
          species={pageSpecies}
          onRowClick={(id) => navigate(`/species/${id}`)}
          search={{
            value: query,
            onChange: setQuery,
            placeholder: '개체이름 또는 국명을 입력해주세요',
            ariaLabel: '종 검색',
          }}
          sort={{
            value: sort,
            onChange: (value) => setSort(value as DataTableSortValue),
            ariaLabel: '종 정렬',
          }}
          pagination={{ page: currentPage, pageCount, onChange: setPage }}
          emptyLabel={emptyLabel}
          renderRowAction={(species) => (
            <KebabMenu
              placement="below-trigger"
              ariaLabel={`${species.koreanName} 관리 메뉴`}
              open={openMenuId === species.id}
              onOpenChange={(open) => setOpenMenuId(open ? species.id : null)}
              onTriggerRef={(node) => {
                if (node) menuTriggersRef.current.set(species.id, node)
                else menuTriggersRef.current.delete(species.id)
              }}
              items={[
                {
                  label: '수정',
                  onSelect: () => navigate(`/species/${species.id}/edit`),
                },
                {
                  label: '삭제',
                  tone: 'danger',
                  onSelect: () => setDeleteTargetId(species.id),
                },
              ]}
            />
          )}
        />
      </Content>

      {deleteTargetId && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          description={<SpeciesDeleteDescription target="species" />}
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

function collectIndividualNames(
  results: UseQueryResult<Individual[]>[],
): SpeciesIndividualNames {
  const namesBySpecies = new Map<string, string[]>()
  for (const individual of results.flatMap((result) => result.data ?? [])) {
    const names = namesBySpecies.get(individual.speciesId) ?? []
    names.push(individual.name)
    namesBySpecies.set(individual.speciesId, names)
  }
  return {
    namesBySpecies,
    loading: results.some((result) => result.isLoading),
  }
}

/**
 * 국명 또는 소속 개체명 부분 일치. `keyword` 는 앞뒤 공백을 뺀 소문자다.
 * 개체를 아직 못 읽은 종은 검색 결과에 남겨 둔다(읽고 나서 다시 판단한다).
 */
function matchesKeyword(
  species: Species,
  { namesBySpecies, loading }: SpeciesIndividualNames,
  keyword: string,
) {
  const individualNames = namesBySpecies.get(species.id)
  if (!individualNames && loading) return true

  return [species.koreanName, ...(individualNames ?? [])].some((name) =>
    name.toLowerCase().includes(keyword),
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 32px 32px 120px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-top: calc(124px - 32px);

  @media (max-width: 980px) {
    padding-top: 60px;
  }
`
