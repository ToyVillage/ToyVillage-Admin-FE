import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { uploadFile } from '@/entities/file'
import {
  createTask,
  updateTask,
  type Task,
  type TaskPriority,
} from '@/entities/task'
import { getTeamTree } from '@/entities/team'
import {
  AttachmentField,
  DateField,
  Toast,
  ValidationDialog,
  type AttachmentAddResult,
  type AttachmentItem,
  type ToastVariant,
} from '@/shared/ui'
import { TaskAssigneeTree } from './TaskAssigneeTree'
import { TaskPriorityField } from './TaskPriorityField'

type FieldName = 'priority' | 'dueDate' | 'assignees' | 'title' | 'content'

// 검증 순서는 화면의 시각적 순서를 따른다(spec 결정 사항).
const validationOrder: FieldName[] = [
  'priority',
  'dueDate',
  'title',
  'content',
  'assignees',
]

const validationMessages: Record<FieldName, string> = {
  priority: '우선순위를 선택해주세요',
  dueDate: '완료기한을 선택해주세요',
  assignees: '담당자를 선택해주세요',
  title: '제목을 입력해주세요',
  content: '상세 업무 내용을 입력해주세요',
}

interface ToastState {
  variant: ToastVariant
  message: string
}

// 폼이 모아 제출하는 값. 첨부는 제출 시점에 업로드되어 fileKey 로 바뀐다.
interface TaskSubmitValues {
  priority: TaskPriority
  dueDate: string
  assigneeIds: number[]
  title: string
  content: string
  attachments: AttachmentItem[]
}

const assigneeLoadErrorMessage =
  '담당자 목록을 불러오지 못했습니다. 다시 시도해 주세요.'

interface TaskFormProps {
  mode: 'create' | 'edit'
  initialTask?: Task
  onCompleted: () => void
  onDirtyChange: (isDirty: boolean) => void
}

// Figma `task / 업무 폼`(yot 145:12270). 생성·수정 공용이며 차이는 제출 버튼 라벨뿐이다.
// 삭제는 이 폼에 없다(상세 화면 케밥 소관 — task-edit spec 결정 사항).
export function TaskForm({
  mode,
  initialTask,
  onCompleted,
  onDirtyChange,
}: TaskFormProps) {
  const queryClient = useQueryClient()
  const submittingRef = useRef(false)
  const priorityRef = useRef<HTMLInputElement>(null)
  const dueDateRef = useRef<HTMLInputElement>(null)
  const assigneeRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const initialAttachmentNames = useMemo(
    () => initialTask?.attachments ?? [],
    [initialTask?.attachments],
  )
  const initialAttachmentFiles = useMemo(
    () => initialTask?.attachmentFiles ?? [],
    [initialTask?.attachmentFiles],
  )
  // 담당자 체크 복원은 상세 조회(`TASK_QUERY`)의 assignees[].id 로 한다.
  const initialAssigneeIds = useMemo(
    () => initialTask?.assignees.map(({ id }) => id) ?? [],
    [initialTask?.assignees],
  )
  const [priority, setPriority] = useState<TaskPriority | null>(
    initialTask?.priority ?? null,
  )
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? '')
  const [assigneeIds, setAssigneeIds] = useState(initialAssigneeIds)
  const [title, setTitle] = useState(initialTask?.title ?? '')
  const [content, setContent] = useState(initialTask?.content ?? '')
  const [hasAttachments, setHasAttachments] = useState(false)
  const [attachmentNames, setAttachmentNames] = useState(initialAttachmentNames)
  const [attachmentItems, setAttachmentItems] = useState<AttachmentItem[]>(() =>
    initialAttachmentFiles.map(({ fileName, fileKey }) => ({
      name: fileName,
      fileKey,
    })),
  )
  const [validationError, setValidationError] = useState<FieldName | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const isEditing = mode === 'edit'

  // 담당자 트리의 유일한 데이터 출처. 업무지시 캐시(`['tasks']`)와 분리한다.
  const {
    data: teamTree,
    isError: isTeamTreeError,
  } = useQuery({ queryKey: ['teams', 'tree'], queryFn: getTeamTree })

  const mutation = useMutation({
    mutationFn: async (values: TaskSubmitValues) => {
      // 기존 첨부는 fileKey 를 그대로 재전송하고, 새로 고른 파일만 업로드한다.
      const files: string[] = []
      for (const attachment of values.attachments) {
        if (attachment.fileKey) {
          files.push(attachment.fileKey)
          continue
        }
        if (!attachment.file) continue

        const { fileKey } = await uploadFile({ files: attachment.file })
        files.push(fileKey)
      }

      const input = {
        title: values.title,
        content: values.content,
        assigneeIds: values.assigneeIds,
        finishDate: values.dueDate,
        priority: values.priority,
        files,
      }

      if (initialTask) {
        await updateTask({ id: Number(initialTask.id), input })
        return
      }

      await createTask(input)
    },
  })

  useEffect(() => {
    const isDirty = Boolean(
      priority !== (initialTask?.priority ?? null) ||
        dueDate !== (initialTask?.dueDate ?? '') ||
        !sameArray(assigneeIds, initialAssigneeIds) ||
        title !== (initialTask?.title ?? '') ||
        content !== (initialTask?.content ?? '') ||
        (isEditing
          ? !sameArray(attachmentNames, initialAttachmentNames)
          : hasAttachments),
    )

    onDirtyChange(isDirty)
  }, [
    assigneeIds,
    attachmentNames,
    content,
    dueDate,
    hasAttachments,
    initialAssigneeIds,
    initialAttachmentNames,
    initialTask,
    isEditing,
    onDirtyChange,
    priority,
    title,
  ])

  // Figma `body text section` 은 한 줄 높이(1320×137)다. 입력이 길어지면 카드가 함께
  // 늘어나도록 textarea 높이를 내용에 맞춘다.
  useEffect(() => {
    const element = contentRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }, [content])

  const handleValidationConfirm = useCallback(() => {
    const error = validationError
    setValidationError(null)

    requestAnimationFrame(() => {
      if (error === 'priority') priorityRef.current?.focus()
      else if (error === 'dueDate') dueDateRef.current?.focus()
      else if (error === 'assignees') assigneeRef.current?.focus()
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
      assignees: assigneeIds.length > 0,
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
        assigneeIds,
        title: values.title,
        content: values.content,
        attachments: attachmentItems,
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ['tasks'] })
          if (initialTask) {
            queryClient.removeQueries({ queryKey: ['tasks', initialTask.id] })
          }
          onCompleted()
        },
        onError: () => {
          submittingRef.current = false
        },
      },
    )
  }

  return (
    <Form data-editing={isEditing} onSubmit={handleSubmit} noValidate>
      <FieldRow>
        <TaskPriorityField
          ref={priorityRef}
          value={priority}
          onChange={setPriority}
        />
        <DateField
          ref={dueDateRef}
          id="task-due-date"
          label="완료기한"
          size="md"
          value={dueDate}
          onChange={setDueDate}
          onTabForward={() => titleRef.current?.focus()}
        />
      </FieldRow>

      {/* Figma `title section` / `body text section` / `add file` — 각각 별도 카드다. */}
      <SectionCard>
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
      </SectionCard>

      <SectionCard>
        <Label htmlFor="task-content">
          상세 업무 내용 <Required aria-hidden="true">*</Required>
        </Label>
        <ContentInput
          ref={contentRef}
          id="task-content"
          required
          rows={1}
          value={content}
          placeholder="상세 업무 내용을 입력해주세요"
          onChange={(event) => setContent(event.target.value)}
        />
      </SectionCard>

      <TaskAssigneeTree
        ref={assigneeRef}
        groups={teamTree?.groups ?? []}
        selectedIds={assigneeIds}
        onChange={setAssigneeIds}
        errorMessage={isTeamTreeError ? assigneeLoadErrorMessage : undefined}
      />

      <AttachmentField
        variant="task"
        initialFiles={initialAttachmentFiles}
        onFilesChange={setHasAttachments}
        onFileNamesChange={setAttachmentNames}
        onFileItemsChange={setAttachmentItems}
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
        <SubmitButton
          type="submit"
          disabled={mutation.isPending || isTeamTreeError}
        >
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

function sameArray<T>(left: T[], right: T[]) {
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

// 우선순위 카드 868 + 완료기한 카드 420, 사이 간격 32px(Figma `priority / due row`).
const FieldRow = styled.div`
  display: flex;
  gap: 32px;

  @media (max-width: 980px) {
    flex-direction: column;
  }
`

// Figma `title section`(1320×164) · `body text section`(1320×137) — 같은 규격의 카드다.
const SectionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const Label = styled.label`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;
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
  font-size: 32px;
  font-weight: 600;
  line-height: 1.4;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
  }
`

const ContentInput = styled.textarea`
  width: 100%;
  min-height: 28px;
  overflow: hidden;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
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
`

// Figma 제출 버튼 123×61, 본문 우측 끝 정렬.
const SubmitButton = styled.button`
  min-height: 61px;
  padding: 16px 20px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font-family: inherit;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`
