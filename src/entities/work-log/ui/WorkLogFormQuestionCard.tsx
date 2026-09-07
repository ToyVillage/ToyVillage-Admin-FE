import styled from '@emotion/styled'
import type {
  WorkLogFormQuestion,
  WorkLogFormQuestionType,
} from '../model/types'
import optionCheckboxIcon from './assets/option-checkbox.svg'
import optionRadioIcon from './assets/option-radio.svg'
import typeCheckboxIcon from './assets/type-checkbox.svg'
import typeChoiceIcon from './assets/type-choice.svg'
import typeTextIcon from './assets/type-text.svg'

interface WorkLogFormQuestionCardProps {
  question: WorkLogFormQuestion
}

const typeLabels: Record<WorkLogFormQuestionType, string> = {
  CHOICE: '객관식 질문',
  CHECKBOX: '체크박스',
  TEXT: '주관식',
}

const typeIcons: Record<WorkLogFormQuestionType, string> = {
  CHOICE: typeChoiceIcon,
  CHECKBOX: typeCheckboxIcon,
  TEXT: typeTextIcon,
}

// TEXT 는 선택지가 없어 옵션 아이콘을 쓰지 않지만, 인덱싱을 좁히지 않도록 함께 둔다.
const optionIcons: Record<WorkLogFormQuestionType, string> = {
  CHOICE: optionRadioIcon,
  CHECKBOX: optionCheckboxIcon,
  TEXT: optionRadioIcon,
}

// Figma 547:14132 / 547:14186 / 547:14240. 양식 정의를 읽기 전용으로 보여주는 카드.
// 선택 상태가 없는 화면이므로 아이콘은 장식이고 입력 요소를 쓰지 않는다.
export function WorkLogFormQuestionCard({
  question,
}: WorkLogFormQuestionCardProps) {
  const options = question.options ?? []

  return (
    <Card>
      <Inner>
        <HeaderRow>
          <QuestionName>{question.label}</QuestionName>
          <TypeBadge>
            <TypeIcon src={typeIcons[question.type]} alt="" aria-hidden="true" />
            <TypeLabel>
              {typeLabels[question.type]}
              {question.required && <Required aria-hidden="true"> *</Required>}
            </TypeLabel>
          </TypeBadge>
          <HeaderSpacer aria-hidden="true" />
        </HeaderRow>

        {question.type === 'TEXT' ? (
          <TextAnswer>텍스트</TextAnswer>
        ) : (
          options.map((option) => (
            <OptionRow key={option}>
              <OptionIcon
                src={optionIcons[question.type]}
                alt=""
                aria-hidden="true"
              />
              <OptionLabel>{option}</OptionLabel>
            </OptionRow>
          ))
        )}
      </Inner>
    </Card>
  )
}

const Card = styled.section`
  padding: 40px;
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
`

const QuestionName = styled.h2`
  display: flex;
  min-width: 0;
  height: 64px;
  flex: 1;
  align-items: center;
  margin: 0;
  padding: 20px 24px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 22px;
  font-weight: 500;
`

const TypeBadge = styled.div`
  display: flex;
  width: 240px;
  height: 64px;
  flex: 0 0 240px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
`

const TypeIcon = styled.img`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`

const TypeLabel = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  white-space: nowrap;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`

// Figma 헤더행 오른쪽 100x64 빈 자리(수정 화면의 액션 자리). 상세에서는 비워 둔다.
const HeaderSpacer = styled.div`
  width: 100px;
  height: 64px;
  flex: 0 0 100px;
`

const OptionRow = styled.div`
  display: flex;
  height: 64px;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
`

const OptionIcon = styled.img`
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
`

const OptionLabel = styled.span`
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 22px;
  font-weight: 500;
`

// 주관식은 입력 자리만 보여준다. 읽기 전용이라 input 을 두지 않는다.
// 밑줄 폭은 Figma 547:14259 의 1102px (카드 안쪽 폭보다 좁다).
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
