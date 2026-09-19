// 시각 칸에 숫자 한 자를 이어 붙인다. 보이는 값이 곧 입력값이 되도록
// "두 자리로 완성될 수 없는 자리"는 0을 앞에 채워 확정한다.
//   "" + 1 → "1"(→ 10시)   "" + 9 → "09"(9시)   "2" + 5 → "025"(02시 50분)
//   "10" + 3 → "103"(30분)  "10" + 8 → "1008"(08분)
export function appendClockDigit(rawDigits: string, key: string): string {
  const digits = rawDigits.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 4) return digits

  // 시 첫 자리: 3~9 는 두 자리 시(30~99시)가 될 수 없으므로 09시처럼 확정한다.
  if (digits.length === 0) return key <= '2' ? key : `0${key}`

  // 시 둘째 자리: 24시를 넘기면 앞 자리를 0x시로 확정하고 이 숫자는 분으로 넘긴다.
  if (digits.length === 1) {
    const hour = digits + key
    if (Number(hour) <= 23) return hour
    return appendClockDigit(`0${digits}`, key)
  }

  // 분 첫 자리: 6~9 는 두 자리 분(60~99분)이 될 수 없으므로 0x분으로 확정한다.
  if (digits.length === 2) return key <= '5' ? digits + key : `${digits}0${key}`

  return digits + key
}

// 서버 시간 문자열("HH:mm" 또는 "HH:mm:ss") → 폼 값인 24시간제 원시 자릿수 "HHmm".
// 수정 폼 초기값 변환용. 예: "13:01:00" → "1301".
export function clock24ToRawDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4)
}

// 폼 값(24시간제 원시 자릿수) → 서버용 "HH:mm". 모자란 자릿수는 0으로 채운다.
// 예: "1830" → "18:30", "9" → "90:00" 이 되지 않도록 검증(validation)을 먼저 통과시킨다.
export function rawDigitsTo24hClock(rawDigits: string): string {
  const digits = rawDigits.replace(/\D/g, '').slice(0, 4).padEnd(4, '0')
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
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
