import type { FeedFormErrors, FeedFormValues } from './types'

// 급여량 입력칸에는 숫자와 소수점 하나만 남긴다. 단위 `kg` 는 입력칸 밖의 고정 글자다.
export function sanitizeFeedAmountInput(value: string): string {
  const digits = value.replace(/[^\d.]/g, '')
  const dot = digits.indexOf('.')
  if (dot === -1) return digits
  return digits.slice(0, dot + 1) + digits.slice(dot + 1).replace(/\./g, '')
}

// 끝의 `kg`(대소문자 무시, 앞 공백 허용)를 떼고 읽는다. 0보다 큰 수가 아니면 null.
export function parseFeedAmount(value: string): number | null {
  const amount = parseKgAmount(value)
  return amount != null && amount > 0 ? amount : null
}

// 잔량은 다 먹었으면 0 이라 0 도 받는다. 숫자가 아니면 null.
export function parseRemainingAmount(value: string): number | null {
  return parseKgAmount(value)
}

function parseKgAmount(value: string): number | null {
  const numeric = value.trim().replace(/\s*kg$/i, '')
  if (!/^\d+(\.\d+)?$/.test(numeric)) return null
  return Number(numeric)
}

// 제출 때만 전체를 검증한다(observation-form 패턴). 공백만 입력한 값은 빈 값이다.
export function validateFeedForm(values: FeedFormValues): FeedFormErrors {
  const errors: FeedFormErrors = {}

  if (!values.feedType.trim()) {
    errors.feedType = '먹이 종류를 입력해주세요!'
  }
  if (!values.feedAmount.trim()) {
    errors.feedAmount = '급여량을 입력해주세요!'
  } else if (parseFeedAmount(values.feedAmount) == null) {
    errors.feedAmount = '급여량을 숫자로 입력해주세요!'
  }
  if (!values.remainingAmount.trim()) {
    errors.remainingAmount = '잔량을 입력해주세요!'
  } else if (parseRemainingAmount(values.remainingAmount) == null) {
    errors.remainingAmount = '잔량을 숫자로 입력해주세요!'
  }

  return errors
}
