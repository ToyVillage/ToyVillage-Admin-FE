import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  findTaskAssignee,
  getMockTasks,
  TaskTable,
  type TaskListItem,
  type TaskStatus,
} from '@/entities/task'
import { CreateTaskButton } from '@/features/create-task'
import { CategoryTabs, Toast, type ToastVariant } from '@/shared/ui'

const TABLE_PAGE_SIZE = 4

const tabs = ['전체 업무', '진행중', '완료']

const tabStatuses: Record<string, TaskStatus | null> = {
  '전체 업무': null,
  진행중: 'IN_PROGRESS',
  완료: 'DONE',
}

interface TaskListLocationState {
  toast?: 'delete-success' | 'delete-error'
}

const toastByKey: Record<string, { variant: ToastVariant; message: string }> = {
  'delete-success': {
    variant: 'success',
    message: '데이터 삭제에 성공했습니다',
  },
  'delete-error': { variant: 'error', message: '데이터 삭제에 실패했습니다' },
}

export function TaskListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState(tabs[0])
  const [page, setPage] = useState(1)

  const {
    data: queryTasks,
    isPending,
    isError,
  } = useQuery({ queryKey: ['tasks'], queryFn: getMockTasks })
  const allTasks = useMemo(() => queryTasks ?? [], [queryTasks])

  // 삭제 결과는 이동 state 로 전달받아 표시하고, 닫을 때 state 를 비워 재방문 시 다시 뜨지 않게 한다.
  const stateToast = (location.state as TaskListLocationState | null)?.toast
  const toast = stateToast ? toastByKey[stateToast] : undefined

  const items = useMemo<TaskListItem[]>(
    () =>
      allTasks.map((task) => ({
        id: task.id,
        assigneeName: findTaskAssignee(task.assigneeId)?.name ?? '미지정',
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        visibility: task.visibility,
      })),
    [allTasks],
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
          onRowClick={(id) => navigate(`/tasks/${id}`)}
          pagination={{ page: currentPage, pageCount, onChange: setPage }}
          emptyLabel="등록된 업무가 없습니다."
        />
      </Content>

      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          onDismiss={() =>
            navigate(location.pathname, { replace: true, state: null })
          }
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
