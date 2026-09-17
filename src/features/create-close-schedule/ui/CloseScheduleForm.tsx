import { useCallback, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  createCloseSchedule,
  updateCloseSchedule,
  type CloseSchedule,
  type CreateCloseScheduleInput,
} from '@/entities/close-schedule'
import { DateField, ErrorDialog, ValidationDialog } from '@/shared/ui'

type ValidationError = 'date' | 'title' | 'range'

const validationMessages: Record<ValidationError, string> = {
  date: '휴관일을 입력해 주세요',
  title: '제목을 입력해 주세요',
  range: '종료일은 시작일과 같거나 이후여야 합니다',
}

interface CloseScheduleFormProps {
  initialSchedule?: CloseSchedule
}

export function CloseScheduleForm({ initialSchedule }: CloseScheduleFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const submittingRef = useRef(false)
  const startDateRef = useRef<HTMLInputElement>(null)
  const endDateRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const [startDate, setStartDate] = useState(
    () => initialSchedule?.startDate ?? '',
  )
  const [endDate, setEndDate] = useState(() => initialSchedule?.endDate ?? '')
  const [title, setTitle] = useState(() => initialSchedule?.title ?? '')
  const [validationError, setValidationError] =
    useState<ValidationError | null>(null)
  const mutation = useMutation({
    mutationFn: async (input: CreateCloseScheduleInput) => {
      if (initialSchedule) {
        await updateCloseSchedule({
          id: Number(initialSchedule.id),
          input,
        })
        return
      }

      await createCloseSchedule(input)
    },
  })
  const isEditing = Boolean(initialSchedule)

  const handleConfirm = useCallback(() => {
    const error = validationError
    setValidationError(null)

    requestAnimationFrame(() => {
      if (error === 'title') {
        titleRef.current?.focus()
        return
      }

      if (!startDate) {
        startDateRef.current?.focus()
        return
      }

      endDateRef.current?.focus()
    })
  }, [startDate, validationError])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    if (!startDate || !endDate) {
      setValidationError('date')
      return
    }

    if (endDate < startDate) {
      setValidationError('range')
      return
    }

    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      setValidationError('title')
      return
    }

    submittingRef.current = true
    mutation.mutate(
      { startDate, endDate, title: normalizedTitle },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: ['close-schedules'],
          })
          // 생성 성공은 목록이 토스트로 알린다(yot `1:6158`).
          navigate(
            '/notices/guide',
            isEditing ? undefined : { state: { toast: 'create-success' } },
          )
        },
        onError: () => {
          submittingRef.current = false
        },
      },
    )
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <DateFields>
        <DateField
          ref={startDateRef}
          id="close-schedule-start-date"
          label="시작일"
          size="sm"
          value={startDate}
          onChange={setStartDate}
          onTabForward={() => endDateRef.current?.focus()}
        />
        <DateField
          ref={endDateRef}
          id="close-schedule-end-date"
          label="종료일"
          size="sm"
          value={endDate}
          onChange={setEndDate}
          onTabForward={() => titleRef.current?.focus()}
          onTabBackward={() => startDateRef.current?.focus()}
        />
      </DateFields>

      <TitleCard>
        <TitleLabel htmlFor="close-schedule-title">
          제목 <Required aria-hidden="true">*</Required>
        </TitleLabel>
        <TitleInput
          ref={titleRef}
          id="close-schedule-title"
          required
          value={title}
          placeholder="제목을 입력해주세요"
          onChange={(event) => setTitle(event.target.value)}
        />
      </TitleCard>

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

      {mutation.isError && isEditing && (
        <Status role="status">수정하지 못했습니다. 다시 시도해 주세요.</Status>
      )}

      {/* yot `1:7020`: 생성 실패는 입력을 유지한 채 모달로 알린다. */}
      {mutation.isError && !isEditing && (
        <ErrorDialog
          title="데이터 생성에 실패했습니다"
          onConfirm={() => mutation.reset()}
        />
      )}

      {validationError && (
        <ValidationDialog
          message={validationMessages[validationError]}
          onConfirm={handleConfirm}
        />
      )}
    </Form>
  )
}

const Form = styled.form`
  width: 100%;
`

// Figma yot `holiday correction`(1:7062): 날짜 카드 426 두 개(간격 21) → 32 → 제목 카드 → 14 → 저장하기.
const DateFields = styled.div`
  display: flex;
  gap: 21px;

  @media (max-width: 980px) {
    flex-direction: column;
  }
`

const TitleCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 32px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const TitleLabel = styled.label`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`

const TitleInput = styled.input`
  box-sizing: border-box;
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
  line-height: 1.2;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
    opacity: 1;
  }
`

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 14px;
`

const SubmitButton = styled.button`
  width: 123px;
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
`

const Status = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 18px;
  text-align: right;
`
