// 제품 의미가 있는 solid color와 공통 font family만 둔다.
// px/rgba/spacing/radius/layout 같은 컴포넌트 구현값은 Emotion 스타일에 직접 작성한다.
// 자세한 계약은 harness/shared/code-rules.md와 harness/publishing/design-input-contract.md를 따른다.
export const tokens = {
  color: {
    primary: '#FF8181', // 핑크 강조 (활성 탭/포인트)
    primaryBg: '#FFDDDD', // 핑크 배경 (활성 pill)
    accent: '#4952FF', // blue — 페이지네이션 활성 번호
    accentBg: '#E8E9FF', // blue-background — 페이지네이션 활성 배경
    pageMuted: '#C6C6CE', // gray/30 — 페이지네이션 비활성 번호
    text: '#000000',
    textStrong: '#36363F',
    textSub: '#838383', // 부제목
    textGuide: '#848491',
    textFaint: '#AFAFBA', // gray/40 — 검색 placeholder·"검색결과가 없습니다"
    textMuted: '#7C7C7C', // 비활성 탭
    textDate: '#747474',
    background: '#F5F5F7', // 페이지 배경
    surface: '#FFFFFF', // 카드/테이블 표면
    tableHeader: '#E1E1E1', // 테이블 헤더
    tableHeaderStrong: '#DDDDE3', // 업무 테이블 헤더 / 진행중 pill / 업로드 드롭존
    warning: '#FDB542', // 반려 상태 / 우선순위 중
    warningBg: '#FFE8C3', // 반려 상태 배경 / 우선순위 중 배경
    dangerBg: '#FFCECE', // 우선순위 하 배경
    toastIcon: '#1F1F1F', // 토스트 아이콘
    border: '#A1A1A1',
    dialogBorder: '#C6C6CE',
    divider: '#727272',
    avatar: '#D9D9D9',
    iconMuted: '#858585',
    danger: '#FF3131',
    filePng: '#13A76B',
    fileJpg: '#E8B64C',
  },
  font: {
    body: '"Wanted Sans", system-ui, -apple-system, sans-serif',
  },
} as const
