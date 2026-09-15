// 생성·수정·삭제 뒤 `all` 을 무효화한다. 종 삭제는 개체·관찰 query 도 함께 무효화한다(연쇄 삭제).
export const speciesQueryKeys = {
  all: ['species'] as const,
  list: ['species', 'list'] as const,
  detail: (speciesId: string) => ['species', speciesId] as const,
}
