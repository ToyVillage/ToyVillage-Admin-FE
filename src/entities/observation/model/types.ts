export interface ObservationAttachment {
  fileName: string
  fileKey: string
}

/** 관찰 기록은 앱에서 작성한다. 웹은 조회·수정·삭제만 한다. */
export interface Observation {
  id: string
  individualId: string
  title: string
  /** YYYY-MM-DD, 표시 YYYY.MM.DD */
  observedAt: string
  observerName: string
  /** 관찰사항 */
  content: string
  /** 없으면 [] */
  attachments: ObservationAttachment[]
}

/** 유지한 기존 첨부는 `fileKey` 를 그대로 보내고, 새 첨부는 `fileKey` 없이 보낸다(mock 이 발급). */
export interface ObservationAttachmentInput {
  fileName: string
  fileKey?: string
}

/** 날짜·관찰자는 읽기 전용이라 보내지 않는다. */
export interface UpdateObservationInput {
  title: string
  content: string
  /** 화면 순서 */
  attachments: ObservationAttachmentInput[]
}
