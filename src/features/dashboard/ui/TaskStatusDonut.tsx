import styled from '@emotion/styled'
import { useTheme } from '@emotion/react'
import {
  TaskStatusBadge,
  taskStatusLabels,
  type TaskStatus,
} from '@/entities/task'
import { Skeleton } from '@/shared/ui'
import type { DashboardTaskStatusCounts } from '../model/types'

interface TaskStatusDonutProps {
  counts: DashboardTaskStatusCounts
  // 첫 조회 중. 상태 배지는 그대로 두고 도넛과 수치 자리만 막대로 채운다(Figma 2238:22610).
  loading?: boolean
}

const SIZE = 168
const STROKE = 30.24
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// 12시 방향부터 시계방향으로 그리는 순서이자 범례 순서.
const order: TaskStatus[] = ['COMPLETED', 'IN_PROGRESS', 'EXPIRED']

// Figma `donut`(1906:17625) + `legend`(1906:17630).
export function TaskStatusDonut({
  counts,
  loading = false,
}: TaskStatusDonutProps) {
  const theme = useTheme()

  const total = order.reduce((sum, status) => sum + counts[status], 0)
  const colors: Record<TaskStatus, string> = {
    COMPLETED: theme.colors.accent,
    IN_PROGRESS: theme.colors.pageMuted,
    EXPIRED: theme.colors.warning,
  }
  const summary = order
    .map((status) => `${taskStatusLabels[status]} ${counts[status]}`)
    .join(', ')
  const segments = order.reduce<
    { status: TaskStatus; length: number; offset: number }[]
  >((acc, status) => {
    const prev = acc.at(-1)
    const offset = prev ? prev.offset + prev.length : 0
    const length = total === 0 ? 0 : (counts[status] / total) * CIRCUMFERENCE
    return [...acc, { status, length, offset }]
  }, [])

  if (loading) {
    return (
      <Body>
        <Chart aria-hidden="true">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={theme.colors.tableHeaderStrong}
              strokeWidth={STROKE}
            />
          </svg>
          <Total aria-hidden="true">
            <Skeleton width={40} height={36} radius={18} />
          </Total>
        </Chart>
        <Legend>
          {order.map((status) => (
            <LegendRow key={status}>
              <TaskStatusBadge status={status} />
              <Skeleton width={28} height={20} />
            </LegendRow>
          ))}
        </Legend>
      </Body>
    )
  }

  return (
    <Body>
      <Chart role="img" aria-label={`전체 업무 ${total}건: ${summary}`}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden="true"
        >
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={theme.colors.tableHeaderStrong}
              strokeWidth={STROKE}
            />
            {segments
              .filter(({ length }) => length > 0)
              .map(({ status, length, offset }) => (
                <circle
                  key={status}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={colors[status]}
                  strokeWidth={STROKE}
                  strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                  strokeDashoffset={-offset}
                />
              ))}
          </g>
        </svg>
        <Total aria-hidden="true">{total}</Total>
      </Chart>
      <Legend>
        {order.map((status) => (
          <LegendRow key={status}>
            <TaskStatusBadge status={status} />
            <Count $status={status}>{counts[status]}</Count>
          </LegendRow>
        ))}
      </Legend>
    </Body>
  )
}

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: 32px;
`

const Chart = styled.div`
  position: relative;
  width: 168px;
  height: 168px;
  flex-shrink: 0;

  svg {
    display: block;
  }
`

const Total = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 36px;
  font-weight: 600;
  line-height: normal;
  transform: translate(-50%, -50%);
`

// 1920 카드에서 도넛 옆 남는 폭(176)보다 작게 두고, 이보다 좁으면 도넛 아래로 내려간다.
const Legend = styled.ul`
  min-width: 0;
  flex: 1 1 160px;
  margin: 0;
  padding: 0;
  list-style: none;
`

const LegendRow = styled.li`
  display: flex;
  height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  }
`

const Count = styled.span<{ $status: TaskStatus }>`
  min-width: 92px;
  color: ${({ theme, $status }) =>
    $status === 'COMPLETED'
      ? theme.colors.accent
      : $status === 'EXPIRED'
        ? theme.colors.warning
        : theme.colors.textGuide};
  font-size: 22px;
  font-weight: 600;
  line-height: normal;
`
