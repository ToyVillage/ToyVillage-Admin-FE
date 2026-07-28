import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createNotice,
  deleteMockNotice,
  type Notice,
  type UpdateNoticeInput,
  updateNotice,
} from '@/entities/notice'
import { DeleteConfirmationDialog, ValidationDialog } from '@/shared/ui'
import { NoticeAttachmentField } from './NoticeAttachmentField'
import { RemoveIconButton } from './RemoveIconButton'
import { TeamAddDialog } from './TeamAddDialog'

type FieldName = 'title' | 'content'

const validationMessages: Record<FieldName, string> = {
  title: '제목을 입력해 주세요',
  content: '내용을 입력해 주세요',
}

const defaultCategory = '전체'

interface NoticeFormProps {
  initialNotice?: Notice
  onCompleted: () => void
  onDirtyChange: (isDirty: boolean) => void
}

export function NoticeForm({
  initialNotice,
  onCompleted,
  onDirtyChange,
}: NoticeFormProps) {
  const queryClient = useQueryClient()
  const submittingRef = useRef(false)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const teamAddButtonRef = useRef<HTMLButtonElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const initialCategory = initialNotice?.category ?? defaultCategory
  const initialAttachmentNames = useMemo(
    () => initialNotice?.attachments ?? [],
    [initialNotice?.attachments],
  )
  const formInitialCategories = useMemo(
    () => [initialCategory],
    [initialCategory],
  )
  const [category, setCategory] = useState(initialCategory)
  const [categories, setCategories] = useState(formInitialCategories)
  const [teamDialogOpen, setTeamDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [title, setTitle] = useState(initialNotice?.title ?? '')
  const [content, setContent] = useState(initialNotice?.content ?? '')
  const [hasAttachments, setHasAttachments] = useState(false)
  const [attachmentNames, setAttachmentNames] = useState(initialAttachmentNames)
  const [validationError, setValidationError] = useState<FieldName | null>(null)
  const mutation = useMutation({
    mutationFn: async (input: UpdateNoticeInput) => {
      if (initialNotice) {
        await updateNotice({
          id: Number(initialNotice.id),
          input: {
            title: input.title,
            kind: 'ALL',
            content: input.content,
          },
        })
        return
      }

      await createNotice({
        title: input.title,
        kind: 'ALL',
        content: input.content,
      })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!initialNotice) throw new Error('Notice not found')
      return deleteMockNotice(initialNotice.id)
    },
  })
  const isEditing = Boolean(initialNotice)

  useEffect(() => {
    const categoriesChanged =
      categories.length !== formInitialCategories.length ||
      categories.some((item, index) => item !== formInitialCategories[index])
    const isDirty = Boolean(
      title !== (initialNotice?.title ?? '') ||
      content !== (initialNotice?.content ?? '') ||
      category !== initialCategory ||
      categoriesChanged ||
      (isEditing
        ? !sameStringArray(attachmentNames, initialAttachmentNames)
        : hasAttachments),
    )

    onDirtyChange(isDirty)
  }, [
    attachmentNames,
    category,
    categories,
    content,
    hasAttachments,
    initialAttachmentNames,
    initialCategory,
    initialNotice,
    isEditing,
    onDirtyChange,
    formInitialCategories,
    title,
  ])

  const handleConfirm = useCallback(() => {
    const error = validationError
    setValidationError(null)

    requestAnimationFrame(() => {
      if (error === 'title') {
        titleRef.current?.focus()
        return
      }

      contentRef.current?.focus()
    })
  }, [validationError])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const input: UpdateNoticeInput = {
      category,
      title: title.trim(),
      content: content.trim(),
      attachments: attachmentNames,
    }
    const nextError = validate(input)

    if (nextError) {
      setValidationError(nextError)
      return
    }

    setValidationError(null)
    submittingRef.current = true
    mutation.mutate(input, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['notices'] })
        if (initialNotice) {
          queryClient.setQueryData(['notices', initialNotice.id], undefined)
        }
        onCompleted()
      },
      onError: () => {
        submittingRef.current = false
      },
    })
  }

  function handleDelete() {
    if (deleteMutation.isPending) return

    deleteMutation.mutate(undefined, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['notices'] })
        if (initialNotice) {
          queryClient.removeQueries({ queryKey: ['notices', initialNotice.id] })
        }
        onCompleted()
      },
    })
  }

  return (
    <Form data-editing={isEditing} onSubmit={handleSubmit} noValidate>
      <TitleCard>
        <Label htmlFor="notice-title">
          제목 {!isEditing && <Required aria-hidden="true">*</Required>}
        </Label>
        <TitleInput
          ref={titleRef}
          id="notice-title"
          required
          value={title}
          placeholder="제목을 입력해주세요"
          onChange={(event) => setTitle(event.target.value)}
        />
      </TitleCard>

      <CategoryCard aria-required="true">
        <CategoryLegend>분류</CategoryLegend>
        <CategoryOptions>
          {categories.map((option) => (
            <CategoryOption key={option}>
              <CategorySelectLabel>
                <CategoryRadio
                  type="radio"
                  name="notice-category"
                  value={option}
                  required
                  checked={category === option}
                  onChange={(event) => setCategory(event.target.value)}
                />
                <CategoryPill data-has-remove={option !== '전체'}>
                  {categoryDisplayName(option)}
                </CategoryPill>
              </CategorySelectLabel>
              {option !== '전체' && (
                <CategoryRemove
                  type="button"
                  data-hover-reveal={isEditing ? undefined : 'true'}
                  aria-label={`${categoryDisplayName(option)} 삭제`}
                  onClick={() => {
                    const nextCategories = categories.filter(
                      (item) => item !== option,
                    )
                    const normalizedCategories =
                      nextCategories.length > 0
                        ? nextCategories
                        : [defaultCategory]

                    setCategories(normalizedCategories)
                    if (category === option) {
                      setCategory(normalizedCategories[0])
                    }
                  }}
                />
              )}
            </CategoryOption>
          ))}
          <TeamAddButton
            ref={teamAddButtonRef}
            type="button"
            onClick={() => setTeamDialogOpen(true)}
          >
            + 팀 추가
          </TeamAddButton>
        </CategoryOptions>
      </CategoryCard>

      <ContentCard>
        <VisuallyHiddenLabel htmlFor="notice-content">
          내용 <Required aria-hidden="true">*</Required>
        </VisuallyHiddenLabel>
        <ContentInput
          ref={contentRef}
          id="notice-content"
          required
          value={content}
          placeholder="여기에 내용을 입력하세요"
          onChange={(event) => {
            setContent(event.target.value)
            resizeTextarea(event.currentTarget)
          }}
        />
      </ContentCard>

      <NoticeAttachmentField
        initialFileNames={initialAttachmentNames}
        onFilesChange={setHasAttachments}
        onFileNamesChange={setAttachmentNames}
      />

      {mutation.isError && (
        <SubmitStatus role="status">
          {isEditing
            ? '저장하지 못했습니다. 다시 시도해 주세요.'
            : '생성하지 못했습니다. 다시 시도해 주세요.'}
        </SubmitStatus>
      )}

      {deleteMutation.isError && (
        <SubmitStatus role="status">
          삭제하지 못했습니다. 다시 시도해 주세요.
        </SubmitStatus>
      )}

      <Actions>
        {isEditing && (
          <DeleteButton
            ref={deleteButtonRef}
            type="button"
            disabled={mutation.isPending || deleteMutation.isPending}
            onClick={() => setDeleteDialogOpen(true)}
          >
            삭제하기
          </DeleteButton>
        )}
        <SubmitButton
          type="submit"
          disabled={mutation.isPending || deleteMutation.isPending}
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
          onConfirm={handleConfirm}
        />
      )}

      {teamDialogOpen && (
        <TeamAddDialog
          onCancel={() => {
            setTeamDialogOpen(false)
            requestAnimationFrame(() => teamAddButtonRef.current?.focus())
          }}
          onAdd={(teamName) => {
            setCategories((current) => {
              const teamCategories = current.filter(
                (item) => item !== defaultCategory,
              )
              return teamCategories.includes(teamName)
                ? teamCategories
                : [...teamCategories, teamName]
            })
            setCategory(teamName)
            setTeamDialogOpen(false)
            requestAnimationFrame(() => teamAddButtonRef.current?.focus())
          }}
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
    </Form>
  )
}

function validate(input: UpdateNoticeInput): FieldName | null {
  if (!input.title) return 'title'
  if (!input.content) return 'content'
  return null
}

function sameStringArray(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
}

function categoryDisplayName(category: string) {
  return category.replace(/^팀이름\s*/, '팀 이름')
}

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

const Form = styled.form`
  width: 100%;
  margin-top: 60px;

  &[data-editing='true'] {
    margin-top: 0;
  }

  @media (max-width: 980px) {
    margin-top: 40px;
  }
`

const FieldCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 32px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const TitleCard = styled(FieldCard)`
  min-height: 164px;
  margin-top: 0;
`

const Label = styled.label`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`

const TitleInput = styled.input`
  width: 100%;
  min-height: 44px;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 36px;
  font-weight: 500;
  line-height: 1.2;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
    opacity: 1;
  }

  @media (max-width: 980px) {
    font-size: 28px;
  }
`

const CategoryCard = styled.fieldset`
  min-height: 170px;
  margin: 32px 0 0;
  padding: 40px;
  border: 0;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const CategoryLegend = styled.legend`
  float: left;
  width: 100%;
  padding: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const CategoryOptions = styled.div`
  display: flex;
  clear: both;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
`

const CategoryOption = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.background};

  &:hover > [data-hover-reveal='true'],
  &:focus-within > [data-hover-reveal='true'] {
    position: static;
    width: 20px;
    height: 20px;
    overflow: visible;
    clip: auto;
    clip-path: none;
    pointer-events: auto;
    opacity: 1;
  }

  &:hover span[data-has-remove='true'],
  &:focus-within span[data-has-remove='true'] {
    padding-right: 8px;
  }

  @media (hover: none) {
    span[data-has-remove='true'] {
      padding-right: 8px;
    }
  }
`

const CategorySelectLabel = styled.label`
  position: relative;
  display: inline-flex;
`

const CategoryRadio = styled.input`
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;

  &:focus-visible + span {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 3px;
  }
`

const CategoryPill = styled.span`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const CategoryRemove = styled(RemoveIconButton)`
  z-index: 2;
  margin-right: 18px;
`

const TeamAddButton = styled.button`
  min-height: 44px;
  padding: 8px 18px;
  border: 1px solid ${({ theme }) => theme.colors.textGuide};
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textGuide};
  cursor: pointer;
  font: inherit;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 3px;
  }
`

const ContentCard = styled(FieldCard)`
  min-height: 240px;
`

const VisuallyHiddenLabel = styled.label`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
`

const ContentInput = styled.textarea`
  width: 100%;
  min-height: 160px;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 22px;
  line-height: 1.5;
  overflow: hidden;
  resize: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
    opacity: 1;
  }
`

const SubmitStatus = styled.p`
  margin: 16px 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 18px;
  text-align: right;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  margin-top: 32px;
`

const DeleteButton = styled.button`
  min-width: 123px;
  height: 61px;
  padding: 0 16px;
  border: 2px solid ${({ theme }) => theme.colors.danger};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.danger};
  cursor: pointer;
  font: inherit;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.danger};
    outline-offset: 3px;
  }
`

const SubmitButton = styled.button`
  min-width: 123px;
  height: 61px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font: inherit;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 3px;
  }
`
