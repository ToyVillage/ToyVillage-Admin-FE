import styled from '@emotion/styled'
import type {
  WorkLogFormDraftQuestion,
  WorkLogFormEditorType,
} from '@/entities/work-log'
import {
  workLogFormEditorTypeOptions,
  workLogFormOptionIcons,
} from '@/entities/work-log'
import { SelectMenu } from '@/shared/ui'
import closeIcon from '@/shared/ui/assets/close.svg'
import trashIcon from '@/shared/ui/assets/trash.svg'
import {
  changeQuestionType,
  createDraftOption,
  hasOptions,
} from '../model/draft'

interface WorkLogFormQuestionEditorProps {
  question: WorkLogFormDraftQuestion
  index: number
  invalid: boolean
  // 새로 추가한 카드의 질문명으로 포커스를 옮긴다(spec 1단계 조작).
  autoFocus: boolean
  onChange: (question: WorkLogFormDraftQuestion) => void
  onRemove: () => void
}

// Figma 1:4440 / 1:4486 / 1:4532 — 편집 가능한 질문 카드 하나.
export function WorkLogFormQuestionEditor({
  question,
  index,
  invalid,
  autoFocus,
  onChange,
  onRemove,
}: WorkLogFormQuestionEditorProps) {
  const showOptions = hasOptions(question.type)
  const hasEtc = question.options.some((option) => option.isEtc)
  const questionNumber = index + 1

  function handleTypeChange(value: string) {
    onChange(changeQuestionType(question, value as WorkLogFormEditorType))
  }

  function handleOptionChange(optionId: string, value: string) {
    onChange({
      ...question,
      options: question.options.map((option) =>
        option.id === optionId ? { ...option, value } : option,
      ),
    })
  }

  function handleOptionRemove(optionId: string) {
    onChange({
      ...question,
      options: question.options.filter((option) => option.id !== optionId),
    })
  }

  function handleOptionAdd(isEtc: boolean) {
    onChange({
      ...question,
      options: [...question.options, createDraftOption(isEtc)],
    })
  }

  return (
    <Card $invalid={invalid} data-testid="work-log-form-question">
      <Inner>
        <HeaderRow>
          <NameInput
            autoFocus={autoFocus}
            value={question.label}
            placeholder="항목을 입력해주세요"
            aria-label={`${questionNumber}번 항목 이름`}
            aria-invalid={invalid || undefined}
            onChange={(event) =>
              onChange({ ...question, label: event.target.value })
            }
          />
          <SelectMenu
            value={question.type ?? ''}
            options={workLogFormEditorTypeOptions}
            onChange={handleTypeChange}
            ariaLabel={`${questionNumber}번 항목 유형`}
            width={240}
            height={64}
            variant="field"
            placeholder="선택"
            maxListHeight={400}
            requiredMark
          />
          <RemoveQuestionSlot>
            <IconButton
              type="button"
              aria-label={`${questionNumber}번 항목 삭제`}
              onClick={onRemove}
            >
              <TrashIcon src={trashIcon} alt="" aria-hidden="true" />
            </IconButton>
          </RemoveQuestionSlot>
        </HeaderRow>

        {question.type === null ? null : question.type === 'FILE' ? (
          // Figma 1619:15568 — 응답자가 보게 될 업로드 영역의 미리보기.
          // 양식 정의 화면이라 실제 업로드는 하지 않는다(다른 답변 영역과 같은 규칙).
          <UploadDropzone>
            <UploadIconChip aria-hidden="true">↑</UploadIconChip>
            <UploadMain>클릭하거나 파일을 끌어다 놓으세요</UploadMain>
            <UploadHint>JPG · PNG · PDF · 최대 10MB · 최대 5개</UploadHint>
          </UploadDropzone>
        ) : showOptions ? (
          <Options>
            {question.options.map((option, optionIndex) => (
              <OptionRow key={option.id}>
                <OptionBody>
                  <OptionIcon
                    src={workLogFormOptionIcons[question.type ?? 'CHOICE']}
                    alt=""
                    aria-hidden="true"
                  />
                  {option.isEtc && <EtcLabel>기타:</EtcLabel>}
                  <OptionInput
                    $underline={option.isEtc}
                    value={option.value}
                    placeholder={option.isEtc ? '' : `옵션${optionIndex + 1}`}
                    aria-label={
                      option.isEtc
                        ? `${questionNumber}번 항목 기타 선택지`
                        : `${questionNumber}번 항목 ${optionIndex + 1}번 선택지`
                    }
                    onChange={(event) =>
                      handleOptionChange(option.id, event.target.value)
                    }
                  />
                </OptionBody>
                <IconButton
                  type="button"
                  aria-label={`${questionNumber}번 항목 ${optionIndex + 1}번 선택지 삭제`}
                  onClick={() => handleOptionRemove(option.id)}
                >
                  <CloseIcon src={closeIcon} alt="" aria-hidden="true" />
                </IconButton>
              </OptionRow>
            ))}

            <AddRow>
              <OptionIcon
                src={workLogFormOptionIcons[question.type ?? 'CHOICE']}
                alt=""
                aria-hidden="true"
              />
              <AddText>
                <AddLink type="button" onClick={() => handleOptionAdd(false)}>
                  옵션 추가
                </AddLink>
                {question.options.length > 0 && !hasEtc && (
                  <>
                    <AddSeparator> 또는 </AddSeparator>
                    <AddLink type="button" onClick={() => handleOptionAdd(true)}>
                      기타 추가
                    </AddLink>
                  </>
                )}
              </AddText>
            </AddRow>
          </Options>
        ) : (
          // 선택지가 없는 유형은 답변 자리만 보여준다. 양식 정의라 입력 요소를 두지 않는다.
          <TextAnswer>텍스트</TextAnswer>
        )}
      </Inner>
    </Card>
  )
}

const Card = styled.section<{ $invalid: boolean }>`
  padding: 40px;
  border: 1px solid
    ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : 'transparent')};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 36px;
  flex-wrap: wrap;
`

const NameInput = styled.input`
  display: flex;
  min-width: 0;
  height: 64px;
  flex: 1 1 320px;
  align-items: center;
  padding: 20px 24px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textBody};
  font: inherit;
  font-size: 22px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

// Figma 헤더행 오른쪽 100x64 자리. 상세 화면에서는 비어 있고 편집에서는 삭제 버튼이 들어간다.
const RemoveQuestionSlot = styled.div`
  display: flex;
  width: 100px;
  height: 64px;
  flex: 0 0 100px;
  align-items: center;
  justify-content: center;
`

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const TrashIcon = styled.img`
  width: 32px;
  height: 32px;
`

const CloseIcon = styled.img`
  width: 40px;
  height: 40px;
`

const Options = styled.div`
  display: flex;
  flex-direction: column;
`

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 60px;
`

// Figma 1:4459 — 선택지 상자는 1102px 이고 카드 오른쪽 끝까지 늘어나지 않는다.
const OptionBody = styled.div`
  display: flex;
  height: 64px;
  min-width: 0;
  flex: 0 1 1102px;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
`

const OptionIcon = styled.img`
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
`

const EtcLabel = styled.span`
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 22px;
  font-weight: 500;
  white-space: nowrap;
`

const OptionInput = styled.input<{ $underline: boolean }>`
  min-width: 0;
  flex: 1;
  height: ${({ $underline }) => ($underline ? '40px' : 'auto')};
  padding: 0;
  border: 0;
  border-bottom: ${({ $underline, theme }) =>
    $underline ? `1px solid ${theme.colors.textFaint}` : '0'};
  background: transparent;
  color: ${({ theme }) => theme.colors.textBody};
  font: inherit;
  font-size: 22px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const AddRow = styled.div`
  display: flex;
  height: 64px;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
`

const AddText = styled.span`
  display: inline-flex;
  align-items: center;
`

const AddLink = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  font: inherit;
  font-size: 22px;
  font-weight: 500;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const AddSeparator = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  white-space: pre;
`

// Figma 1619:15568 — 1240x182, radius 12, 1.5px 테두리.
const UploadDropzone = styled.div`
  display: flex;
  width: 100%;
  height: 182px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px;
  border: 1.5px solid ${({ theme }) => theme.colors.dialogBorder};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surfaceSunken};
`

const UploadIconChip = styled.span`
  display: inline-flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.accentBg};
  color: ${({ theme }) => theme.colors.accent};
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
`

const UploadMain = styled.span`
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 22px;
  font-weight: 500;
`

const UploadHint = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 16px;
  font-weight: 500;
`

const TextAnswer = styled.div`
  display: flex;
  width: min(1102px, 100%);
  height: 64px;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.textFaint};
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 22px;
  font-weight: 500;
`
