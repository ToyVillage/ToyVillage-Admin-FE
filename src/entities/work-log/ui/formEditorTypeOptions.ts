import type { WorkLogFormEditorType } from '../model/types'
import { workLogFormEditorTypes } from '../model/types'
import optionCheckboxIcon from './assets/option-checkbox.svg'
import optionRadioIcon from './assets/option-radio.svg'
import typeCheckboxIcon from './assets/type-checkbox.svg'
import typeChoiceIcon from './assets/type-choice.svg'
import typeFileIcon from './assets/type-file.svg'
import typeTextIcon from './assets/type-text.svg'

// Figma 1:3797 의 유형 드롭다운. 순서도 Figma 와 같다.
export const workLogFormEditorTypeLabels: Record<
  WorkLogFormEditorType,
  string
> = {
  TEXT: '주관식',
  CHOICE: '객관식 질문',
  CHECKBOX: '체크박스',
  FILE: '파일 업로드',
}

export const workLogFormEditorTypeIcons: Record<
  WorkLogFormEditorType,
  string
> = {
  TEXT: typeTextIcon,
  CHOICE: typeChoiceIcon,
  CHECKBOX: typeCheckboxIcon,
  FILE: typeFileIcon,
}

export const workLogFormEditorTypeOptions = workLogFormEditorTypes.map(
  (type) => ({
    value: type,
    label: workLogFormEditorTypeLabels[type],
    icon: workLogFormEditorTypeIcons[type],
  }),
)

// 선택지 앞에 붙는 아이콘. 선택 상태가 없는 양식 정의이므로 장식으로만 쓴다.
export const workLogFormOptionIcons: Record<WorkLogFormEditorType, string> = {
  TEXT: optionRadioIcon,
  CHOICE: optionRadioIcon,
  CHECKBOX: optionCheckboxIcon,
  FILE: optionRadioIcon,
}
