import { queryOptions } from '@tanstack/react-query'
import { getTeamTree } from '../api/teamApi'

// 업무지시 담당자 트리. 팀 설정·직원 계정 생성·삭제 뒤 무효화한다.
export const teamQueryKeys = {
  tree: ['teams', 'tree'] as const,
}

// 팀 구조 조회는 응답이 느리고(p95 9초대) 바뀌는 곳이 위의 무효화 지점뿐이라
// 전역 staleTime(60초)보다 길게 캐시한다. 업무 목록·상세가 미리 불러 둔다.
export const teamTreeQueryOptions = queryOptions({
  queryKey: teamQueryKeys.tree,
  queryFn: getTeamTree,
  staleTime: 30 * 60_000,
  gcTime: 60 * 60_000,
})
