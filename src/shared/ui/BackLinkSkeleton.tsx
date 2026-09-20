import styled from '@emotion/styled'
import { Skeleton } from './Skeleton'

// `BackLink` 자리(아이콘 36 · 간격 10 · 라벨).
export function BackLinkSkeleton() {
  return (
    <Row>
      <IconSlot>
        <Skeleton width={20} height={20} />
      </IconSlot>
      <Skeleton width={72} height={20} />
    </Row>
  )
}

const Row = styled.div`
  display: inline-flex;
  height: 36px;
  align-items: center;
  gap: 10px;
`

const IconSlot = styled.span`
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
`
