import type { AttachmentItem } from '@/shared/ui'

/** 편집 중인 값만 둔다. 날짜·관찰자는 읽기 전용이라 폼 값이 아니다. */
export interface ObservationFormValues {
  /** 입력 원문(검증·제출 시 trim) */
  title: string
  /** 입력 원문(검증·제출 시 trim) */
  content: string
  /** `AttachmentField` 가 알리는 현재 첨부, 화면 순서 */
  attachments: AttachmentItem[]
}

/** 카드 아래 인라인 오류 줄 문구(카드 순서). 첨부는 선택이다. */
export type ObservationFormErrors = Partial<Record<'title' | 'content', string>>
