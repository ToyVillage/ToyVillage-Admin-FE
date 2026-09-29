import { useMemo, useState } from 'react'
import type { Staff } from '@/entities/reservation'

// 페이지 권한 배정 상태(검색 + 배정팀/배정가능 이동)를 관리하는 훅.
// mock 경계: 실제 권한 저장/후보 목록은 /api 슬라이스에서 확정한다.
export function usePermissionAssignment(
  candidates: Staff[],
  initialAssignedIds: string[] = [],
) {
  const [query, setQuery] = useState('')
  const [assignedIds, setAssignedIds] = useState<string[]>(initialAssignedIds)

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return candidates
    return candidates.filter((staff) =>
      staff.name.toLowerCase().includes(keyword),
    )
  }, [candidates, query])

  const assigned = useMemo(
    () => filtered.filter((staff) => assignedIds.includes(staff.id)),
    [filtered, assignedIds],
  )
  const available = useMemo(
    () => filtered.filter((staff) => !assignedIds.includes(staff.id)),
    [filtered, assignedIds],
  )

  const add = (staffId: string) =>
    setAssignedIds((prev) =>
      prev.includes(staffId) ? prev : [...prev, staffId],
    )
  const cancel = (staffId: string) =>
    setAssignedIds((prev) => prev.filter((id) => id !== staffId))

  return {
    query,
    setQuery,
    assigned,
    available,
    assignedIds,
    add,
    cancel,
  }
}
