import styled from '@emotion/styled'
import { TruncatedText } from '@/shared/ui'

// 표 셀 값이 열 폭보다 길면 한 줄로 말줄임한다. 잘린 값은 hover 로 전체를 볼 수 있다.
// (행 높이가 늘어나면 표 전체 레이아웃이 어긋나므로 줄바꿈하지 않는다.)
export function TruncatedCell({
  value,
  muted = false,
}: {
  value: string
  muted?: boolean
}) {
  return muted ? <MutedText value={value} /> : <TruncatedText value={value} />
}

const MutedText = styled(TruncatedText)`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
`
