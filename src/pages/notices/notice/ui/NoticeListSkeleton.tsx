import {
  PageHeaderSkeleton,
  SkeletonStatus,
  TableSkeleton,
  TabsSkeleton,
} from '@/shared/ui'

// Figma `공지사항 목록 (스켈레톤)`(1:9793).
export function NoticeListSkeleton() {
  return (
    <SkeletonStatus>
      <PageHeaderSkeleton action />
      <TabsSkeleton widths={[39, 73, 76, 77]} />
      <TableSkeleton
        columns={[
          { width: 240, bar: 56, barHeight: 33 },
          { width: 840, bar: 183 },
          { width: 240, bar: 119, barHeight: 19 },
        ]}
        rows={3}
        search
        pagination
      />
    </SkeletonStatus>
  )
}
