import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createDocument,
  fileTypeLabel,
  fileTypeToDocumentType,
  resourceCategories,
  tabToFileType,
  updateDocument,
  type Resource,
  type UpdateResourceInput,
} from '@/entities/resource'
import {
  ErrorDialog,
  Toast,
  ValidationDialog,
  type ToastVariant,
} from '@/shared/ui'
import { ResourceUploadField } from './ResourceUploadField'

const defaultCategory = resourceCategories[0]

type ValidationField = 'title' | 'file'

const validationMessages: Record<ValidationField, string> = {
  title: '제목을 입력해 주세요',
  file: '이미지 또는 파일을 추가해주세요',
}

/** 폼이 끝난 이유. 목록 화면이 이 값으로 토스트를 고른다. */
export type ResourceFormCompletion = 'created' | 'updated'

interface ResourceFormProps {
  initialResource?: Resource
  // 상세(수정) 화면에서 데이터 로딩 전에도 수정 레이아웃을 유지하기 위한 강제 플래그.
  editing?: boolean
  /** 저장·생성·삭제가 끝났을 때. 목록이 결과 토스트를 띄우는 데 쓴다. */
  onCompleted: (reason: ResourceFormCompletion) => void
  onDirtyChange: (isDirty: boolean) => void
}

export function ResourceForm({
  initialResource,
  editing,
  onCompleted,
  onDirtyChange,
}: ResourceFormProps) {
  const queryClient = useQueryClient()
  const submittingRef = useRef(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const uploadButtonRef = useRef<HTMLButtonElement>(null)
  const isEditing = editing ?? Boolean(initialResource)
  // 수정 레이아웃이지만 아직 데이터가 없는 로딩 상태(제출/삭제 비활성).
  const isLoadingPlaceholder = isEditing && !initialResource
  const initialCategory = initialResource
    ? fileTypeLabel[initialResource.fileType]
    : defaultCategory
  const initialAttachmentNames = useMemo(
    () => initialResource?.attachments ?? [],
    [initialResource?.attachments],
  )
  const initialFileKeys = useMemo(
    () => initialResource?.attachmentFiles?.map(({ fileKey }) => fileKey) ?? [],
    [initialResource?.attachmentFiles],
  )
  const [title, setTitle] = useState(initialResource?.title ?? '')
  const [category, setCategory] = useState<string>(initialCategory)
  const [hasFile, setHasFile] = useState(false)
  const [attachmentNames, setAttachmentNames] = useState(initialAttachmentNames)
  // 첨부 시 업로드해 둔 file key(수정 시 기존 키 포함). 요청 body 의 files 로 전달한다.
  const [fileKeys, setFileKeys] = useState<string[]>(initialFileKeys)
  const [isUploading, setIsUploading] = useState(false)
  const [validationError, setValidationError] =
    useState<ValidationField | null>(null)
  // Figma `자료실 · 토스트`(311:12766) — 이 화면에 머무르는 결과는 토스트로 알린다.
  // 같은 결과가 연달아 나와도 다시 뜨도록 매번 id 를 올린다.
  const [toast, setToast] = useState<{
    variant: ToastVariant
    message: string
    id: number
  } | null>(null)
  const toastIdRef = useRef(0)

  function showToast(variant: ToastVariant, message: string) {
    toastIdRef.current += 1
    setToast({ variant, message, id: toastIdRef.current })
  }
  const mutation = useMutation({
    mutationFn: async (input: UpdateResourceInput) => {
      // 첨부 시 이미 업로드해 둔 file key(수정은 기존 키 포함)를 그대로 보낸다.
      if (initialResource) {
        await updateDocument({
          id: Number(initialResource.id),
          body: {
            title: input.title,
            type: fileTypeToDocumentType[input.fileType],
            files: fileKeys,
          },
        })
        return
      }
      await createDocument({
        title: input.title,
        type: fileTypeToDocumentType[input.fileType],
        files: fileKeys,
      })
    },
  })

  useEffect(() => {
    const isDirty = isEditing
      ? Boolean(
          title !== (initialResource?.title ?? '') ||
            category !== initialCategory ||
            !sameStringArray(attachmentNames, initialAttachmentNames),
        )
      : Boolean(title || category !== defaultCategory || hasFile)

    onDirtyChange(isDirty)
  }, [
    attachmentNames,
    category,
    hasFile,
    initialAttachmentNames,
    initialCategory,
    initialResource,
    isEditing,
    onDirtyChange,
    title,
  ])

  const handleConfirm = useCallback(() => {
    const error = validationError
    setValidationError(null)
    requestAnimationFrame(() => {
      if (error === 'file') {
        uploadButtonRef.current?.focus()
        return
      }
      titleRef.current?.focus()
    })
  }, [validationError])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    // 업로드가 끝나기 전에는 제출하지 않는다(아직 file key 가 없음).
    if (isUploading) return

    if (!title.trim()) {
      setValidationError('title')
      return
    }

    const fileType = tabToFileType[category]
    if (!fileType) return

    // 파일 필수 검증(생성·수정 공통). 첨부가 없으면 `이미지 또는 파일을 추가해주세요`.
    if (attachmentNames.length === 0) {
      setValidationError('file')
      return
    }

    const input: UpdateResourceInput = {
      title: title.trim(),
      fileType,
      attachments: attachmentNames,
    }
    setValidationError(null)
    submittingRef.current = true
    mutation.mutate(input, {
      onSuccess: async () => {
        // 목록만 무효화한다. 상세 쿼리(['resources', id])까지 무효화하면 아직 떠 있는
        // 상세 페이지가 재조회를 일으킨다.
        await queryClient.invalidateQueries({ queryKey: ['resources', 'list'] })
        onCompleted(isEditing ? 'updated' : 'created')
      },
      onError: () => {
        submittingRef.current = false
        // 수정 실패는 Figma 에 토스트가 없어 기존 예외 모달을 그대로 쓴다.
        if (!isEditing) showToast('error', '데이터 생성에 실패했습니다')
      },
    })
  }

  return (
    <Form data-editing={isEditing} onSubmit={handleSubmit} noValidate>
      <TitleCard>
        <Label htmlFor="resource-title">
          제목 <Required aria-hidden="true">*</Required>
        </Label>
        <TitleInput
          ref={titleRef}
          id="resource-title"
          required
          value={title}
          placeholder="제목을 입력해주세요"
          onChange={(event) => setTitle(event.target.value)}
        />
      </TitleCard>

      <CategoryCard>
        <CategoryLegend>분류</CategoryLegend>
        <CategoryOptions>
          {resourceCategories.map((option) => (
            <CategorySelectLabel key={option}>
              <CategoryRadio
                type="radio"
                name="resource-category"
                value={option}
                checked={category === option}
                onChange={(event) => setCategory(event.target.value)}
              />
              <CategoryPill>{option}</CategoryPill>
            </CategorySelectLabel>
          ))}
        </CategoryOptions>
      </CategoryCard>

      <ResourceUploadField
        initialFileNames={initialAttachmentNames}
        initialFiles={initialResource?.attachmentFiles}
        uploadButtonRef={uploadButtonRef}
        uploadOnAttach
        onFilesChange={setHasFile}
        onFileNamesChange={setAttachmentNames}
        onFileKeysChange={setFileKeys}
        onUploadingChange={setIsUploading}
        onUploadResult={(result) =>
          showToast(
            result === 'success' ? 'success' : 'error',
            result === 'success'
              ? '첨부파일 등록에 성공했습니다'
              : '첨부파일 등록에 실패했습니다',
          )
        }
      />

      <Actions>
        <SubmitButton
          type="submit"
          disabled={mutation.isPending || isUploading || isLoadingPlaceholder}
        >
          {isUploading
            ? '업로드 중'
            : mutation.isPending
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

      {/* 수정(저장) 실패만 예외 모달로 남긴다 — Figma 에 저장 실패 토스트가 없다. */}
      {toast && (
        <Toast
          key={toast.id}
          variant={toast.variant}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}
      {isEditing && mutation.isError && (
        <ErrorDialog
          title="저장에 실패하였습니다"
          onConfirm={() => mutation.reset()}
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
  padding-top: 20px;
`

const CategorySelectLabel = styled.label`
  display: inline-flex;
`

const CategoryRadio = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;

  &:checked + span {
    background: ${({ theme }) => theme.colors.textStrong};
    color: ${({ theme }) => theme.colors.surface};
  }

  &:focus-visible + span {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 3px;
  }
`

const CategoryPill = styled.span`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 42px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
  cursor: pointer;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  margin-top: 32px;
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
