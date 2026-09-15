const TABLE_PAGE_SIZE = 10

/**
 * 개체관리 표의 페이지 슬라이싱(한 페이지 10행). 삭제로 페이지가 범위를 벗어난 렌더에서도
 * 마지막 페이지를 보여준다 — 페이지 번호 보정(렌더 중 `setPage`)이 반영되기 전 한 프레임을 위한 것이다.
 */
export function tablePage<Row>(rows: Row[], page: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / TABLE_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)

  return {
    pageCount,
    currentPage,
    pageRows: rows.slice(
      (currentPage - 1) * TABLE_PAGE_SIZE,
      currentPage * TABLE_PAGE_SIZE,
    ),
  }
}
