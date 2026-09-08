import { useCallback, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  deleteTask,
  findTaskMember,
  getMockTasks,
  recordDeletedMockTask,
  resolveTaskStatus,
  TaskTable,
  taskToday,
  type TaskListItem,
  type TaskStatus,
} from '@/entities/task'
import { CreateTaskButton } from '@/features/create-task'
import { RowActionMenu } from '@/features/row-actions'
import {
  CategoryTabs,
  DeleteConfirmationDialog,
  Toast,
  type ToastVariant,
} from '@/shared/ui'

const TABLE_PAGE_SIZE = 10

const tabs = ['전체 업무', '진행중', '완료', '지연']

const tabStatuses: Record<string, TaskStatus | null> = {
  '전체 업무': null,
  진행중: 'IN_PROGRESS',
  완료: 'DONE',
  지연: 'OVERDUE',
}

type TaskListToastKey = 'delete-success' | 'delete-error' | 'create-success'

interface TaskListLocationState {
  toast?: TaskListToastKey
}

const toastByKey: Record<
  TaskListToastKey,
  { variant: ToastVariant; message: string }
> = {
  'delete-success': {
    variant: 'success',
    message: '데이터 삭제에 성공했습니다',
  },
  'delete-error': { variant: 'error', message: '데이터 삭제에 실패했습니다' },
  'create-success': {
    variant: 'success',
    message: '데이터 생성에 성공했습니다',
  },
}

export function TaskListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [active, setActive] = useState(tabs[0])
  const [page, setPage] = useState(1)
  // 케밥 메뉴는 동시에 하나만 열린다. 열린 행 id 를 목록이 소유한다.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  // 페이지 안에서 발생한 토스트(삭제 결과). 진입 시 전달받는 토스트와 별개다.
  const [localToast, setLocalToast] = useState<TaskListToastKey | null>(null)
  const deletingRef = useRef(false)
  // 행별 `⋮` 버튼. 삭제 모달을 닫은 뒤 초점을 되돌리는 데 쓴다.
  const menuTriggersRef = useRef(new Map<string, HTMLButtonElement>())

  const focusMenuTrigger = useCallback((taskId: string) => {
    // 삭제된 행의 버튼은 이미 사라졌을 수 있어 남아 있을 때만 되돌린다.
    requestAnimationFrame(() => menuTriggersRef.current.get(taskId)?.focus())
  }, [])

  const {
    data: queryTasks,
    isPending,
    isError,
  } = useQuery({ queryKey: ['tasks'], queryFn: getMockTasks })
  const allTasks = useMemo(() => queryTasks ?? [], [queryTasks])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask({ id: Number(id) }),
  })

  // 생성·삭제 결과는 이동 state 로 전달받아 표시하고, 닫을 때 state 를 비워 재방문 시 다시 뜨지 않게 한다.
  const stateToast = (location.state as TaskListLocationState | null)?.toast
  const toastKey = localToast ?? stateToast
  const toast = toastKey ? toastByKey[toastKey] : undefined

  // 탭 필터와 표의 기한 표시가 어긋나지 않도록 기준일을 한 번만 잡는다.
  const today = useMemo(() => taskToday(), [])

  const items = useMemo<TaskListItem[]>(
    () =>
      allTasks.map((task) => ({
        id: task.id,
        assigneeName: findTaskMember(task.assigneeIds[0])?.name ?? '미지정',
        assigneeExtraCount: Math.max(task.assigneeIds.length - 1, 0),
        title: task.title,
        status: resolveTaskStatus(task, today),
        priority: task.priority,
        dueDate: task.dueDate,
      })),
    [allTasks, today],
  )

  const filtered = useMemo(() => {
    const status = tabStatuses[active]
    return status ? items.filter((item) => item.status === status) : items
  }, [active, items])

  const pageCount = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE))

  // 탭이 바뀌면 첫 페이지로 되돌린다. 렌더 중 상태 보정(effect 불필요).
  const [prevActive, setPrevActive] = useState(active)
  if (prevActive !== active) {
    setPrevActive(active)
    setPage(1)
  }
  const currentPage = Math.min(page, pageCount)

  const tasks = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * TABLE_PAGE_SIZE,
        currentPage * TABLE_PAGE_SIZE,
      ),
    [filtered, currentPage],
  )

  const dismissToast = useCallback(() => {
    setLocalToast(null)
    if (stateToast) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, navigate, stateToast])

  function handleDelete() {
    if (!deleteTargetId || deletingRef.current || deleteMutation.isPending) {
      return
    }

    deletingRef.current = true
    const targetId = deleteTargetId
    deleteMutation.mutate(targetId, {
      onSuccess: async () => {
        deletingRef.current = false
        setDeleteTargetId(null)
        recordDeletedMockTask(targetId)
        queryClient.removeQueries({ queryKey: ['tasks', targetId] })
        await queryClient.invalidateQueries({ queryKey: ['tasks'] })
        setLocalToast('delete-success')
        focusMenuTrigger(targetId)
      },
      onError: () => {
        deletingRef.current = false
        setDeleteTargetId(null)
        setLocalToast('delete-error')
        focusMenuTrigger(targetId)
      },
    })
  }

  if (isPending) {
    return (
      <StatePage>
        <StateCard role="status">업무를 불러오는 중입니다.</StateCard>
      </StatePage>
    )
  }

  if (isError) {
    return (
      <StatePage>
        <StateCard role="alert">
          업무를 불러오지 못했습니다. 다시 시도해 주세요.
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <Header>
          <div>
            <Title>업무관리</Title>
            <Subtitle>토이빌리지 업무 지시</Subtitle>
          </div>
          <CreateTaskButton />
        </Header>

        <CategoryTabs categories={tabs} active={active} onSelect={setActive} />

        <TaskTable
          tasks={tasks}
          today={today}
          onRowClick={(id) => navigate(`/tasks/${id}`)}
          pagination={{ page: currentPage, pageCount, onChange: setPage }}
          emptyLabel="등록된 업무가 없습니다."
          renderRowAction={(task) => (
            <RowActionMenu
              triggerLabel={`${task.assigneeName} ${task.title} 업무 메뉴 열기`}
              open={openMenuId === task.id}
              onOpenChange={(open) => setOpenMenuId(open ? task.id : null)}
              onTriggerRef={(node) => {
                if (node) menuTriggersRef.current.set(task.id, node)
                else menuTriggersRef.current.delete(task.id)
              }}
              items={[
                {
                  key: 'edit',
                  label: '수정',
                  onSelect: () => navigate(`/tasks/${task.id}/edit`),
                },
                {
                  key: 'delete',
                  label: '삭제',
                  tone: 'danger',
                  onSelect: () => setDeleteTargetId(task.id),
                },
              ]}
            />
          )}
        />
      </Content>

      {deleteTargetId && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={() => {
            const targetId = deleteTargetId
            setDeleteTargetId(null)
            focusMenuTrigger(targetId)
          }}
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
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
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
