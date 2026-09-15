import { useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createMockSpecies,
  legalDesignationPresets,
  speciesQueryKeys,
  updateMockSpecies,
  type Species,
} from '@/entities/species'
import {
  FormFieldCard,
  FormFieldLabel,
  PhotoUploadField,
  scrollToFirstFieldError,
} from '@/shared/ui'
import {
  isSameSpeciesFormValues,
  toSpeciesFormValues,
  toSpeciesInput,
} from '../model/formValues'
import type { SpeciesFormErrors, SpeciesFormValues } from '../model/types'
import { validateSpeciesForm } from '../model/validation'
import { LegalDesignationField } from './LegalDesignationField'
import { TaxonGroupField } from './TaxonGroupField'

const koreanNameErrorId = 'species-korean-name-error'
const englishScientificNameErrorId = 'species-english-scientific-name-error'

interface SpeciesFormProps {
  mode: 'create' | 'edit'
  initialSpecies?: Species
  onCompleted: () => void
  onDirtyChange: (isDirty: boolean) => void
}

// Figma `species new`(68:8744) · `species edit`(84:8781) 폼. 등록·수정 공용이며
// 차이는 복원 값과 제출 버튼 라벨이다. 필수값 오류는 카드 아래 인라인 줄로 보인다(107:8777).
export function SpeciesForm({
  mode,
  initialSpecies,
  onCompleted,
  onDirtyChange,
}: SpeciesFormProps) {
  const queryClient = useQueryClient()
  const submittingRef = useRef(false)
  const initialValues = useMemo(
    () => toSpeciesFormValues(initialSpecies),
    [initialSpecies],
  )
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<SpeciesFormErrors>({})

  const isEditing = mode === 'edit'

  const mutation = useMutation({
    mutationFn: (submitValues: SpeciesFormValues) => {
      const input = toSpeciesInput(submitValues, initialSpecies?.photo)
      return initialSpecies
        ? updateMockSpecies({ id: initialSpecies.id, input })
        : createMockSpecies(input)
    },
  })

  useEffect(() => {
    onDirtyChange(!isSameSpeciesFormValues(values, initialValues))
  }, [initialValues, onDirtyChange, values])

  function setField<Key extends keyof SpeciesFormValues>(
    key: Key,
    value: SpeciesFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current || mutation.isPending) return

    const nextErrors = validateSpeciesForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstFieldError()
      return
    }

    submittingRef.current = true
    mutation.mutate(values, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: speciesQueryKeys.all,
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
          label="국명"
          required
          htmlFor="species-korean-name"
          error={errors.koreanName}
          errorId={koreanNameErrorId}
        >
          <TextInput
            id="species-korean-name"
            aria-required="true"
            aria-describedby={errors.koreanName ? koreanNameErrorId : undefined}
            value={values.koreanName}
            placeholder="국명을 입력해주세요"
            autoComplete="off"
            onChange={(event) => setField('koreanName', event.target.value)}
          />
        </FormFieldCard>

        <FormFieldCard
          error={errors.englishScientificName}
          errorId={englishScientificNameErrorId}
        >
          <NameColumns>
            <NameColumn>
              <FormFieldLabel htmlFor="species-english-name" required>
                영문명
              </FormFieldLabel>
              <TextInput
                id="species-english-name"
                aria-required="true"
                aria-describedby={
                  errors.englishScientificName
                    ? englishScientificNameErrorId
                    : undefined
                }
                value={values.englishName}
                placeholder="영문명을 입력해주세요"
                autoComplete="off"
                onChange={(event) =>
                  setField('englishName', event.target.value)
                }
              />
            </NameColumn>
            <NameColumn>
              <FormFieldLabel htmlFor="species-scientific-name" required>
                학명
              </FormFieldLabel>
              <TextInput
                id="species-scientific-name"
                aria-required="true"
                aria-describedby={
                  errors.englishScientificName
                    ? englishScientificNameErrorId
                    : undefined
                }
                value={values.scientificName}
                placeholder="학명을 입력해주세요"
                autoComplete="off"
                onChange={(event) =>
                  setField('scientificName', event.target.value)
                }
              />
            </NameColumn>
          </NameColumns>
        </FormFieldCard>

        <FormFieldCard>
          <TaxonGroupField
            value={values.taxonGroup}
            onChange={(taxonGroup) => setField('taxonGroup', taxonGroup)}
          />
          <SubClassification>
            <FormFieldLabel htmlFor="species-sub-classification">
              세부 분류
            </FormFieldLabel>
            <TextInput
              id="species-sub-classification"
              value={values.subClassification}
              placeholder="세부 분류를 입력해주세요"
              autoComplete="off"
              onChange={(event) =>
                setField('subClassification', event.target.value)
              }
            />
          </SubClassification>
        </FormFieldCard>

        <LegalDesignationField
          presets={legalDesignationPresets}
          value={values.legalDesignations}
          onChange={(legalDesignations) =>
            setField('legalDesignations', legalDesignations)
          }
        />

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

// 폼 끝 → 제출 버튼 22px(생성 프레임 실측).
const Form = styled.form`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 22px;
`

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

// Figma `field / 영문명·학명`: 618 폭 2열, 열 gap 20px.
const NameColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const NameColumn = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
`

// Figma `세부 분류`(127:9337): 분류군 pill 아래 위 padding 16px.
const SubClassification = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
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

// Figma 제출 버튼 123×61(68:8801), 본문 우측 끝 정렬.
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
