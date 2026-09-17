import type { QueryClient } from '@tanstack/react-query'
import {
  createLegalStatus,
  getLegalStatuses,
  legalStatusQueryKeys,
} from '@/entities/species'

/**
 * 선택된 이름(화면 순서)을 종 저장 요청의 법정지정분류 id 로 바꾼다.
 * 서버 공용 목록에 없는 이름(아직 만들지 않은 기본 항목, 다른 곳에서 삭제된 항목)은
 * 차례로 만든 뒤 목록을 다시 받아 id 를 찾는다(2026-09-17 개발자 결정).
 */
export async function resolveLegalStatusIds(
  queryClient: QueryClient,
  names: string[],
): Promise<number[]> {
  if (names.length === 0) return []

  let statuses = await queryClient.fetchQuery({
    queryKey: legalStatusQueryKeys.all,
    queryFn: getLegalStatuses,
    staleTime: 0,
  })
  const missingNames = names.filter(
    (name) => !statuses.some((status) => status.name === name),
  )

  if (missingNames.length > 0) {
    for (const name of missingNames) {
      await createLegalStatus({ kind: name })
    }
    await queryClient.invalidateQueries({
      queryKey: legalStatusQueryKeys.all,
      refetchType: 'none',
    })
    statuses = await queryClient.fetchQuery({
      queryKey: legalStatusQueryKeys.all,
      queryFn: getLegalStatuses,
      staleTime: 0,
    })
  }

  return names.map((name) => {
    const status = statuses.find((item) => item.name === name)
    if (!status) {
      throw new Error(`법정지정분류 id를 찾지 못했습니다: ${name}`)
    }
    return status.id
  })
}
