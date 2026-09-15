// 제품 의미가 있는 solid color와 공통 font family만 둔다.
// px/rgba/spacing/radius/layout 같은 컴포넌트 구현값은 Emotion 스타일에 직접 작성한다.
// 자세한 계약은 harness/shared/code-rules.md와 harness/publishing/design-input-contract.md를 따른다.
export const tokens = {
  color: {
    primary: '#FF8181', // 핑크 강조 (활성 탭/포인트)
    primaryBg: '#FFDDDD', // 핑크 배경 (활성 pill)
    accent: '#4952FF', // blue — 페이지네이션 활성 번호 / 사이드바 활성 메뉴
    accentBg: '#E8E9FF', // blue-background — 페이지네이션 활성 배경 / 사이드바 활성 밴드
    pageMuted: '#C6C6CE', // gray/30 — 페이지네이션 비활성 번호
    text: '#000000',
    textStrong: '#36363F',
    textSub: '#838383', // 부제목
    textGuide: '#848491',
    subMenuText: '#5C5C69', // gray/80 — 사이드바 아코디언 하위 메뉴 텍스트
    textBody: '#484854', // gray/90 — 업무일지 시트 셀 값·양식 질문 텍스트
    textFaint: '#AFAFBA', // gray/40 — 검색 placeholder·"검색결과가 없습니다"
    optionMuted: '#9999A5', // gray/50 — 셀렉트 드롭다운 비선택 항목
    choiceMuted: '#70707D', // 개체관리 pill 미선택 글자 (분류군·법정지정분류·성별)
    textValue: '#5C5C68', // 개체관리 종 상세 프로필 카드 정보 값
    textMuted: '#7C7C7C', // 비활성 탭
    textDate: '#747474',
    background: '#F5F5F7', // 페이지 배경
    surface: '#FFFFFF', // 카드/테이블 표면
    surfaceSunken: '#FAFAFC', // 업무일지 양식 파일 업로드 드롭존 배경
    surfaceRaised: '#FAFAFB', // 팀 관리 rail 의 `팀 추가하기` 버튼 배경
    inkSurface: '#111114', // 팀 관리 선택된 rail 행 / 검은 pill 버튼 배경
    textDim: '#A1A1A9', // gray — 선택 행 보조 텍스트 · 모달 placeholder · 비활성 버튼 글자
    dividerFaint: '#EEEEF1', // gray/5 — 팀 관리 패널·표 구분선
    avatarMuted: '#ECECEF', // 팀원 추가 모달 아바타 원 배경
    dangerText: '#E5484D', // `팀 삭제` 버튼 글자
    dangerBorder: '#F3C0C0', // `팀 삭제` 버튼 테두리
    tableHeader: '#E1E1E1', // 테이블 헤더
    tableHeaderStrong: '#DDDDE3', // 업무 테이블 헤더 / 진행중 pill / 업로드 드롭존
    tableDivider: '#EDEDF0', // gray/10 — 급여 이력 표 행 구분선
    warning: '#FDB542', // 반려 상태 / 우선순위 중
    warningBg: '#FFE8C3', // 반려 상태 배경 / 우선순위 중 배경
    warningText: '#8A5A00', // 법정지정분류 뱃지 글자 (warningBg 위)
    dangerBg: '#FFCECE', // 우선순위 상 배경 / 삭제 모달 아이콘 배경
    success: '#00B48A', // 성공 토스트 아이콘
    border: '#A1A1A1',
    dialogBorder: '#C6C6CE',
    selectOpenBorder: '#5C5C68', // gray/80 — 열린 셀렉트 트리거 테두리(업무일지 양식 구역 설정)
    divider: '#727272',
    avatar: '#D9D9D9',
    iconMuted: '#858585',
    menuChevron: '#858591', // gray/70 — 사이드바 대분류 펼침 chevron
    danger: '#FF3131',
    filePng: '#13A76B',
    fileJpg: '#E8B64C',
  },
  font: {
    body: '"Wanted Sans", system-ui, -apple-system, sans-serif',
  },
} as const
