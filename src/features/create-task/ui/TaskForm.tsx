import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createMockTask,
  deleteMockTask,
  taskAssignees,
  taskVisibilityOptions,
  updateMockTask,
  type Task,
  type TaskPriority,
  type UpdateTaskInput,
} from '@/entities/task'
import {
  AttachmentField,
  DateField,
  DeleteConfirmationDialog,
  Toast,
  ValidationDialog,
  type AttachmentAddResult,
  type ToastVariant,
} from '@/shared/ui'
import { TaskPriorityField } from './TaskPriorityField'
import { TaskSelectField } from './TaskSelectField'

type FieldName =
  | 'priority'
  | 'dueDate'
  | 'visibility'
  | 'assigneeId'
  | 'title'
  | 'content'

// 검증 순서는 화면의 시각적 순서를 따른다(spec 결정 사항).
const validationOrder: FieldName[] = [
  'priority',
  'dueDate',
  'visibility',
  'assigneeId',
  'title',
  'content',
]

const validationMessages: Record<FieldName, string> = {
  priority: '우선순위를 선택해주세요',
  dueDate: '완료기한을 선택해주세요',
  visibility: '공개범위를 선택해주세요',
  assigneeId: '담당자를 선택해주세요',
  title: '제목을 입력해주세요',
  content: '상세 업무 내용을 입력해주세요',
}

interface ToastState {
  variant: ToastVariant
  message: string
}

interface TaskFormProps {
  initialTask?: Task
  onCompleted: (result: 'saved' | 'deleted') => void
  onDirtyChange: (isDirty: boolean) => void
}

export function TaskForm({
  initialTask,
  onCompleted,
  onDirtyChange,
}: TaskFormProps) {
  const queryClient = useQueryClient()
  const submittingRef = useRef(false)
  const deletingRef = useRef(false)
  const priorityRef = useRef<HTMLInputElement>(null)
  const dueDateRef = useRef<HTMLInputElement>(null)
  const visibilityRef = useRef<HTMLButtonElement>(null)
  const assigneeRef = useRef<HTMLButtonElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)

  const initialAttachmentNames = useMemo(
    () => initialTask?.attachments ?? [],
    [initialTask?.attachments],
  )
  const [priority, setPriority] = useState<TaskPriority | null>(
    initialTask?.priority ?? null,
  )
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? '')
  const [visibility, setVisibility] = useState<string | null>(
    initialTask?.visibility ?? null,
  )
  const [assigneeId, setAssigneeId] = useState<string | null>(
    initialTask?.assigneeId ?? null,
  )
  const [title, setTitle] = useState(initialTask?.title ?? '')
  const [content, setContent] = useState(initialTask?.content ?? '')
  const [hasAttachments, setHasAttachments] = useState(false)
  const [attachmentNames, setAttachmentNames] = useState(initialAttachmentNames)
  const [validationError, setValidationError] = useState<FieldName | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const isEditing = Boolean(initialTask)

  const visibilityOptions = useMemo(
    () => taskVisibilityOptions.map((option) => ({ value: option, label: option })),
    [],
  )
  const assigneeOptions = useMemo(
    () =>
      taskAssignees.map((assignee) => ({
        value: assignee.id,
        label: assignee.label,
      })),
    [],
  )

  const mutation = useMutation({
    mutationFn: (input: UpdateTaskInput) =>
      initialTask
        ? updateMockTask({ id: initialTask.id, input })
        : createMockTask(input),
  })
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!initialTask) throw new Error('Task not found')
      return deleteMockTask(initialTask.id)
    },
  })

  useEffect(() => {
    const isDirty = Boolean(
      priority !== (initialTask?.priority ?? null) ||
        dueDate !== (initialTask?.dueDate ?? '') ||
        visibility !== (initialTask?.visibility ?? null) ||
        assigneeId !== (initialTask?.assigneeId ?? null) ||
        title !== (initialTask?.title ?? '') ||
        content !== (initialTask?.content ?? '') ||
        (isEditing
          ? !sameStringArray(attachmentNames, initialAttachmentNames)
          : hasAttachments),
    )

    onDirtyChange(isDirty)
  }, [
    assigneeId,
    attachmentNames,
    content,
    dueDate,
    hasAttachments,
    initialAttachmentNames,
    initialTask,
    isEditing,
    onDirtyChange,
    priority,
    title,
    visibility,
  ])

  const handleValidationConfirm = useCallback(() => {
    const error = validationError
    setValidationError(null)

    requestAnimationFrame(() => {
      if (error === 'priority') priorityRef.current?.focus()
      else if (error === 'dueDate') dueDateRef.current?.focus()
      else if (error === 'visibility') visibilityRef.current?.focus()
      else if (error === 'assigneeId') assigneeRef.current?.focus()
      else if (error === 'title') titleRef.current?.focus()
      else contentRef.current?.focus()
    })
  }, [validationError])

  function handleAttachmentResult({ added, rejected }: AttachmentAddResult) {
    if (rejected > 0) {
      setToast({ variant: 'error', message: '첨부파일 등록에 실패했습니다' })
      return
    }
    if (added > 0) {
      setToast({ variant: 'success', message: '첨부파일 등록에 성공했습니다' })
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current || mutation.isPending) return

    const values = {
      priority,
      dueDate,
      visibility,
      assigneeId,
      title: title.trim(),
      content: content.trim(),
    }
    const nextError = validationOrder.find((field) => !values[field])

    if (nextError) {
      setValidationError(nextError)
      return
    }

    setValidationError(null)
    submittingRef.current = true
    mutation.mutate(
      {
        priority: values.priority as TaskPriority,
        dueDate: values.dueDate,
        visibility: values.visibility as string,
        assigneeId: values.assigneeId as string,
        title: values.title,
        content: values.content,
        attachments: attachmentNames,
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ['tasks'] })
          if (initialTask) {
            queryClient.removeQueries({ queryKey: ['tasks', initialTask.id] })
          }
          onCompleted('saved')
        },
        onError: () => {
          submittingRef.current = false
        },
      },
    )
  }

  function handleDelete() {
    if (deletingRef.current || deleteMutation.isPending) return

    deletingRef.current = true
    deleteMutation.mutate(undefined, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['tasks'] })
        if (initialTask) {
          queryClient.removeQueries({ queryKey: ['tasks', initialTask.id] })
        }
        onCompleted('deleted')
      },
      onError: () => {
        deletingRef.current = false
        setDeleteDialogOpen(false)
        setToast({ variant: 'error', message: '데이터 삭제에 실패했습니다' })
        requestAnimationFrame(() => deleteButtonRef.current?.focus())
      },
    })
  }

  const pending = mutation.isPending || deleteMutation.isPending

  return (
    <Form data-editing={isEditing} onSubmit={handleSubmit} noValidate>
      <TaskPriorityField ref={priorityRef} value={priority} onChange={setPriority} />

      <FieldRow>
        <DateField
          ref={dueDateRef}
          id="task-due-date"
          label="완료기한"
          value={dueDate}
          onChange={setDueDate}
          onTabForward={() => visibilityRef.current?.focus()}
        />
        <TaskSelectField
          ref={visibilityRef}
          label="공개범위를 선택해주세요"
          placeholder="전체 직원"
          options={visibilityOptions}
          value={visibility}
          onChange={setVisibility}
        />
        <TaskSelectField
          ref={assigneeRef}
          label="담당자를 선택해주세요"
          placeholder="직원 목록에서 선택"
          options={assigneeOptions}
          value={assigneeId}
          onChange={setAssigneeId}
        />
      </FieldRow>

      <TitleCard>
        <Label htmlFor="task-title">
          제목 <Required aria-hidden="true">*</Required>
        </Label>
        <TitleInput
          ref={titleRef}
          id="task-title"
          required
          value={title}
          placeholder="제목을 입력해주세요"
          onChange={(event) => setTitle(event.target.value)}
        />
      </TitleCard>

      <ContentCard>
        <Label htmlFor="task-content">
          상세 업무 내용 <Required aria-hidden="true">*</Required>
        </Label>
        <ContentInput
          ref={contentRef}
          id="task-content"
          required
          value={content}
          placeholder="상세 업무 내용을 입력해주세요"
          onChange={(event) => setContent(event.target.value)}
        />
      </ContentCard>

      <AttachmentField
        initialFileNames={initialAttachmentNames}
        onFilesChange={setHasAttachments}
        onFileNamesChange={setAttachmentNames}
        onAddResult={handleAttachmentResult}
      />

      {mutation.isError && (
        <SubmitStatus role="status">
          {isEditing
            ? '저장하지 못했습니다. 다시 시도해 주세요.'
            : '생성하지 못했습니다. 다시 시도해 주세요.'}
        </SubmitStatus>
      )}

      <Actions>
        {isEditing && (
          <DeleteButton
            ref={deleteButtonRef}
            type="button"
            disabled={pending}
            onClick={() => setDeleteDialogOpen(true)}
          >
            삭제하기
          </DeleteButton>
        )}
        <SubmitButton type="submit" disabled={pending}>
          {mutation.isPending
            ? isEditing
              ? '저장 중'
              : '생성 중'
            : isEditing
              ? '저장하기'
              : '생성하기'}
        </SubmitButton>
      </Actions>

      {validationError && (
        <ValidationDialog
          message={validationMessages[validationError]}
          onConfirm={handleValidationConfirm}
        />
      )}

      {deleteDialogOpen && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={() => {
            setDeleteDialogOpen(false)
            requestAnimationFrame(() => deleteButtonRef.current?.focus())
          }}
          onConfirm={handleDelete}
        />
      )}

      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}
    </Form>
  )
}

function sameStringArray(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
}

const Form = styled.form`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 32px;
`

const FieldRow = styled.div`
  display: flex;
  gap: 21px;

  @media (max-width: 980px) {
    flex-direction: column;
  }
`

const TitleCard = styled.div`
  display: flex;
  min-height: 164px;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const ContentCard = styled.div`
  display: flex;
  min-height: 240px;
  flex-direction: column;
  gap: 10px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`

const TitleInput = styled.input`
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  font-size: 40px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
  }
`

const ContentInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  font-size: 18px;
  font-weight: 500;
  resize: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
  }
`

const SubmitStatus = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 20px;
  font-weight: 500;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  flex-wrap: wrap;
`

const actionButton = `
  min-height: 61px;
  padding: 16px 20px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 24px;
  font-weight: 600;
  cursor: pointer;
`

const DeleteButton = styled.button`
  ${actionButton}
  border: 2px solid ${({ theme }) => theme.colors.danger};
  background: transparent;
  color: ${({ theme }) => theme.colors.danger};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`

const SubmitButton = styled.button`
  ${actionButton}
  border: 0;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`
