import { useEffect, useRef, useState, type ReactNode } from 'react'
import styled from '@emotion/styled'
import type { AppTheme } from '../theme/theme'
import searchIcon from './assets/search.svg'
import filterIcon from './assets/filter.svg'
import chevronIcon from './assets/chevron-left.svg'

// Figma 체크박스 박스 아이콘(assets/checkbox.svg)을 인라인 data URI로 사용해
// 에셋 URL 로딩과 무관하게 항상 렌더되도록 한다.
const checkboxBox =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M2.66667 24C1.93333 24 1.30556 23.7389 0.783333 23.2167C0.261111 22.6944 0 22.0667 0 21.3333V2.66667C0 1.93333 0.261111 1.30556 0.783333 0.783333C1.30556 0.261111 1.93333 0 2.66667 0H21.3333C22.0667 0 22.6944 0.261111 23.2167 0.783333C23.7389 1.30556 24 1.93333 24 2.66667V21.3333C24 22.0667 23.7389 22.6944 23.2167 23.2167C22.6944 23.7389 22.0667 24 21.3333 24H2.66667ZM2.66667 21.3333H21.3333V2.66667H2.66667V21.3333Z' fill='%231F1F1F'/%3E%3C/svg%3E\")"

// 선택된 체크박스(Figma): 24 박스를 통짜(안쪽 hole 없음) 파란(#4952FF)으로 채워
// 보더-채움 사이 seam(흰 선)을 없애고, 그 위에 흰 체크를 얹는다.
const checkboxChecked =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M2.66667 24C1.93333 24 1.30556 23.7389 0.783333 23.2167C0.261111 22.6944 0 22.0667 0 21.3333V2.66667C0 1.93333 0.261111 1.30556 0.783333 0.783333C1.30556 0.261111 1.93333 0 2.66667 0H21.3333C22.0667 0 22.6944 0.261111 23.2167 0.783333C23.7389 1.30556 24 1.93333 24 2.66667V21.3333C24 22.0667 23.7389 22.6944 23.2167 23.2167C22.6944 23.7389 22.0667 24 21.3333 24H2.66667Z' fill='%234952FF'/%3E%3Cpath d='M9.54961 18L3.84961 12.3L5.27461 10.875L9.54961 15.15L18.7246 5.97498L20.1496 7.39998L9.54961 18Z' fill='white'/%3E%3C/svg%3E\")"

// 도메인 무관 프레젠테이션 테이블. 컬럼 설정으로 헤더/셀을 기술하고,
// 선택(체크박스)·정렬 옵션·검색·페이지네이션을 주입받는다. 도메인→row 매핑은 엔티티가 담당한다.
export interface DataTableRow {
  id: string
  [key: string]: ReactNode
}

// 셀 표현 변형. pill=분류 배지, title=제목(24), date=날짜(22 muted), text=본문(24 strong),
// action=행 액션(텍스트 래퍼 없이 그대로 두고 행 클릭을 가로챈다).
export type DataTableCellVariant = 'pill' | 'title' | 'date' | 'text' | 'action'

type ThemeColorKey = keyof AppTheme['colors']

// Figma 의 표는 계열이 둘이다 — 공지·자료실·예약(테두리 있는 조밀한 표)과
// 업무·업무보고서(테두리 없는 넉넉한 표). 기본값은 앞쪽이고, 뒤쪽은 이 객체로만 덮어쓴다.
export interface DataTableAppearance {
  /** 카드 상단 여백(px) */
  offsetTop?: number
  /** 카드 테두리 표시 여부 */
  bordered?: boolean
  /** 헤더행 최소 높이(px) */
  headerHeight?: number
  /** 헤더행 배경 색 토큰 */
  headerBackground?: ThemeColorKey
  /** 헤더 텍스트 크기(px) */
  headerFontSize?: number
  /** 본문 행 최소 높이(px) */
  rowHeight?: number
  /** 행 구분선 색 토큰 */
  dividerColor?: ThemeColorKey
  /** 행 구분선 좌우 여백(px). 0 이면 카드 폭 전체 */
  dividerInset?: number
  /** 헤더·셀 가로 정렬 */
  align?: 'left' | 'center'
  /** 페이지네이션을 카드 안/밖 중 어디에 둘지 */
  paginationPlacement?: 'inside' | 'outside'
}

const defaultAppearance = {
  offsetTop: 20,
  bordered: true,
  headerHeight: 52,
  headerBackground: 'tableHeader',
  headerFontSize: 20,
  rowHeight: 92,
  dividerColor: 'divider',
  dividerInset: 40,
  align: 'left',
  paginationPlacement: 'inside',
} satisfies Required<DataTableAppearance>

export interface DataTableColumn {
  key: string
  header: string
  // px 고정폭. 생략 시 flex:1 로 남는 공간을 채운다.
  width?: number
  // 셀 좌우 padding(px). 생략 시 40.
  paddingX?: number
  variant?: DataTableCellVariant
  render?: (row: DataTableRow) => ReactNode
}

// 헤더행 아래에 들어가는 검색바(Figma list 컴포넌트). 상태·필터는 페이지가 소유하고
// 여기서는 표현과 입력 위임만 담당한다. 미지정 시 검색바를 렌더하지 않는다.
export interface DataTableSearch {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
}

// notice/resource 기존 정렬값. 정렬 옵션 미지정 시 최신순/오래된순으로 기본 렌더.
export type DataTableSortValue = 'newest' | 'oldest'

export interface DataTableSortOption {
  value: string
  label: string
}

export interface DataTableSort {
  value: string
  // 정렬 메뉴 항목. 생략 시 최신순/오래된순(기존 동작).
  options?: DataTableSortOption[]
  onChange: (value: string) => void
  ariaLabel?: string
}

// 행 다중 선택(체크박스 컬럼). 지정 시 헤더와 각 행 앞에 체크박스가 붙는다.
// 헤더 체크박스는 현재 표시된 행 전체를 선택/해제한다.
export interface DataTableSelection {
  selectedIds: string[]
  onToggle: (id: string) => void
  onToggleAll: () => void
  rowLabel?: (row: DataTableRow) => string
  allLabel?: string
}

// 카드 하단 페이지네이션. 실제 슬라이싱은 페이지가 담당하고 여기서는 표현/이동만.
export interface DataTablePagination {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

// 기존 소비처(notice/resource) 호환용 기본 3컬럼(분류/제목/날짜).
const defaultColumns: DataTableColumn[] = [
  { key: 'pill', header: '분류', width: 240, variant: 'pill' },
  { key: 'title', header: '제목', width: 840, variant: 'title' },
  { key: 'date', header: '날짜', width: 240, variant: 'date' },
]

const defaultSortOptions: DataTableSortOption[] = [
  { value: 'newest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
]

interface DataTableProps {
  rows: DataTableRow[]
  columns?: DataTableColumn[]
  onRowClick?: (id: string) => void
  rowTestId?: string
  search?: DataTableSearch
  sort?: DataTableSort
  selection?: DataTableSelection
  pagination?: DataTablePagination
  emptyLabel?: string
  emptyMinHeight?: number
  appearance?: DataTableAppearance
}

export function DataTable({
  rows,
  columns = defaultColumns,
  onRowClick,
  rowTestId,
  search,
  sort,
  selection,
  pagination,
  emptyLabel,
  emptyMinHeight,
  appearance,
}: DataTableProps) {
  const look = { ...defaultAppearance, ...appearance }
  const [sortOpen, setSortOpen] = useState(false)
  const sortControlRef = useRef<HTMLDivElement>(null)
  const sortOptions = sort?.options ?? defaultSortOptions
  const pageNumbers = pagination
    ? Array.from({ length: pagination.pageCount }, (_, i) => i + 1)
    : []
  const allSelected =
    selection != null &&
    rows.length > 0 &&
    rows.every((r) => selection.selectedIds.includes(r.id))

  useEffect(() => {
    if (!sortOpen) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!sortControlRef.current?.contains(event.target as Node)) {
        setSortOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setSortOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [sortOpen])

  // Figma 는 계열에 따라 페이지네이션을 카드 안(공지·자료실)과 밖(업무·업무보고서)에 둔다.
  const paginationNode =
    pagination && pagination.pageCount > 1 ? (
      <Pagination $placement={look.paginationPlacement}>
        <PageNav
          type="button"
          aria-label="이전 페이지"
          disabled={pagination.page <= 1}
          onClick={() => pagination.onChange(pagination.page - 1)}
        >
          <ChevronIcon src={chevronIcon} alt="" />
        </PageNav>
        <PageList>
          {pageNumbers.map((n) => (
            <PageButton
              key={n}
              type="button"
              $active={n === pagination.page}
              aria-label={`${n} 페이지`}
              aria-current={n === pagination.page ? 'page' : undefined}
              onClick={() => pagination.onChange(n)}
            >
              {n}
            </PageButton>
          ))}
        </PageList>
        <PageNav
          type="button"
          aria-label="다음 페이지"
          disabled={pagination.page >= pagination.pageCount}
          onClick={() => pagination.onChange(pagination.page + 1)}
        >
          <ChevronIcon src={chevronIcon} alt="" $flip />
        </PageNav>
      </Pagination>
    ) : null

  return (
    <>
      <Table $offsetTop={look.offsetTop} $bordered={look.bordered}>
        <Header $height={look.headerHeight} $background={look.headerBackground}>
          {selection && (
            <SelectHeadCell>
              <Checkbox
                type="checkbox"
                aria-label={selection.allLabel ?? '전체 선택'}
                checked={allSelected}
                onChange={selection.onToggleAll}
              />
            </SelectHeadCell>
          )}
          {columns.map((column) => (
            <HeadCell
              key={column.key}
              $width={column.width}
              $paddingX={column.paddingX}
              $align={look.align}
              $fontSize={look.headerFontSize}
            >
              {column.header}
            </HeadCell>
          ))}
        </Header>

        {(search || sort) && (
          <ControlRow>
            <ControlBar>
              {search && (
                <>
                  <SearchIcon src={searchIcon} alt="" aria-hidden="true" />
                  <SearchInput
                    type="search"
                    value={search.value}
                    placeholder={search.placeholder}
                    aria-label={search.ariaLabel ?? '검색'}
                    onChange={(e) => search.onChange(e.target.value)}
                  />
                </>
              )}
              {sort && (
                <SortControl ref={sortControlRef}>
                  <SortButton
                    type="button"
                    aria-label={sort.ariaLabel ?? '날짜 정렬'}
                    aria-haspopup="menu"
                    aria-expanded={sortOpen}
                    onClick={() => setSortOpen((open) => !open)}
                  >
                    <FilterIcon src={filterIcon} alt="" aria-hidden="true" />
                  </SortButton>
                  {sortOpen && (
                    <SortMenu role="menu" aria-label="날짜 정렬 옵션">
                      {sortOptions.map((option) => (
                        <SortOption
                          key={option.value}
                          type="button"
                          role="menuitemradio"
                          aria-checked={sort.value === option.value}
                          onClick={() => {
                            sort.onChange(option.value)
                            setSortOpen(false)
                          }}
                        >
                          {option.label}
                        </SortOption>
                      ))}
                    </SortMenu>
                  )}
                </SortControl>
              )}
            </ControlBar>
          </ControlRow>
        )}

        {rows.length === 0 && emptyLabel ? (
          <EmptyRow role="status" $minHeight={emptyMinHeight}>
            {emptyLabel}
          </EmptyRow>
        ) : (
          rows.map((r) => (
            <Row
              key={r.id}
              $height={look.rowHeight}
              $dividerColor={look.dividerColor}
              $dividerInset={look.dividerInset}
              data-testid={rowTestId}
              role={onRowClick ? 'link' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(r.id) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick(r.id)
                      }
                    }
                  : undefined
              }
            >
              {selection && (
                <SelectCell
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    type="checkbox"
                    aria-label={
                      selection.rowLabel?.(r) ?? `${String(r.id)} 선택`
                    }
                    checked={selection.selectedIds.includes(r.id)}
                    onChange={() => selection.onToggle(r.id)}
                  />
                </SelectCell>
              )}
              {columns.map((column) => {
                const content = column.render ? column.render(r) : r[column.key]
                // 액션 셀은 자체 컨트롤을 담으므로 행 이동을 일으키는 입력만 여기서 멈춘다.
                // (Escape 등 다른 키는 셀 안 컨트롤이 document 에서 받아야 한다.)
                const isAction = column.variant === 'action'
                return (
                  <Cell
                    key={column.key}
                    $width={column.width}
                    $paddingX={column.paddingX}
                    $align={look.align}
                    onClick={isAction ? (e) => e.stopPropagation() : undefined}
                    onKeyDown={
                      isAction
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation()
                            }
                          }
                        : undefined
                    }
                  >
                    {column.variant === 'pill' ? (
                      <Pill>{content}</Pill>
                    ) : isAction ? (
                      content
                    ) : (
                      <CellText $variant={column.variant ?? 'text'}>
                        {content}
                      </CellText>
                    )}
                  </Cell>
                )
              })}
            </Row>
          ))
        )}

        {look.paginationPlacement === 'inside' && paginationNode}
      </Table>
      {look.paginationPlacement === 'outside' && paginationNode}
    </>
  )
}

// 컬럼 폭: 고정 px 또는 flex:1(잔여 공간).
const cellWidth = (width?: number) =>
  width == null
    ? 'flex: 1; min-width: 0;'
    : `width: ${width}px; flex: 0 0 ${width}px;`

const Table = styled.div<{ $offsetTop: number; $bordered: boolean }>`
  width: 100%;
  margin-top: ${({ $offsetTop }) => $offsetTop}px;
  border: ${({ theme, $bordered }) =>
    $bordered ? `1px solid ${theme.colors.border}` : '0'};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
`

const Header = styled.div<{ $height: number; $background: ThemeColorKey }>`
  display: flex;
  min-height: ${({ $height }) => $height}px;
  background: ${({ theme, $background }) => theme.colors[$background]};
`

const ControlRow = styled.div`
  padding: 24px 40px 8px;
`

const ControlBar = styled.div`
  position: relative;
  display: flex;
  height: 50px;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 44px;
  background: ${({ theme }) => theme.colors.background};
`

const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 20px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
  }

  &::-webkit-search-cancel-button {
    cursor: pointer;
  }
`

const SearchIcon = styled.img`
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
`

const FilterIcon = styled.img`
  width: 22px;
  height: 20px;
  flex: 0 0 22px;
`

const SortControl = styled.div`
  position: relative;
  width: 22px;
  height: 20px;
  flex: 0 0 22px;
`

const SortButton = styled.button`
  display: flex;
  width: 22px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 4px;
    border-radius: 2px;
  }
`

const SortMenu = styled.div`
  position: absolute;
  z-index: 1;
  top: 37px;
  right: 0;
  display: flex;
  width: 120px;
  flex-direction: column;
  gap: 8px;
  padding: 24px 0;
  border-radius: 4px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 2px 8px rgb(0 0 0 / 16%);
`

const SortOption = styled.button`
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 20px;
  font-weight: 500;
  cursor: pointer;

  /* 현재 선택된 정렬을 강조해 어떤 정렬인지 보이게 한다. */
  &[aria-checked='true'] {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 700;
  }

  &:hover,
  &:focus-visible {
    outline: 0;
    background: ${({ theme }) => theme.colors.background};
  }
`

const EmptyRow = styled.div<{ $minHeight?: number }>`
  display: flex;
  min-height: ${({ $minHeight }) => $minHeight ?? 92}px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 22px;
  font-weight: 500;
`

const Row = styled.div<{
  $height: number
  $dividerColor: ThemeColorKey
  $dividerInset: number
}>`
  position: relative;
  display: flex;
  min-height: ${({ $height }) => $height}px;
  cursor: pointer;

  & + &::before {
    content: '';
    position: absolute;
    top: 0;
    left: ${({ $dividerInset }) => $dividerInset}px;
    right: ${({ $dividerInset }) => $dividerInset}px;
    border-top: 1px solid
      ${({ theme, $dividerColor }) => theme.colors[$dividerColor]};
  }
`

const HeadCell = styled.div<{
  $width?: number
  $paddingX?: number
  $align: 'left' | 'center'
  $fontSize: number
}>`
  display: flex;
  ${({ $width }) => cellWidth($width)}
  align-items: center;
  justify-content: ${({ $align }) =>
    $align === 'center' ? 'center' : 'flex-start'};
  padding: 12px ${({ $paddingX }) => $paddingX ?? 40}px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  font-size: ${({ $fontSize }) => $fontSize}px;
`

const Cell = styled.div<{
  $width?: number
  $paddingX?: number
  $align: 'left' | 'center'
}>`
  display: flex;
  ${({ $width }) => cellWidth($width)}
  align-items: center;
  justify-content: ${({ $align }) =>
    $align === 'center' ? 'center' : 'flex-start'};
  padding: 12px ${({ $paddingX }) => $paddingX ?? 40}px;
`

// 체크박스는 divider(좌우 40px inset) 안쪽에 오도록 좌측 40px 정렬한다.
const SelectHeadCell = styled.div`
  display: flex;
  width: 72px;
  flex: 0 0 72px;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 0 12px 40px;
`

const SelectCell = styled.div`
  display: flex;
  width: 72px;
  flex: 0 0 72px;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 0 12px 40px;
`

// Figma 체크박스 아이콘(사각 박스, assets/checkbox.svg). 미선택은 박스만,
// 선택 시 박스 위에 체크를 얹는다(선택-상태 원본 확보 시 교체).
const Checkbox = styled.input`
  appearance: none;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  margin: 0;
  background: ${checkboxBox} center / 24px no-repeat;
  cursor: pointer;

  &:checked {
    background: ${checkboxChecked} center / 24px no-repeat;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const CellText = styled.div<{ $variant: DataTableCellVariant }>`
  display: flex;
  min-width: 0;
  flex-direction: column;
  ${({ theme, $variant }) => {
    if ($variant === 'date') {
      return `
        color: ${theme.colors.textDate};
        font-size: 22px;
        font-weight: 500;
      `
    }
    // title · text
    return `
      color: ${theme.colors.text};
      font-size: 24px;
      font-weight: 500;
    `
  }}
`

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 25px;
  background: ${({ theme }) => theme.colors.primaryBg};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`

// 카드 밖 배치는 카드 하단에서 48px 띄운다(Figma 표 y=836 → 페이지네이션 y=884).
const Pagination = styled.nav<{ $placement: 'inside' | 'outside' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  ${({ $placement }) =>
    $placement === 'outside' ? 'margin-top: 48px;' : 'padding: 24px 0;'}
`

const PageNav = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`

const ChevronIcon = styled.img<{ $flip?: boolean }>`
  width: 28px;
  height: 28px;
  transform: rotate(${({ $flip }) => ($flip ? '180deg' : '0deg')});
`

const PageList = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`

const PageButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 24px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.accentBg : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.accent : theme.colors.pageMuted};
  font-size: ${({ $active }) => ($active ? 22 : 18)}px;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
`
