// 변경 뒤 `all` 접두를 무효화하고, 삭제 성공 시 단건 캐시를 먼저 제거한다.
export const observationQueryKeys = {
  all: ['observations'] as const,
  list: (individualId: string) =>
    ['observations', 'list', { individualId }] as const,
  detail: (observationId: string) => ['observations', observationId] as const,
}
