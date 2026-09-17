import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadFile } from '@/entities/file'
import {
  createNotice,
  type Notice,
  type UpdateNoticeInput,
  updateNotice,
} from '@/entities/notice'
import {
  AttachmentField,
  RemoveIconButton,
  ValidationDialog,
} from '@/shared/ui'
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
  const teamAddButtonRef = useRef<HTMLButtonElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const initialCategory = initialNotice?.category ?? defaultCategory
  const initialAttachmentNames = useMemo(
    () => initialNotice?.attachments ?? [],
    [initialNotice?.attachments],
  )
  // 저장소 키까지 온 첨부만 파일 서버에서 원본을 받는다. mock 첨부는 이름뿐이다.
  const initialAttachmentFiles = initialNotice?.attachmentFiles
  const formInitialCategories = useMemo(
    () => [initialCategory],
    [initialCategory],
  )
  const [category, setCategory] = useState(initialCategory)
  const [categories, setCategories] = useState(formInitialCategories)
  const [teamDialogOpen, setTeamDialogOpen] = useState(false)
  const [title, setTitle] = useState(initialNotice?.title ?? '')
  const [content, setContent] = useState(initialNotice?.content ?? '')
  const [hasAttachments, setHasAttachments] = useState(false)
  const [attachmentNames, setAttachmentNames] = useState(initialAttachmentNames)
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
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

      const files: string[] = []
      for (const attachmentFile of attachmentFiles) {
        const uploadedFile = await uploadFile({ files: attachmentFile })
        files.push(uploadedFile.fileKey)
      }

      await createNotice({
        title: input.title,
        kind: 'ALL',
        content: input.content,
        files,
      })
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

  return (
    <Form data-editing={isEditing} onSubmit={handleSubmit} noValidate>
      <TitleCard>
        <TitleLabel htmlFor="notice-title">
          제목 {!isEditing && <Required aria-hidden="true">*</Required>}
        </TitleLabel>
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
                <CategoryPill>{categoryDisplayName(option)}</CategoryPill>
              </CategorySelectLabel>
              {option !== '전체' && (
                <CategoryRemove
                  type="button"
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
            <PlusIcon viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </PlusIcon>
            팀 추가
          </TeamAddButton>
        </CategoryOptions>
      </CategoryCard>

      <ContentCard>
        <Label htmlFor="notice-content">
          상세 업무 내용 <Required aria-hidden="true">*</Required>
        </Label>
        <ContentInput
          ref={contentRef}
          id="notice-content"
          required
          value={content}
          placeholder="상세 업무 내용을 입력해주세요"
          onChange={(event) => {
            setContent(event.target.value)
            resizeTextarea(event.currentTarget)
          }}
        />
      </ContentCard>

      <AttachmentField
        variant={isEditing ? 'notice' : 'notice-create'}
        initialFileNames={initialAttachmentNames}
        initialFiles={initialAttachmentFiles}
        storedFiles={Boolean(initialAttachmentFiles)}
        onFilesChange={setHasAttachments}
        onFileNamesChange={setAttachmentNames}
        onFileObjectsChange={setAttachmentFiles}
      />

      {mutation.isError && (
        <SubmitStatus role="status">
          {isEditing
            ? '저장하지 못했습니다. 다시 시도해 주세요.'
            : '생성하지 못했습니다. 다시 시도해 주세요.'}
        </SubmitStatus>
      )}

      <Actions>
        <SubmitButton type="submit" disabled={mutation.isPending}>
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

// yot `make notification`(1:6919)·`remake notification`(1:6711) 공통 배치.
const Form = styled.form`
  width: 100%;
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

// 수정 화면은 yot `1:6711` 을 따른다: 카드 padding 40·gap 10, 입력은 gray/10 배경 박스.
const TitleCard = styled(FieldCard)`
  min-height: 164px;
  margin-top: 0;

  form & {
    min-height: 0;
    gap: 10px;
  }
`

const Label = styled.label`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;

  form & {
    font-size: 22px;
  }
`

const TitleLabel = styled(Label)`
  [data-editing='true'] & {
    color: ${({ theme }) => theme.colors.text};
    font-size: 20px;
  }
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

  form & {
    height: 66px;
    min-height: 0;
    padding: 0 24px;
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-size: 24px;
  }
`

const CategoryCard = styled.fieldset`
  min-height: 170px;
  margin: 32px 0 0;

  form & {
    margin-top: 12px;
  }

  [data-editing='true'] & {
    margin-top: 14px;
  }

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

  form & {
    color: ${({ theme }) => theme.colors.text};
    font-size: 22px;
  }
`

const CategoryOptions = styled.div`
  display: flex;
  clear: both;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding-top: 16px;

  form & {
    gap: 12px;
    padding-top: 18px;
  }
`

const CategoryOption = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.background};
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

  form & {
    height: 46px;
    min-height: 0;
    padding: 0 20px;
    color: #434343;
    font-size: 22px;
  }
`

const CategoryRemove = styled(RemoveIconButton)`
  z-index: 2;
  margin-right: 18px;

  form & {
    width: 24px;
    height: 24px;
    margin: 0 20px 0 -12px;

    svg {
      width: 20px;
      height: 20px;
    }
  }
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

  form & {
    display: inline-flex;
    height: 46px;
    min-height: 0;
    align-items: center;
    gap: 4px;
    padding: 0 16px;
    border-radius: 42px;
    background: transparent;
    font-size: 22px;
  }
`

const PlusIcon = styled.svg`
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
`

const ContentCard = styled(FieldCard)`
  min-height: 240px;

  form & {
    min-height: 0;
    gap: 10px;
  }
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

  form & {
    min-height: 160px;
    padding: 20px 24px;
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.background};
    line-height: normal;
  }

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

  form & {
    margin-top: 135px;
  }

  [data-editing='true'] & {
    margin-top: 180px;
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
