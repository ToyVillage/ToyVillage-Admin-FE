// 생성·수정·삭제 뒤 `all` 과 종 query(마리수 파생)를 무효화한다. 개체 삭제는 관찰 query 도 무효화한다.
export const individualQueryKeys = {
  all: ['individuals'] as const,
  list: (speciesId: string) => ['individuals', 'list', { speciesId }] as const,
  detail: (individualId: string) => ['individuals', individualId] as const,
}
