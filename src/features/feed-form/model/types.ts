/** 편집 중인 값만 둔다. 대상 개체·급여일시·급여자는 읽기 전용이라 폼 값이 아니다. */
export interface FeedFormValues {
  /** 입력 원문(검증·제출 시 trim) */
  feedType: string
  /** 입력 원문(숫자만). 단위 `kg` 는 입력칸 밖에 고정으로 붙는다. */
  feedAmount: string
  /** 입력 원문(제출 시 trim). 선택 항목이다. */
  note: string
}

/** 카드 아래 인라인 오류 줄 문구. 특이사항은 선택이라 오류가 없다. */
export type FeedFormErrors = Partial<Record<'feedType' | 'feedAmount', string>>
