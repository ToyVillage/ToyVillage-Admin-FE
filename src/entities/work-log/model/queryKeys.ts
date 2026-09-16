// 삭제·생성 뒤에는 목록만 무효화한다. 상세까지 무효화하면 사라진 id 를 다시 조회해 404 가 난다.
export const workLogQueryKeys = {
  all: ['work-logs'] as const,
  list: (date: string, page: number) =>
    ['work-logs', 'list', { date, page }] as const,
  detail: (workLogId: string) => ['work-logs', 'detail', workLogId] as const,
}

export const workLogFormQueryKeys = {
  all: ['work-log-forms'] as const,
  list: (date: string, page: number) =>
    ['work-log-forms', 'list', { date, page }] as const,
  detail: (templateId: string) =>
    ['work-log-forms', 'detail', templateId] as const,
}
