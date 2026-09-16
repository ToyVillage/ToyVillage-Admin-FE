// 목록은 날짜로만 조회한다(서버에 분류 필터가 없다).
export const feedQueryKeys = {
  all: ['feeds'] as const,
  list: (date: string) => ['feeds', 'list', { date }] as const,
  detail: (feedLogId: string) => ['feeds', 'detail', feedLogId] as const,
}
