/** YYYY-MM-DD → YYYY.MM.DD — 관찰 표 `날짜` 열·관찰 상세·관찰 수정 날짜 표기 */
export function formatObservationDate(isoDate: string): string {
  return isoDate.replaceAll('-', '.')
}
