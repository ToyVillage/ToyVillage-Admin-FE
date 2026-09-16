import { useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createIndividual,
  individualQueryKeys,
  updateIndividual,
  type Individual,
} from '@/entities/individual'
import { resolvePhotoFileKey, speciesQueryKeys } from '@/entities/species'
import {
  FormFieldCard,
  PhotoUploadField,
  scrollToFirstFieldError,
} from '@/shared/ui'
import {
  isSameIndividualFormValues,
  toCreateIndividualInput,
  toIndividualFormValues,
  toUpdateIndividualInput,
} from '../model/formValues'
import type { IndividualFormErrors, IndividualFormValues } from '../model/types'
import { validateIndividualForm } from '../model/validation'
import { BirthYearField } from './BirthYearField'
import { IndividualSexField } from './IndividualSexField'

const nameErrorId = 'individual-name-error'

interface IndividualFormProps {
  mode: 'create' | 'edit'
  speciesId: string
  initialIndividual?: Individual
  onCompleted: () => void
  onDirtyChange: (isDirty: boolean) => void
}

// Figma COMPONENT `individual / 개체 등록 폼`(145:16016). 등록·수정 공용이며
// 차이는 복원 값과 제출 버튼 라벨이다. 필수값 오류는 카드 아래 인라인 줄로 보인다(107:8848).
export function IndividualForm({
  mode,
  speciesId,
  initialIndividual,
  onCompleted,
  onDirtyChange,
}: IndividualFormProps) {
  const queryClient = useQueryClient()
  const submittingRef = useRef(false)
  const initialValues = useMemo(
    () => toIndividualFormValues(initialIndividual),
    [initialIndividual],
  )
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<IndividualFormErrors>({})

  const isEditing = mode === 'edit'

  const mutation = useMutation({
    mutationFn: async (submitValues: IndividualFormValues) => {
      const input = initialIndividual
        ? toUpdateIndividualInput(submitValues, initialIndividual.photo)
        : toCreateIndividualInput(speciesId, submitValues)
      const fileKey = await resolvePhotoFileKey(input.photo)
      // 수정도 전체를 다시 보낸다. 빈 기타정보는 생략한다.
      const request = {
        animalKindId: Number(speciesId),
        animalName: input.name,
        animalGender: input.sex,
        birthYear: input.birthYear,
        ...(input.note ? { otherInfo: input.note } : {}),
        fileKey,
      }

      return initialIndividual
        ? updateIndividual({
            animalManageId: Number(initialIndividual.id),
            request,
          })
        : createIndividual(request)
    },
  })

  useEffect(() => {
    onDirtyChange(!isSameIndividualFormValues(values, initialValues))
  }, [initialValues, onDirtyChange, values])

  function setField<Key extends keyof IndividualFormValues>(
    key: Key,
    value: IndividualFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current || mutation.isPending) return

    const nextErrors = validateIndividualForm(values, new Date().getFullYear())
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstFieldError()
      return
    }

    submittingRef.current = true
    mutation.mutate(values, {
      // 종 마리수는 개체 수에서 파생하므로 종 query 도 함께 갱신한다.
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: individualQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: speciesQueryKeys.all }),
        ])
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
          label="개체명"
          required
          htmlFor="individual-name"
          error={errors.name}
          errorId={nameErrorId}
        >
          <TextInput
            id="individual-name"
            aria-required="true"
            aria-describedby={errors.name ? nameErrorId : undefined}
            value={values.name}
            placeholder="개체명을 입력해주세요"
            autoComplete="off"
            onChange={(event) => setField('name', event.target.value)}
          />
        </FormFieldCard>

        <IndividualSexField
          value={values.sex}
          error={errors.sex}
          onChange={(sex) => setField('sex', sex)}
        />

        <BirthYearField
          value={values.birthYear}
          error={errors.birthYear}
          onChange={(birthYear) => setField('birthYear', birthYear)}
        />

        <FormFieldCard label="기타정보" htmlFor="individual-note">
          <NoteInput
            id="individual-note"
            value={values.note}
            placeholder="기타정보를 입력해주세요"
            onChange={(event) => setField('note', event.target.value)}
          />
        </FormFieldCard>

        <PhotoUploadField
          label="사진"
          required
          hint="대표 사진 1장만 등록할 수 있습니다."
          value={values.photo}
          error={errors.photo}
          onChange={(photo) => setField('photo', photo)}
        />
      </Fields>

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
    </Form>
  )
}

// 폼 끝 → 제출 버튼 22px(종 생성 프레임 실측과 같다).
const Form = styled.form`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 22px;
`

// Figma `145:16016` 카드 간 간격 16px.
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

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
    opacity: 1;
  }
`

// Figma `field / 기타정보`(127:9390) 160px 고정 박스 — 넘치면 안에서 스크롤한다.
// placeholder 는 다른 입력과 달리 textFaint 다(실측).
const NoteInput = styled.textarea`
  display: block;
  width: 100%;
  height: 160px;
  padding: 20px 24px;
  overflow-y: auto;
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

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
    opacity: 1;
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

// Figma 제출 버튼 123×61(71:8794), 본문 우측 끝 정렬.
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
