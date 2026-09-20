import { useCallback, useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { individualQueryKeys } from '@/entities/individual'
import { observationQueryKeys } from '@/entities/observation'
import {
  SpeciesTable,
  TaxonGroupTabs,
  deleteSpecies,
  getSpeciesList,
  speciesQueryKeys,
  taxonGroups,
  type TaxonGroup,
  type TaxonGroupTabValue,
} from '@/entities/species'
import {
  DeleteConfirmationDialog,
  KebabMenu,
  LinkButton,
  PageHeader,
  Toast,
  useFocusFrame,
} from '@/shared/ui'
import { readPageParam, useListSearchParams } from '@/shared/lib'
import { PageStatus } from './ui/PageStatus'
import { SpeciesDeleteDescription } from './ui/SpeciesDeleteDescription'
import { SpeciesEmptyMessage } from './ui/SpeciesEmptyMessage'
import { SpeciesListSkeleton } from './ui/SpeciesListSkeleton'
import { SEARCH_DEBOUNCE_MS, TABLE_PAGE_SIZE } from './ui/tablePage'
import { usePageToast } from './ui/usePageToast'

// URL 에 남기지 않을 기본값(전체 분류군·첫 페이지·검색어 없음).
const listParamDefaults = { taxon: 'ALL', keyword: '', page: '1' } as const

function isTaxonGroupTabValue(value: string): value is TaxonGroupTabValue {
  return value === 'ALL' || taxonGroups.includes(value as TaxonGroup)
}

// `/species` — 종 목록(Figma `individual (kebab)` yot 39:8751).
// 분류군·검색어·페이지는 서버가 거른다(`ANIMAL_KIND_QUERY_ALL`). 정렬은 없다.
export function SpeciesListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  // 조회 조건(분류군·검색어·페이지)은 URL 이 소유한다. 상세에 다녀와도 그대로 남는다.
  const { values, update } = useListSearchParams(listParamDefaults)
  // URL 은 사용자가 고칠 수 있다. 모르는 분류군 값은 기본값(전체)으로 본다.
  const taxonGroup: TaxonGroupTabValue = isTaxonGroupTabValue(values.taxon)
    ? values.taxon
    : 'ALL'
  const keyword = values.keyword
  const page = readPageParam(new URLSearchParams({ page: values.page }))
  const [query, setQuery] = useState(keyword)

  function setTaxonGroup(next: TaxonGroupTabValue) {
    update({ taxon: next, page: '1' })
  }

  function setPage(next: number) {
    update({ page: String(next) })
  }
  // 케밥 메뉴는 동시에 하나만 열린다. 열린 행 id 를 목록이 소유한다.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  // 생성·삭제 결과 토스트(이동 state 로 받은 것과 이 화면에서 발생한 것).
  const { toast, showToast, dismissToast } = usePageToast()
  const deletingRef = useRef(false)
  // 행별 `⋮` 버튼. 삭제 모달을 닫은 뒤 초점을 되돌리는 데 쓴다.
  const menuTriggersRef = useRef(new Map<string, HTMLButtonElement>())
  const focusFrame = useFocusFrame()

  // 입력값은 즉시 보이고, 조회 검색어(URL)는 디바운스해 타이핑 중 요청을 막는다.
  useEffect(() => {
    if (query.trim() === keyword) return

    const timer = setTimeout(
      () => update({ keyword: query.trim(), page: '1' }),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [query, keyword, update])

  const selectedTaxonGroup = taxonGroup === 'ALL' ? undefined : taxonGroup
  const speciesQuery = useQuery({
    queryKey: speciesQueryKeys.list({
      page,
      taxonGroup: selectedTaxonGroup,
      keyword,
    }),
    queryFn: () =>
      getSpeciesList({
        animalTaxonomic: selectedTaxonGroup,
        keyword: keyword || undefined,
        page,
        size: TABLE_PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  })

  const deleteMutation = useMutation({
    mutationFn: (speciesId: string) =>
      deleteSpecies({ animalKindId: Number(speciesId) }),
  })

  const pageCount = Math.max(1, speciesQuery.data?.totalPageSize ?? 1)

  // 삭제로 페이지가 범위를 벗어나면 마지막 페이지로 되돌린다.
  // URL 을 바꾸는 일이라 렌더가 끝난 뒤에 한다(렌더 중 라우터 갱신 금지).
  useEffect(() => {
    if (speciesQuery.data && page > pageCount) setPage(pageCount)
    // setPage 는 렌더마다 새로 만들어지므로 의존성에 넣지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speciesQuery.data, page, pageCount])

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
        // 종 삭제는 그 종의 개체·관찰 기록도 함께 지운다(연쇄 삭제).
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

  if (speciesQuery.isError) {
    return (
      <PageStatus
        state="error"
        message="종 목록을 불러오지 못했습니다. 다시 시도해 주세요."
      />
    )
  }

  if (speciesQuery.isPending) {
    return (
      <Page>
        <Content>
          <SpeciesListSkeleton />
        </Content>
      </Page>
    )
  }

  const emptyLabel = keyword ? (
    '검색결과가 없습니다'
  ) : (
    <SpeciesEmptyMessage
      title="등록된 개체 카드가 없습니다"
      description="오른쪽 위 [종 등록하기]로 첫 개체 카드를 추가해주세요"
    />
  )

  return (
    <Page>
      <Content>
        <PageHeader
          title="개체 카드"
          subtitle="토이빌리지의 종 목록"
          action={<LinkButton to="/species/create">종 등록하기</LinkButton>}
        />

        <TaxonGroupTabs value={taxonGroup} onChange={setTaxonGroup} />

        <SpeciesTable
          species={speciesQuery.data?.items ?? []}
          onRowClick={(id) =>
            navigate(`/species/${id}`, {
              state: { speciesListSearch: location.search },
            })
          }
          search={{
            value: query,
            onChange: setQuery,
            placeholder: '개체이름 또는 국명을 입력해주세요',
            ariaLabel: '종 검색',
          }}
          pagination={{
            page: Math.min(page, pageCount),
            pageCount,
            onChange: setPage,
          }}
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
