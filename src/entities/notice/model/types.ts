export interface NoticeTeam {
  id: number
  name: string
}

export interface Notice {
  id: string
  /** 공지가 속한 팀. 전체 공개면 빈 배열이다(#147). */
  teams: NoticeTeam[]
  title: string
  content: string
  date: string
  attachments?: string[]
  /** 첨부 파일명과 저장소 키. 다운로드는 키로 파일 서버에서 받는다. */
  attachmentFiles?: NoticeAttachmentFile[]
}

export interface NoticeAttachmentFile {
  fileName: string
  fileKey: string
}

export type NoticeListItem = Pick<Notice, 'id' | 'teams' | 'title' | 'date'>

export interface CreateNoticeInput {
  /** 팀 조회 API 팀 id 목록. 전체 공개는 빈 배열 */
  teamIds: number[]
  title: string
  content: string
}

export interface UpdateNoticeInput {
  teamIds: number[]
  title: string
  content: string
  attachments?: string[]
}

/** 공지 목록·상세 화면에 보여줄 분류 문구. 빈 배열이면 `전체`. */
export function noticeCategoryLabel(teams: NoticeTeam[]): string {
  return teams.length > 0 ? teams.map((team) => team.name).join(', ') : '전체'
}
