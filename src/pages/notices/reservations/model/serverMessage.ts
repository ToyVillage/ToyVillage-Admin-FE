// 서버 오류 응답에서 사용자용 message 를 뽑는다. Figma 토스트 문구는 고정이지만
// 서버가 구체적인 사유(예: `사전답사일은 방문일보다 늦을 수 없습니다.`)를 주면
// 그 문장을 그대로 보여준다 — API 계약이 정한 실패 안내를 삼키지 않기 위해서다.
// 빈 문자열·공백뿐인 message 는 사유가 없는 것으로 보고 기본 문구를 쓴다.
export function serverMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data
  const message =
    data && typeof data === 'object'
      ? (data as Record<string, unknown>).message
      : undefined
  return typeof message === 'string' && message.trim() ? message : fallback
}
