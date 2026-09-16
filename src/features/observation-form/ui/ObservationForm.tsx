import { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadFile } from '@/entities/file'
import {
  formatObservationDate,
  observationQueryKeys,
  updateObservation,
  type Observation,
  type UpdateObservationInput,
} from '@/entities/observation'
import {
  AttachmentField,
  FormFieldCard,
  scrollToFirstFieldError,
  type AttachmentItem,
} from '@/shared/ui'
import type {
  ObservationFormErrors,
  ObservationFormValues,
} from '../model/types'
import { validateObservationForm } from '../model/validation'

const titleErrorId = 'observation-title-error'
const contentErrorId = 'observation-content-error'

interface ObservationFormProps {
  observation: Observation
  /** 저장 성공 — 페이지가 이탈 보호를 해제하고 관찰 상세로 이동한다. */
  onCompleted: () => void
  onDirtyChange: (isDirty: boolean) => void
}

// Figma `observation edit` 폼(1282:15011). 수정 전용이다(관찰 등록은 앱 소관, 삭제는 상세 케밥 소관).
// 필수(제목·관찰사항) 오류는 카드 아래 인라인 줄로 보이고, 날짜·관찰자는 읽기 전용이다.
export function ObservationForm({
  observation,
  onCompleted,
  onDirtyChange,
}: ObservationFormProps) {
  const queryClient = useQueryClient()
  const submittingRef = useRef(false)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const [title, setTitle] = useState(observation.title)
  const [content, setContent] = useState(observation.content)
  const [attachments, setAttachments] = useState<AttachmentItem[]>(() =>
    observation.attachments.map(({ fileName, fileKey }) => ({
      name: fileName,
      fileKey,
    })),
  )
  const [errors, setErrors] = useState<ObservationFormErrors>({})

  const mutation = useMutation({
    mutationFn: async (values: ObservationFormValues) => {
      const input = toUpdateObservationInput(values)
      // 남긴 첨부는 키 그대로, 새 첨부는 업로드해 받은 키로 화면 순서대로 보낸다.
      const fileKeys: string[] = []
      for (const attachment of input.attachments) {
        if (attachment.fileKey) {
          fileKeys.push(attachment.fileKey)
        } else if (attachment.file) {
          const { fileKey } = await uploadFile({ files: attachment.file })
          fileKeys.push(fileKey)
        }
      }

      return updateObservation({
        animalManageId: Number(observation.individualId),
        animalObservationId: Number(observation.id),
        request: { title: input.title, content: input.content, fileKeys },
      })
    },
  })

  // 원래 값으로 되돌리면 바뀌지 않은 것으로 본다.
  useEffect(() => {
    onDirtyChange(
      title !== observation.title ||
        content !== observation.content ||
        !sameAttachments(
          attachments,
          observation.attachments.map(({ fileName, fileKey }) => ({
            name: fileName,
            fileKey,
          })),
        ),
    )
  }, [attachments, content, observation, onDirtyChange, title])

  // Figma 관찰사항 입력 160px 를 최소 높이로 두고, 내용이 늘면 박스가 함께 늘어난다(task-create 선례).
  useEffect(() => {
    const element = contentRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }, [content])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current || mutation.isPending) return

    const values: ObservationFormValues = { title, content, attachments }
    const nextErrors = validateObservationForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstFieldError()
      return
    }

    submittingRef.current = true
    mutation.mutate(values, {
      // 관찰 상세와 개체 상세 관찰 표가 함께 갱신되도록 `observations` 접두 전체를 무효화한다.
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: observationQueryKeys.all,
        })
        onCompleted()
      },
      onError: () => {
        submittingRef.current = false
      },
    })
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Fields>
        <FormFieldCard
          label="제목"
          labelSize={32}
          htmlFor="observation-title"
          error={errors.title}
          errorId={titleErrorId}
        >
          <TextInput
            id="observation-title"
            aria-required="true"
            aria-describedby={errors.title ? titleErrorId : undefined}
            value={title}
            autoComplete="off"
            onChange={(event) => setTitle(event.target.value)}
          />
        </FormFieldCard>

        <FormFieldCard label="날짜" labelSize={32} htmlFor="observation-date">
          <ReadOnlyInput
            id="observation-date"
            readOnly
            value={formatObservationDate(observation.observedAt)}
          />
        </FormFieldCard>

        <FormFieldCard
          label="관찰자"
          labelSize={32}
          htmlFor="observation-observer"
        >
          <ReadOnlyInput
            id="observation-observer"
            readOnly
            value={observation.observerName}
          />
        </FormFieldCard>

        <FormFieldCard
          label="관찰사항"
          labelSize={32}
          htmlFor="observation-content"
          error={errors.content}
          errorId={contentErrorId}
        >
          <ContentInput
            ref={contentRef}
            id="observation-content"
            aria-required="true"
            aria-describedby={errors.content ? contentErrorId : undefined}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </FormFieldCard>

        <AttachmentField
          variant="observation"
          initialFiles={observation.attachments}
          onFileItemsChange={setAttachments}
        />
      </Fields>

      <Footer>
        {mutation.isError && (
          <SubmitStatus role="status">
            저장하지 못했습니다. 다시 시도해 주세요.
          </SubmitStatus>
        )}
        <Actions>
          <SubmitButton type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? '저장 중' : '저장하기'}
          </SubmitButton>
        </Actions>
      </Footer>
    </Form>
  )
}

// 날짜·관찰자는 읽기 전용이라 보내지 않는다. 유지한 기존 첨부는 fileKey 를 그대로 보낸다.
function toUpdateObservationInput(
  values: ObservationFormValues,
): UpdateObservationInput {
  return {
    title: values.title.trim(),
    content: values.content.trim(),
    attachments: values.attachments.map(({ name, fileKey, file }) => ({
      fileName: name,
      ...(fileKey ? { fileKey } : {}),
      ...(file ? { file } : {}),
    })),
  }
}

function sameAttachments(left: AttachmentItem[], right: AttachmentItem[]) {
  return (
    left.length === right.length &&
    left.every(
      (item, index) =>
        item.name === right[index].name &&
        item.fileKey === right[index].fileKey,
    )
  )
}

// Figma 폼 하단(1537.4) → `저장하기`(1577.4) 40px.
const Form = styled.form`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 40px;
`

// Figma `form`(1282:15011) 카드 간 간격 16px.
const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

// 텍스트 입력에는 포커스 링을 그리지 않는다(task-create 2026-09-08 결정).
const TextInput = styled.input`
  width: 100%;
  height: 66px;
  padding: 0 24px;
  border: 0;
  border-radius: 8px;
  outline: 0;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 24px;
  font-weight: 500;
`

// 날짜·관찰자 값은 Figma 에서 textGuide 다(편집 가능한 값은 textStrong).
const ReadOnlyInput = styled(TextInput)`
  color: ${({ theme }) => theme.colors.textGuide};
`

const ContentInput = styled.textarea`
  display: block;
  width: 100%;
  min-height: 160px;
  padding: 20px 24px;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  outline: 0;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  resize: none;
`

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
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

// Figma `저장하기`(1282:15035) 123×61, 본문 우측 끝 정렬.
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
