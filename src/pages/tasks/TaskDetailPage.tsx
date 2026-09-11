import { useCallback, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteTask, getTask, TaskInfoRow } from '@/entities/task'
import {
  TaskProgressCard,
  TaskReportSummaryCard,
  type TaskReportProgressCounts,
  type TaskReportSummaryItem,
} from '@/entities/task-report'
import { RowActionMenu } from '@/features/row-actions'
import {
  AttachmentList,
  DeleteConfirmationDialog,
  Toast,
} from '@/shared/ui'
import { TaskBackLink } from './ui/TaskBackLink'

// `/tasks/:id` — 읽기 전용 업무 상세(Figma `task detail` yot 133:9725).
// 편집은 `/tasks/:id/edit`, 삭제는 이 화면의 케밥이 맡는다.
export function TaskDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const deletingRef = useRef(false)
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)

  const {
    data: task,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => getTask({ id: Number(id) }),
    enabled: Boolean(id),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask({ id: Number(id) }),
  })

  // 담당자별 보고 현황과 집계는 상세 조회 응답에 함께 온다. 따로 조회하지 않는다.
  // 서버 `MISSING`(미제출)은 화면에서 `심사대기` 로 보여준다(개발자 결정).
  const reportItems = useMemo<TaskReportSummaryItem[]>(
    () =>
      (task?.reports ?? []).map((report) => ({
        reportId: report.reportId,
        assigneeName: report.name,
        reviewStatus: report.status === 'MISSING' ? 'PENDING' : report.status,
      })),
    [task],
  )

  // 진행도도 같은 규칙이다. `재제출` 합산과 마찬가지로 미제출을 심사대기에 더한다.
  const progress = useMemo<TaskReportProgressCounts | undefined>(
    () =>
      task && {
        total: task.progress.total,
        approved: task.progress.approved,
        rejected: task.progress.rejected,
        pending: task.progress.pending + task.progress.missing,
      },
    [task],
  )

  const focusMenuTrigger = useCallback(() => {
    requestAnimationFrame(() => menuTriggerRef.current?.focus())
  }, [])

  function handleDelete() {
    if (deletingRef.current || deleteMutation.isPending) return

    deletingRef.current = true
    deleteMutation.mutate(undefined, {
      onSuccess: async () => {
        deletingRef.current = false
        queryClient.removeQueries({ queryKey: ['tasks', id] })
        await queryClient.invalidateQueries({ queryKey: ['tasks'] })
        navigate('/tasks', { state: { toast: 'delete-success' } })
      },
      onError: () => {
        deletingRef.current = false
        setDeleteDialogOpen(false)
        setDeleteFailed(true)
        focusMenuTrigger()
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

  if (isError || !task) {
    return (
      <StatePage>
        <StateCard role="alert">
          업무를 찾을 수 없습니다.
          <BackToList to="/tasks">목록으로 돌아가기</BackToList>
        </StateCard>
      </StatePage>
    )
  }

  const attachments = task.attachments

  return (
    <Page>
      <Content>
        <TopRow>
          <TaskBackLink />
          <RowActionMenu
            triggerLabel={`${task.title} 업무 메뉴 열기`}
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onTriggerRef={(node) => {
              menuTriggerRef.current = node
            }}
            items={[
              {
                key: 'edit',
                label: '수정',
                onSelect: () => navigate(`/tasks/${id}/edit`),
              },
              {
                key: 'delete',
                label: '삭제',
                tone: 'danger',
                onSelect: () => setDeleteDialogOpen(true),
              },
            ]}
          />
        </TopRow>

        <TaskInfoRow
          assigneeName={task.assignees[0]?.name ?? ''}
          assigneeExtraCount={Math.max(task.assigneeCount - 1, 0)}
          status={task.status}
          priority={task.priority}
          dueDate={task.dueDate}
        />

        <BodyCard>
          <BodyTitle>{task.title}</BodyTitle>
          <BodyContent>{task.content}</BodyContent>
        </BodyCard>

        {attachments.length > 0 && <AttachmentList fileNames={attachments} />}

        <BottomRow>
          <TaskReportSummaryCard
            items={reportItems}
            onSelect={(reportId) => navigate(`/task-reports/${reportId}`)}
          />
          {reportItems.length > 0 && progress && (
            <TaskProgressCard counts={progress} />
          )}
        </BottomRow>
      </Content>

      {deleteDialogOpen && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={() => {
            setDeleteDialogOpen(false)
            focusMenuTrigger()
          }}
          onConfirm={handleDelete}
        />
      )}

      {deleteFailed && (
        <Toast
          variant="error"
          message="데이터 삭제에 실패했습니다"
          onDismiss={() => setDeleteFailed(false)}
        />
      )}
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 32px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  gap: 32px;
  margin: 0 auto;
  padding-top: 75px;
`

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
`

const BodyCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const BodyTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 32px;
  font-weight: 600;
  line-height: 1.4;
`

const BodyContent = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
  white-space: pre-wrap;
`

const BottomRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 32px;

  @media (max-width: 980px) {
    flex-direction: column;
  }
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
  display: flex;
  width: min(100%, 560px);
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 48px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  text-align: center;
`

const BackToList = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  font-size: 20px;
  font-weight: 600;
`
