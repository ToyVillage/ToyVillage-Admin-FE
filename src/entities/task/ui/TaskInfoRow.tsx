import styled from '@emotion/styled'
import { TaskAssigneeCell } from './TaskAssigneeCell'
import { TaskPriorityBadge } from './TaskPriorityBadge'
import { TaskStatusBadge } from './TaskStatusBadge'
import type { TaskPriority, TaskStatus } from '../model/types'

interface TaskInfoRowProps {
  assigneeName: string
  /** 대표를 제외한 나머지 담당자 수 */
  assigneeExtraCount: number
  status: TaskStatus
  priority: TaskPriority
  /** YYYY-MM-DD */
  dueDate: string
}

// Figma `task info`(yot 152:11493). 상세 상단 요약행 4항목.
// 완료기한은 기한이 지나도 위험색을 쓰지 않는다(목록과 다른 지점 — spec 결정 사항).
export function TaskInfoRow({
  assigneeName,
  assigneeExtraCount,
  status,
  priority,
  dueDate,
}: TaskInfoRowProps) {
  return (
    <Card>
      <Item>
        <Term>담당자</Term>
        <Description>
          <TaskAssigneeCell name={assigneeName} extraCount={assigneeExtraCount} />
        </Description>
      </Item>
      <Item>
        <Term>상태</Term>
        <Description>
          <TaskStatusBadge status={status} />
        </Description>
      </Item>
      <Item>
        <Term>우선순위</Term>
        <Description>
          <TaskPriorityBadge priority={priority} />
        </Description>
      </Item>
      <Item>
        <Term>완료기한</Term>
        <Description>
          <DueDate>{dueDate}</DueDate>
        </Description>
      </Item>
    </Card>
  )
}

// Figma 는 x=40/400/720/1040 에 각각 280 폭이지만(1320 기준), 본문이 좁아지면
// 고정 폭이 카드를 넘친다. 같은 비율을 분수 컬럼으로 옮겨 축소되게 한다.
const Card = styled.dl`
  display: grid;
  grid-template-columns: 360fr 320fr 320fr 320fr;
  gap: 0 24px;
  margin: 0;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
    padding: 24px;
  }
`

const Item = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
`

const Term = styled.dt`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
`

const Description = styled.dd`
  display: flex;
  min-height: 40px;
  align-items: center;
  margin: 0;
`

const DueDate = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
`
