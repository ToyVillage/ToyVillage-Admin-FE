import type { AmPm } from './types'

// 24시간 "HH : MM" 표시 문자열 → 12시간 폼 값(raw 자릿수 "HHMM" + am/pm). 수정 초기값 변환용.
export function clock24ToParts(value: string): { time: string; ampm: AmPm } {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length < 4) return { time: digits, ampm: 'am' }
  const h24 = Number(digits.slice(0, 2))
  const minute = digits.slice(2, 4)
  const ampm: AmPm = h24 >= 12 ? 'pm' : 'am'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return { time: String(h12).padStart(2, '0') + minute, ampm }
}

// 폼 12시간 값(raw 자릿수 "HHMM" + am/pm) → 서버용 24시간 "HH:mm". 제출 변환용.
// 예: ("1000","am")→"10:00", ("0600","pm")→"18:00", ("1200","am")→"00:00".
export function partsTo24hClock(rawDigits: string, ampm: AmPm): string {
  const digits = rawDigits.replace(/\D/g, '').slice(0, 4).padEnd(4, '0')
  const base = Number(digits.slice(0, 2)) % 12
  const h24 = ampm === 'pm' ? base + 12 : base
  return `${String(h24).padStart(2, '0')}:${digits.slice(2, 4)}`
}

// 숫자 입력을 yyyy.mm.dd 형식으로 자동 서식(최대 8자리).
export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  const year = digits.slice(0, 4)
  const month = digits.slice(4, 6)
  const day = digits.slice(6, 8)
  let out = year
  if (digits.length > 4) out += `.${month}`
  if (digits.length > 6) out += `.${day}`
  return out
}

// 시간: 입력한 자릿수(raw digits)를 왼쪽부터 채우고 나머지는 0으로 "HH : MM" 표시.
// 예: "1"→"10 : 00", "12"→"12 : 00", "123"→"12 : 30", "1230"→"12 : 30".
export function formatClock(rawDigits: string): string {
  const digits = rawDigits.replace(/\D/g, '').slice(0, 4)
  if (!digits) return ''
  const padded = digits.padEnd(4, '0')
  // 콜론은 U+2236(RATIO) — system-ui 폰트에서 일반 ':'는 아래로 쏠려 숫자와 중앙이 안 맞음.
  return `${padded.slice(0, 2)} ∶ ${padded.slice(2, 4)}`
}

// "HH : MM"(또는 "H : MM") 표시 문자열 → 원시 자릿수(최대 4). 편집 초기값 변환용.
export function clockToRawDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4)
}

// 숫자만 남긴다(인원).
export function formatDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}

// 금액: 천단위 콤마(예: 1000000 → 1,000,000).
export function formatMoney(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('ko-KR')
}

// 연락처: 010-0000-0000 형식(최대 11자리, 3-4-4).
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}
