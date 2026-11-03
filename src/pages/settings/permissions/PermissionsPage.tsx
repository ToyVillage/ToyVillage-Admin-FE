import { useCallback, useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MiddleManagerTable,
  assignMiddleManagers,
  filterByNameOrUsername,
  getAssignableEmployees,
  getMiddleManagers,
  middleManagerQueryKeys,
  releaseMiddleManager,
  type MiddleManager,
} from '@/entities/employee'
import { AssignMiddleManagerDialog } from '@/features/assign-middle-manager'
import { useListSearchParams } from '@/shared/lib'
import {
  DeleteConfirmationDialog,
  OutlinedSearchField,
  PageHeader,
  PillButton,
  Toast,
  useFocusFrame,
  type ToastVariant,
} from '@/shared/ui'

interface PageToast {
  variant: ToastVariant
  message: string
}

// 검색어 입력 뒤 목록에 반영하기까지 기다리는 시간(다른 목록 화면과 같다).
const SEARCH_DEBOUNCE_MS = 200
// URL 에 남기지 않을 기본값(검색어 없음).
const listParamDefaults = { keyword: '' } as const

// `/settings/permissions` — 권한 관리(Figma `권한 관리` 3830:25854).
// 목록·지정·해제는 퍼블리싱 mock 이다. 실제 API 는 `/api` 스킬이 연결한다.
export function PermissionsPage() {
  const queryClient = useQueryClient()
  const { values, update } = useListSearchParams(listParamDefaults)
  const keyword = values.keyword
  const [query, setQuery] = useState(keyword)
  // URL 검색어가 입력 밖에서 바뀌면(사이드바 재진입·뒤로가기) 입력도 맞춘다.
  // 디바운스가 쓴 값(= 입력값)이면 그대로 두어 타이핑 중인 입력을 덮지 않는다.
  const [syncedKeyword, setSyncedKeyword] = useState(keyword)
  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword)
    if (keyword !== query.trim()) setQuery(keyword)
  }
  const [assignOpen, setAssignOpen] = useState(false)
  const [releaseTarget, setReleaseTarget] = useState<MiddleManager | null>(null)
  const [toast, setToast] = useState<PageToast | null>(null)
  // 확인 요청부터 목록 갱신까지. mutation 의 isPending 은 onSuccess(갱신 대기) 전에 풀려
  // 그 사이 `해제` 가 다시 눌리므로 모달의 처리 중 상태를 따로 잡는다.
  const [releasing, setReleasing] = useState(false)
  // 행별 `해제` 버튼. 확인 모달을 닫은 뒤 초점을 되돌리는 데 쓴다.
  const releaseTriggersRef = useRef(new Map<number, HTMLButtonElement>())
  const focusFrame = useFocusFrame()

  const managersQuery = useQuery({
    queryKey: middleManagerQueryKeys.list,
    queryFn: getMiddleManagers,
  })
  const assignableQuery = useQuery({
    queryKey: middleManagerQueryKeys.assignable,
    queryFn: getAssignableEmployees,
  })
  const assignMutation = useMutation({ mutationFn: assignMiddleManagers })
  const releaseMutation = useMutation({ mutationFn: releaseMiddleManager })

  // 입력값은 즉시 보이고, 목록 검색어(URL)는 디바운스해 반영한다.
  useEffect(() => {
    if (query.trim() === keyword) return

    const timer = setTimeout(
      () => update({ keyword: query.trim() }),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [query, keyword, update])

  const managers = managersQuery.data ?? []
  const matchedManagers = filterByNameOrUsername(managers, keyword)
  // 검색 결과가 없는 것과 구분한다. 빈 상태에는 안내 문구만 있고 `총 N명` 이 없다.
  const noManagers =
    managersQuery.isSuccess && managers.length === 0 && keyword === ''

  const dismissToast = useCallback(() => setToast(null), [])
  const closeAssign = useCallback(() => setAssignOpen(false), [])

  function invalidateMiddleManagers() {
    return queryClient.invalidateQueries({
      queryKey: middleManagerQueryKeys.all,
    })
  }

  // 모달은 곧바로 닫고 목록은 뒤에서 갱신한다. 갱신을 기다리는 동안 모달이 열려 있으면
  // 이미 끝난 제출을 Escape 로 취소하거나 다시 보낼 틈이 생긴다.
  function handleAssigned() {
    setAssignOpen(false)
    setToast({ variant: 'success', message: '권한 부여에 성공했습니다' })
    void invalidateMiddleManagers()
  }

  function focusReleaseTrigger(managerId: number) {
    // 해제된 행의 버튼은 이미 사라졌을 수 있어 남아 있을 때만 되돌린다.
    focusFrame(() => releaseTriggersRef.current.get(managerId))
  }

  function cancelRelease() {
    if (!releaseTarget) return
    const managerId = releaseTarget.id
    setReleaseTarget(null)
    focusReleaseTrigger(managerId)
  }

  function confirmRelease() {
    if (!releaseTarget || releasing) return
    const managerId = releaseTarget.id

    setReleasing(true)
    releaseMutation.mutate(managerId, {
      onSuccess: async () => {
        await invalidateMiddleManagers()
        setReleasing(false)
        setReleaseTarget(null)
        setToast({ variant: 'success', message: '권한 해제에 성공했습니다' })
      },
      onError: () => {
        setReleasing(false)
        setReleaseTarget(null)
        setToast({ variant: 'error', message: '권한 해제에 실패했습니다' })
        focusReleaseTrigger(managerId)
      },
    })
  }

  // 조회 실패를 빈 목록으로 숨기지 않는다(다른 목록 화면과 같은 상태 카드).
  if (managersQuery.isError) {
    return (
      <StatePage>
        <StateCard role="alert">
          중간 관리자 목록을 불러오지 못했습니다. 다시 시도해 주세요.
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <PageHeader
          title="권한 관리"
          subtitle="토이빌리지 중간 관리자 지정 및 해제"
          action={
            <PillButton onClick={() => setAssignOpen(true)}>
              중간 관리자 지정
            </PillButton>
          }
        />

        <SearchArea>
          <OutlinedSearchField
            value={query}
            placeholder="이름 또는 아이디 검색"
            ariaLabel="이름 또는 아이디 검색"
            onChange={setQuery}
          />
        </SearchArea>

        <TableArea>
          <MiddleManagerTable
            loading={managersQuery.isPending}
            managers={matchedManagers}
            total={matchedManagers.length}
            showTotal={!managersQuery.isPending && !noManagers}
            emptyLabel={
              managersQuery.isPending ? undefined : noManagers ? (
                <EmptyNotice>
                  <EmptyTitle>지정된 중간 관리자가 없어요</EmptyTitle>
                  <EmptyDescription>
                    중간 관리자 지정 버튼으로 직원을 지정해 보세요
                  </EmptyDescription>
                </EmptyNotice>
              ) : (
                '검색결과가 없습니다'
              )
            }
            emptyMinHeight={noManagers ? 420 : undefined}
            renderRowAction={(manager) => (
              <ReleaseButton
                ref={(node) => {
                  if (node) releaseTriggersRef.current.set(manager.id, node)
                  else releaseTriggersRef.current.delete(manager.id)
                }}
                type="button"
                aria-label={`${manager.name} 중간 관리자 해제`}
                onClick={() => setReleaseTarget(manager)}
              >
                해제
              </ReleaseButton>
            )}
          />
        </TableArea>
      </Content>

      {assignOpen && (
        <AssignMiddleManagerDialog
          employees={assignableQuery.data ?? []}
          loading={assignableQuery.isPending}
          loadFailed={assignableQuery.isError}
          onSubmit={(employeeIds) => assignMutation.mutateAsync(employeeIds)}
          onCancel={closeAssign}
          onAssigned={handleAssigned}
          onError={() =>
            setToast({ variant: 'error', message: '권한 부여에 실패했습니다' })
          }
        />
      )}

      {releaseTarget && (
        <DeleteConfirmationDialog
          pending={releasing}
          title="중간 관리자를 해제하시겠습니까?"
          description={
            <>
              해제하면 {releaseTarget.name}님은
              <br />
              직원 권한으로 돌아갑니다
            </>
          }
          confirmLabel="해제"
          pendingLabel="해제 중"
          onCancel={cancelRelease}
          onConfirm={confirmRelease}
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

const StatePage = styled.main`
  display: grid;
  min-height: 100vh;
  padding: 32px;
  place-items: center;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const StateCard = styled.section`
  width: min(100%, 560px);
  padding: 48px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  text-align: center;
`

const Page = styled.main`
  min-height: 100vh;
  padding: 32px 32px 120px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

// Figma: 제목 top 124, 검색 top 286(제목 블록 아래 40), 카드 top 370(검색 아래 32).
const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-top: calc(124px - 32px);

  @media (max-width: 980px) {
    padding-top: 60px;
  }
`

const SearchArea = styled.div`
  width: min(100%, 400px);
  margin-top: 40px;
`

const TableArea = styled.div`
  margin-top: 32px;
`

// Figma `button / 해제`(3830:25858).
const ReleaseButton = styled.button`
  padding: 10px 20px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textBody};
  cursor: pointer;
  font: inherit;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

// Figma 빈 상태(3832:25931) — 24 / 20, 간격 12.
const EmptyNotice = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`

const EmptyTitle = styled.p`
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const EmptyDescription = styled.p`
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`
