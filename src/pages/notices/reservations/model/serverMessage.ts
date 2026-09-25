// 서버 오류 응답에서 사용자용 message 를 뽑는다. Figma 토스트 문구는 고정이지만
// 서버가 구체적인 사유(예: `사전답사일은 방문일보다 늦을 수 없습니다.`)를 주면
// 그 문장을 그대로 보여준다 — API 계약이 정한 실패 안내를 삼키지 않기 위해서다.
export function serverMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data
  if (
    data &&
    typeof data === 'object' &&
    typeof (data as Record<string, unknown>).message === 'string'
  ) {
    return (data as { message: string }).message
  }
  return fallback
}
