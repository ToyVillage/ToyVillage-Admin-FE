import styled from '@emotion/styled'
import { useTheme } from '@emotion/react'

export interface TaskReportProgressCounts {
  total: number
  approved: number
  rejected: number
  /** 심사대기 + 재제출 + 미제출. 별도 조각 없이 심사대기에 합산한다(spec 결정 사항). */
  pending: number
}

interface TaskProgressCardProps {
  counts: TaskReportProgressCounts
}

// 도넛 160×160, 두께 40 → 획 중심선 반지름 60.
const radius = 60
const circumference = 2 * Math.PI * radius

// Figma `progress`(yot 152:11536). 차트 라이브러리를 쓰지 않고 인라인 SVG 로 그린다.
// 도넛은 장식이므로 aria-hidden 이고, 같은 정보를 아래 요약 문구가 텍스트로 전달한다.
export function TaskProgressCard({ counts }: TaskProgressCardProps) {
  const theme = useTheme()
  const segments = [
    { key: 'approved', value: counts.approved, color: theme.colors.accent },
    { key: 'rejected', value: counts.rejected, color: theme.colors.warning },
    { key: 'pending', value: counts.pending, color: theme.colors.pageMuted },
  ].filter((segment) => segment.value > 0)

  let offset = 0

  return (
    <Card>
      <Title>진행도</Title>
      <Donut viewBox="0 0 160 160" aria-hidden="true">
        <Track cx="80" cy="80" r={radius} />
        {segments.map((segment) => {
          const length = (segment.value / counts.total) * circumference
          const dashOffset = -offset
          offset += length

          return (
            <Segment
              key={segment.key}
              cx="80"
              cy="80"
              r={radius}
              stroke={segment.color}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
            />
          )
        })}
      </Donut>
      <Summary>
        전체 {counts.total} · 승인 {counts.approved} · 반려 {counts.rejected} ·
        심사대기 {counts.pending}
      </Summary>
    </Card>
  )
}

const Card = styled.section`
  display: flex;
  width: 420px;
  flex: 0 1 420px;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    width: 100%;
    padding: 24px;
  }
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Donut = styled.svg`
  width: 160px;
  height: 160px;
  /* 12시 방향에서 시계 방향으로 조각을 채운다. */
  transform: rotate(-90deg);
`

const Track = styled.circle`
  fill: none;
  stroke: ${({ theme }) => theme.colors.background};
  stroke-width: 40;
`

const Segment = styled.circle`
  fill: none;
  stroke-width: 40;
`

const Summary = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
  /* 좁은 폭에서 심사대기 같은 낱말이 글자 단위로 끊기지 않게 어절 단위로 접는다. */
  word-break: keep-all;
`
