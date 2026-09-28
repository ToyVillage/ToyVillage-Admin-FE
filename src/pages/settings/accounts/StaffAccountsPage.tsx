import { useCallback, useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  StaffAccountTable,
  addStaffAccount,
  deleteStaffAccount,
  getStaffAccounts,
  resetStaffAccountPassword,
  staffAccountQueryKeys,
  type StaffAccount,
} from '@/entities/employee'
import {
  CreateAccountDialog,
  createEmployee,
  type CreateAccountInput,
  type CreateAccountSubmit,
} from '@/features/create-account'
import { readPageParam, useListSearchParams } from '@/shared/lib'
import {
  DeleteConfirmationDialog,
  KebabMenu,
  PageHeader,
  PillButton,
  Toast,
  useFocusFrame,
  type ToastVariant,
} from '@/shared/ui'
import searchIcon from '@/shared/ui/assets/search-material.svg'

type PendingAction = { kind: 'reset' | 'delete'; account: StaffAccount }

interface PageToast {
  variant: ToastVariant
  message: string
}

// Figma 목록은 한 페이지 5행이다(총 12명 · 3페이지).
const PAGE_SIZE = 5
// 검색어 입력 뒤 목록에 반영하기까지 기다리는 시간(다른 목록 화면과 같다).
const SEARCH_DEBOUNCE_MS = 200
// URL 에 남기지 않을 기본값(검색어 없음·첫 페이지).
const listParamDefaults = { keyword: '', page: '1' } as const

// `/settings/accounts` — 직원 계정 관리(Figma `직원 계정 관리` 2434:24498).
// 목록·삭제·비밀번호 초기화는 퍼블리싱 mock 이고, 계정 생성만 실제 API 를 쓴다.
export function StaffAccountsPage() {
  const queryClient = useQueryClient()
  const { values, update } = useListSearchParams(listParamDefaults)
  const keyword = values.keyword
  const page = readPageParam(new URLSearchParams({ page: values.page }))
  const [query, setQuery] = useState(keyword)
  // URL 검색어가 입력 밖에서 바뀌면(사이드바 재진입·뒤로가기) 입력도 맞춘다.
  // 디바운스가 쓴 값(= 입력값)이면 그대로 두어 타이핑 중인 입력을 덮지 않는다.
  const [syncedKeyword, setSyncedKeyword] = useState(keyword)
  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword)
    if (keyword !== query.trim()) setQuery(keyword)
  }
  const [createOpen, setCreateOpen] = useState(false)
  // 케밥 메뉴는 동시에 하나만 열린다.
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [toast, setToast] = useState<PageToast | null>(null)
  // 확인 요청부터 목록 갱신까지. mutation 의 isPending 은 onSuccess(갱신 대기) 전에 풀려
  // 그 사이 `확인` 이 다시 눌리므로 모달의 처리 중 상태를 따로 잡는다.
  const [confirming, setConfirming] = useState(false)
  // 행별 `⋮` 버튼. 확인 모달을 닫은 뒤 초점을 되돌리는 데 쓴다.
  const menuTriggersRef = useRef(new Map<number, HTMLButtonElement>())
  const focusFrame = useFocusFrame()

  const accountsQuery = useQuery({
    queryKey: staffAccountQueryKeys.list,
    queryFn: getStaffAccounts,
  })
  const createMutation = useMutation({ mutationFn: createEmployee })
  const deleteMutation = useMutation({ mutationFn: deleteStaffAccount })
  const resetMutation = useMutation({ mutationFn: resetStaffAccountPassword })

  // 입력값은 즉시 보이고, 목록 검색어(URL)는 디바운스해 반영한다.
  useEffect(() => {
    if (query.trim() === keyword) return

    const timer = setTimeout(
      () => update({ keyword: query.trim(), page: '1' }),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [query, keyword, update])

  const matchedAccounts = filterAccounts(accountsQuery.data ?? [], keyword)
  const pageCount = Math.max(1, Math.ceil(matchedAccounts.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageAccounts = matchedAccounts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  // 삭제로 페이지가 범위를 벗어나면 마지막 페이지로 되돌린다.
  // URL 을 바꾸는 일이라 렌더가 끝난 뒤에 한다(렌더 중 라우터 갱신 금지).
  useEffect(() => {
    if (accountsQuery.data && page > pageCount) {
      update({ page: String(pageCount) })
    }
  }, [accountsQuery.data, page, pageCount, update])

  const dismissToast = useCallback(() => setToast(null), [])
  const closeCreate = useCallback(() => setCreateOpen(false), [])

  const submitCreate: CreateAccountSubmit = async ({ name, username }) => {
    await createMutation.mutateAsync({ username, name })
  }

  // 모달은 곧바로 닫고 목록은 뒤에서 갱신한다. 갱신을 기다리는 동안 모달이 열려 있으면
  // 이미 끝난 제출을 Escape 로 취소하거나 다시 보낼 틈이 생긴다.
  function handleCreated(input: CreateAccountInput) {
    setCreateOpen(false)
    setToast({ variant: 'success', message: '계정 생성에 성공했습니다' })
    void addStaffAccount(input).then(() =>
      queryClient.invalidateQueries({ queryKey: staffAccountQueryKeys.list }),
    )
  }

  function focusMenuTrigger(accountId: number) {
    // 삭제된 행의 버튼은 이미 사라졌을 수 있어 남아 있을 때만 되돌린다.
    focusFrame(() => menuTriggersRef.current.get(accountId))
  }

  function cancelPendingAction() {
    if (!pendingAction) return
    const accountId = pendingAction.account.id
    setPendingAction(null)
    focusMenuTrigger(accountId)
  }

  function confirmPendingAction() {
    if (!pendingAction || confirming) return
    const { kind, account } = pendingAction
    const mutation = kind === 'delete' ? deleteMutation : resetMutation

    setConfirming(true)
    mutation.mutate(account.id, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: staffAccountQueryKeys.list,
        })
        setConfirming(false)
        setPendingAction(null)
        setToast({
          variant: 'success',
          message:
            kind === 'delete'
              ? '데이터 삭제에 성공했습니다'
              : '비밀번호 초기화에 성공했습니다',
        })
        if (kind === 'reset') focusMenuTrigger(account.id)
      },
      onError: () => {
        setConfirming(false)
        setPendingAction(null)
        setToast({
          variant: 'error',
          message:
            kind === 'delete'
              ? '데이터 삭제에 실패했습니다'
              : '비밀번호 초기화에 실패했습니다',
        })
        focusMenuTrigger(account.id)
      },
    })
  }

  return (
    <Page>
      <Content>
        <PageHeader
          title="직원 계정 관리"
          subtitle="토이빌리지 직원 계정 관리"
          action={
            <PillButton onClick={() => setCreateOpen(true)}>
              계정 생성하기
            </PillButton>
          }
        />

        <Search>
          <SearchIcon src={searchIcon} alt="" aria-hidden="true" />
          <SearchInput
            type="search"
            value={query}
            placeholder="이름 또는 아이디 검색"
            aria-label="이름 또는 아이디 검색"
            onChange={(event) => setQuery(event.target.value)}
          />
        </Search>

        <TableArea>
          <StaffAccountTable
            loading={accountsQuery.isPending}
            accounts={pageAccounts}
            total={matchedAccounts.length}
            pagination={{
              page: currentPage,
              pageCount,
              onChange: (next) => update({ page: String(next) }),
            }}
            emptyLabel={
              accountsQuery.isPending ? undefined : '검색결과가 없습니다'
            }
            renderRowAction={(account) => (
              <KebabMenu
                placement="below-trigger"
                ariaLabel={`${account.name} 계정 메뉴`}
                open={openMenuId === account.id}
                onOpenChange={(open) => setOpenMenuId(open ? account.id : null)}
                onTriggerRef={(node) => {
                  if (node) menuTriggersRef.current.set(account.id, node)
                  else menuTriggersRef.current.delete(account.id)
                }}
                items={[
                  {
                    label: '비밀번호 초기화',
                    onSelect: () =>
                      setPendingAction({ kind: 'reset', account }),
                  },
                  {
                    label: '삭제',
                    tone: 'danger',
                    onSelect: () =>
                      setPendingAction({ kind: 'delete', account }),
                  },
                ]}
              />
            )}
          />
        </TableArea>
      </Content>

      {createOpen && (
        <CreateAccountDialog
          onSubmit={submitCreate}
          onCancel={closeCreate}
          onCreated={handleCreated}
          onError={() =>
            setToast({
              variant: 'error',
              message: '데이터 생성에 실패했습니다',
            })
          }
        />
      )}

      {pendingAction?.kind === 'delete' && (
        <DeleteConfirmationDialog
          pending={confirming}
          onCancel={cancelPendingAction}
          onConfirm={confirmPendingAction}
        />
      )}

      {pendingAction?.kind === 'reset' && (
        <DeleteConfirmationDialog
          pending={confirming}
          title="비밀번호를 초기화하시겠습니까?"
          description="초기화하면 비밀번호가 직원 아이디로 바뀝니다"
          confirmLabel="초기화"
          pendingLabel="초기화 중"
          onCancel={cancelPendingAction}
          onConfirm={confirmPendingAction}
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

// 이름 또는 아이디에 검색어가 든 계정(대소문자 무시).
function filterAccounts(
  accounts: StaffAccount[],
  keyword: string,
): StaffAccount[] {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return accounts

  return accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(needle) ||
      account.username.toLowerCase().includes(needle),
  )
}

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

const Search = styled.label`
  display: flex;
  width: min(100%, 400px);
  height: 52px;
  align-items: center;
  gap: 10px;
  margin-top: 40px;
  padding: 0 20px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`

const SearchIcon = styled.img`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`

const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 20px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
  }

  &::-webkit-search-cancel-button {
    cursor: pointer;
  }
`

const TableArea = styled.div`
  margin-top: 32px;
`
