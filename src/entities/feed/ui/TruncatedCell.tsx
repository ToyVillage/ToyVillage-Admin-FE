import styled from '@emotion/styled'

// 표 셀 값이 열 폭보다 길면 한 줄로 말줄임한다. 잘린 값은 title 로 볼 수 있다.
// (행 높이가 늘어나면 표 전체 레이아웃이 어긋나므로 줄바꿈하지 않는다.)
export function TruncatedCell({
  value,
  muted = false,
}: {
  value: string
  muted?: boolean
}) {
  return (
    <Text title={value} $muted={muted}>
      {value}
    </Text>
  )
}

const Text = styled.span<{ $muted: boolean }>`
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: ${({ theme, $muted }) =>
    $muted ? theme.colors.textGuide : 'inherit'};
  font-size: ${({ $muted }) => ($muted ? '22px' : 'inherit')};
  font-weight: ${({ $muted }) => ($muted ? 500 : 'inherit')};
  white-space: nowrap;
  text-overflow: ellipsis;
`
