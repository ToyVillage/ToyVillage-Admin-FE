export interface ObservationAttachment {
  fileName: string
  fileKey: string
}

/** 관찰 기록은 앱에서 작성한다. 웹은 조회·수정·삭제만 한다. 목록 응답에는 관찰사항이 없다. */
export interface ObservationListItem {
  id: string
  individualId: string
  title: string
  /** YYYY-MM-DD(서버 `createdAt` 의 날짜 부분), 표시 YYYY.MM.DD */
  observedAt: string
  /** 서버 `authorName` */
  observerName: string
  /** 없으면 [] */
  attachments: ObservationAttachment[]
}

export interface Observation extends ObservationListItem {
  /** 관찰사항 */
  content: string
}

/** 유지한 기존 첨부는 `fileKey` 를, 새 첨부는 업로드할 `file` 을 갖는다. */
export interface ObservationAttachmentInput {
  fileName: string
  fileKey?: string
  file?: File
}

/** 날짜·관찰자는 읽기 전용이라 보내지 않는다. */
export interface UpdateObservationInput {
  title: string
  content: string
  /** 화면 순서. 서버는 받은 목록으로 첨부를 통째로 바꾼다. */
  attachments: ObservationAttachmentInput[]
}
