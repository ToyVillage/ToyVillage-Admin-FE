import { useCallback, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteTask,
  findTaskMember,
  getMockTask,
  recordDeletedMockTask,
  TaskInfoRow,
} from '@/entities/task'
import {
  getMockTaskReportsByTaskId,
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
    queryFn: () => getMockTask(id),
    enabled: Boolean(id),
  })

  const { data: reports } = useQuery({
    queryKey: ['task-reports', 'by-task', id],
    queryFn: () => getMockTaskReportsByTaskId(id),
    enabled: Boolean(id),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask({ id: Number(id) }),
  })

  const reportItems = useMemo<TaskReportSummaryItem[]>(
    () =>
      (reports ?? []).map((report) => ({
        reportId: report.id,
        assigneeName: findTaskMember(report.assigneeId)?.name ?? '미지정',
        reviewStatus: report.reviewStatus,
      })),
    [reports],
  )

  // `재제출` 은 별도 조각 없이 `심사대기` 에 합산한다(spec 결정 사항).
  const progress = useMemo<TaskReportProgressCounts>(
    () => ({
      total: reportItems.length,
      approved: reportItems.filter((item) => item.reviewStatus === 'APPROVED')
        .length,
      rejected: reportItems.filter((item) => item.reviewStatus === 'REJECTED')
        .length,
      pending: reportItems.filter(
        (item) =>
          item.reviewStatus === 'PENDING' ||
          item.reviewStatus === 'RESUBMITTED',
      ).length,
    }),
    [reportItems],
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
        recordDeletedMockTask(id)
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

  const [leadAssigneeId, ...restAssigneeIds] = task.assigneeIds
  const attachments = task.attachments ?? []

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
          assigneeName={findTaskMember(leadAssigneeId)?.name ?? '미지정'}
          assigneeExtraCount={restAssigneeIds.length}
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
          {reportItems.length > 0 && <TaskProgressCard counts={progress} />}
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
