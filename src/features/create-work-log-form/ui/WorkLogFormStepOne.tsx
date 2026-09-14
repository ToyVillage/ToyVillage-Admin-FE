import { useState } from 'react'
import styled from '@emotion/styled'
import type {
  WorkLogFormDraft,
  WorkLogFormDraftErrors,
  WorkLogFormDraftQuestion,
} from '@/entities/work-log'
import plusIcon from '@/shared/ui/assets/plus.svg'
import warningIcon from '@/shared/ui/assets/warning.svg'
import { createDraftQuestion } from '../model/draft'
import { WorkLogFormQuestionEditor } from './WorkLogFormQuestionEditor'

interface WorkLogFormStepOneProps {
  draft: WorkLogFormDraft
  errors: WorkLogFormDraftErrors
  onChange: (draft: WorkLogFormDraft) => void
}

// Figma 145:13046 "worklog / 양식 만들기 (항목 입력)" — 생성·수정이 함께 쓰는 1단계 본문.
export function WorkLogFormStepOne({
  draft,
  errors,
  onChange,
}: WorkLogFormStepOneProps) {
  const [focusQuestionId, setFocusQuestionId] = useState<string | null>(null)

  function handleQuestionChange(next: WorkLogFormDraftQuestion) {
    onChange({
      ...draft,
      questions: draft.questions.map((question) =>
        question.id === next.id ? next : question,
      ),
    })
  }

  function handleQuestionRemove(id: string) {
    onChange({
      ...draft,
      questions: draft.questions.filter((question) => question.id !== id),
    })
  }

  function handleQuestionAdd() {
    const question = createDraftQuestion()
    setFocusQuestionId(question.id)
    onChange({ ...draft, questions: [...draft.questions, question] })
  }

  return (
    <Step>
      <Cards>
        <Field>
          <TitleCard $invalid={Boolean(errors.name)}>
            <TitleLabel htmlFor="work-log-form-name">
              양식명<Required aria-hidden="true"> *</Required>
            </TitleLabel>
            <TitleInput
              id="work-log-form-name"
              value={draft.name}
              placeholder="양식명을 입력해주세요"
              aria-invalid={Boolean(errors.name) || undefined}
              aria-describedby={errors.name ? 'work-log-form-name-error' : undefined}
              onChange={(event) =>
                onChange({ ...draft, name: event.target.value })
              }
            />
          </TitleCard>
          {errors.name && (
            <ErrorRow id="work-log-form-name-error" role="alert">
              <ErrorIcon src={warningIcon} alt="" aria-hidden="true" />
              {errors.name}
            </ErrorRow>
          )}
        </Field>

        {draft.questions.map((question, index) => {
          const message = errors.questions[question.id]
          return (
            <Field key={question.id}>
              <WorkLogFormQuestionEditor
                question={question}
                index={index}
                invalid={Boolean(message)}
                autoFocus={question.id === focusQuestionId}
                onChange={handleQuestionChange}
                onRemove={() => handleQuestionRemove(question.id)}
              />
              {message && (
                <ErrorRow role="alert">
                  <ErrorIcon src={warningIcon} alt="" aria-hidden="true" />
                  {message}
                </ErrorRow>
              )}
            </Field>
          )
        })}

        {errors.emptyQuestions && (
          <ErrorRow role="alert">
            <ErrorIcon src={warningIcon} alt="" aria-hidden="true" />
            {errors.emptyQuestions}
          </ErrorRow>
        )}
      </Cards>

      <AddQuestionButton type="button" onClick={handleQuestionAdd}>
        <PlusIcon src={plusIcon} alt="" aria-hidden="true" />
        항목 추가하기
      </AddQuestionButton>
    </Step>
  )
}

const Step = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 80px;
`

const Cards = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 32px;
`

// 카드와 에러 메시지는 한 덩어리로 움직인다(Figma 1:3989 gap 16).
const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const TitleCard = styled.div<{ $invalid: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 40px;
  border: 1px solid
    ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : 'transparent')};
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
  padding: 0;
  border: 0;
  /* 포커스 때 아래 선만 색이 바뀌도록 자리를 미리 잡아 둔다. */
  border-bottom: 2px solid transparent;
  background: transparent;
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 40px;
  font-weight: 500;
  line-height: 1.2;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
  }

  &:focus {
    outline: 0;
    border-bottom-color: ${({ theme }) => theme.colors.accent};
  }
`

const ErrorRow = styled.p`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 18px;
  font-weight: 500;
`

const ErrorIcon = styled.img`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`

const AddQuestionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  font: inherit;
  font-size: 24px;
  font-weight: 500;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 4px;
  }
`

const PlusIcon = styled.img`
  width: 40px;
  height: 40px;
`
