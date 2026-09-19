import styled from '@emotion/styled'
import downloadIcon from './assets/download.svg'
import removeIcon from './assets/remove-circle.svg'
import { fileTypeIcon } from './fileAttachment'

interface AttachmentChipProps {
  fileName: string
  onDownload: () => void
  /** 지정하면 다운로드 옆에 삭제 버튼을 두고, 생략하면 삭제 버튼이 없다. */
  onRemove?: () => void
  /**
   * 요소 순서. `name-first`(기본)는 유형 아이콘 → 파일명 → 다운로드로,
   * 삭제 버튼이 없으면 칩 전체가 다운로드 버튼이다(표 칸·팝오버·관찰 상세).
   * `action-first`(Figma `uploaded file` 1057:14773)는 유형 아이콘 → 다운로드 → 파일명이다(대표 사진).
   */
  order?: 'name-first' | 'action-first'
  /**
   * 삭제 아이콘 색. `danger`(기본)는 Figma 첨부 칩대로 항상 빨강,
   * `muted`(대표 사진)는 평소 회색이고 hover·focus 에서 빨강이다 (2026-09-18 개발자 결정, 이슈 #149).
   */
  removeTone?: 'danger' | 'muted'
  className?: string
}

// 개체관리 첨부 칩(관찰 표 127:9193 · 첨부 팝오버 970:26527 · 관찰 상세 1323:15046 · 관찰 수정 1284:15038)
// 과 대표 사진 칩(1057:14773). 기존 AttachmentList(텍스트 배지)와는 별개다.
export function AttachmentChip({
  fileName,
  onDownload,
  onRemove,
  order = 'name-first',
  removeTone = 'danger',
  className,
}: AttachmentChipProps) {
  const typeIcon = (
    <TypeIcon src={fileTypeIcon(fileName)} alt="" aria-hidden="true" />
  )
  const name = <FileName>{fileName}</FileName>

  // 파일명보다 앞에 버튼이 오는 순서에서는 칩 전체를 버튼으로 둘 수 없다.
  if (!onRemove && order === 'name-first') {
    return (
      <ChipButton
        className={className}
        data-order={order}
        type="button"
        aria-label={`${fileName} 다운로드`}
        onClick={onDownload}
      >
        {typeIcon}
        {name}
        <ActionIcon src={downloadIcon} alt="" aria-hidden="true" />
      </ChipButton>
    )
  }

  const download = (
    <IconButton
      type="button"
      // 삭제 버튼과 나란히 서면 터치 영역을 왼쪽으로만 넓힌다(서로 겹치지 않게).
      data-hit-area={onRemove ? 'left' : 'center'}
      aria-label={`${fileName} 다운로드`}
      onClick={onDownload}
    >
      <ActionIcon src={downloadIcon} alt="" aria-hidden="true" />
    </IconButton>
  )

  return (
    <Chip className={className} data-order={order}>
      {typeIcon}
      {order === 'action-first' ? (
        <>
          {download}
          {name}
        </>
      ) : (
        <>
          {name}
          {download}
        </>
      )}
      {onRemove && (
        <IconButton
          type="button"
          data-hit-area="right"
          data-remove-tone={removeTone}
          aria-label={`${fileName} 삭제`}
          onClick={onRemove}
        >
          {removeTone === 'muted' ? (
            <MutedRemoveIcon viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 0a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM5.76 6.82l1.06-1.06L10 8.94l3.18-3.18 1.06 1.06L11.06 10l3.18 3.18-1.06 1.06L10 11.06l-3.18 3.18-1.06-1.06L8.94 10 5.76 6.82Z"
              />
            </MutedRemoveIcon>
          ) : (
            <RemoveIcon src={removeIcon} alt="" aria-hidden="true" />
          )}
        </IconButton>
      )}
    </Chip>
  )
}

const Chip = styled.div`
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
  height: 56px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.textFaint};
  border-radius: 0;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
`

const ChipButton = styled(Chip.withComponent('button'))`
  cursor: pointer;
  font: inherit;
  text-align: left;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 2px;
  }
`

const TypeIcon = styled.img`
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
`

const FileName = styled.span`
  overflow: hidden;
  min-width: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;

  /* 표 칸·팝오버 칩은 Figma 칩 최대 폭(316)에 맞춰 230px 에서 말줄임한다. */
  [data-order='name-first'] > & {
    max-width: 230px;
  }
`

const ActionIcon = styled.img`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`

// 시각 크기는 24px 이고, 터치 영역은 칩 높이 안에서 44×44 로 넓힌다.
// 두 버튼이 나란히 서는 칩에서는 각자 바깥쪽으로만 넓혀 서로의 영역을 가리지 않는다.
const IconButton = styled.button`
  position: relative;
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    inset: -10px;
  }

  &[data-hit-area='left']::after {
    right: 0;
    left: -20px;
  }

  &[data-hit-area='right']::after {
    right: -20px;
    left: 0;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 2px;
  }

  /* 대표 사진 칩: 평소 회색, hover·focus 에서 빨강(RemoveIconButton 과 같은 규칙). */
  &[data-remove-tone='muted'] {
    color: ${({ theme }) => theme.colors.textGuide};
  }

  &[data-remove-tone='muted']:hover,
  &[data-remove-tone='muted']:focus-visible {
    color: ${({ theme }) => theme.colors.danger};
  }
`

// Figma `healthicons:no-outline` 24px 프레임 안 20px 글리프(inset 8.33%).
const RemoveIcon = styled.img`
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
`

// 회색 → hover 빨강으로 쓰는 삭제 글리프(`RemoveIconButton` 과 같은 path).
const MutedRemoveIcon = styled.svg`
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  fill: currentColor;
`
