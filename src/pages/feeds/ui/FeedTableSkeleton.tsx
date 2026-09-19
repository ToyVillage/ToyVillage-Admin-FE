import { SkeletonStatus, TableSkeleton } from '@/shared/ui'

// Figma `먹이 급여 목록 (스켈레톤)`(2021:19089)의 표. 조회 조건(날짜·탭)은 그대로 두고 표 자리만 채운다.
export function FeedTableSkeleton() {
  return (
    <SkeletonStatus>
      <TableSkeleton
        appearance={{ dividerColor: 'textGuide' }}
        columns={[
          { width: 200, bar: 60, barHeight: 18 },
          { width: 180, bar: 50, barHeight: 18, headerBar: 50 },
          { bar: 180, barHeight: 18, headerBar: 110 },
          { width: 180, bar: 50, barHeight: 18, headerBar: 45 },
          { width: 220, bar: 110, barHeight: 18, headerBar: 60, paddingX: 24 },
          { width: 140, bar: 50, barHeight: 18, headerBar: 60, paddingX: 24 },
        ]}
        rows={3}
        pagination
      />
    </SkeletonStatus>
  )
}
