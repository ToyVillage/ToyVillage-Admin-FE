import styled from '@emotion/styled'
import { sidebarIcons } from './sidebarIcons'
import type { SidebarIconName } from '../model/types'

interface SidebarIconProps {
  name: SidebarIconName | null
}

// `설정` 처럼 아이콘이 없는 대분류도 라벨 시작 위치가 같도록 빈 32px 자리를 남긴다.
export function SidebarIcon({ name }: SidebarIconProps) {
  if (!name) return <IconSlot aria-hidden="true" />
  return <MaskedIcon $icon={sidebarIcons[name]} aria-hidden="true" />
}

const IconSlot = styled.span`
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
`

// 단색 아이콘이라 mask 로 깔아 활성 색상을 텍스트와 함께 따라가게 한다.
const MaskedIcon = styled(IconSlot)<{ $icon: string }>`
  background: currentColor;
  /* Vite 가 인라인한 svg data URI 는 안에 작은따옴표를 쓰므로 큰따옴표로 감싼다. */
  mask-image: url("${({ $icon }) => $icon}");
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: 32px 32px;
`
