// 생성·수정·삭제 뒤 `all` 과 종 query(마리수)를 무효화한다. 개체 삭제는 관찰 query 도 무효화한다.
export const individualQueryKeys = {
  all: ['individuals'] as const,
  lists: (speciesId: string) => ['individuals', 'list', { speciesId }] as const,
  list: (speciesId: string, params: { page: number; keyword: string }) =>
    ['individuals', 'list', { speciesId }, params] as const,
  detail: (individualId: string) => ['individuals', individualId] as const,
  // 종 id 만 쓰는 조회. 상세와 응답 모양이 달라 키를 분리한다.
  speciesId: (individualId: string) =>
    ['individuals', individualId, 'species-id'] as const,
}
