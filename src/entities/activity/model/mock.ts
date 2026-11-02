import type { WorkLogActivity } from './types'

// 업무일지 퍼블리싱 mock. `all-activities-controller` 에 업무일지 API 가 생기면 `/api` 스킬이 실제 연동으로 바꾼다.
// 먹이 급여(4층·5층)·관찰일지는 실제 API 를 쓴다.
// 값은 Figma `전체 활동 · 목록`(3034:25175)의 2026-10-20 기록이다. 다른 날은 기록이 없다.
export const mockActivityDate = '2026-10-20'

export const mockWorkLogs: WorkLogActivity[] = [
  {
    id: 'work-log-1',
    writtenTime: '08:30',
    formName: '개장 전 점검일지',
    title: '정문·매표소 개장 전 점검',
    writerName: '이승현',
    attachmentCount: 1,
  },
  {
    id: 'work-log-2',
    writtenTime: '10:00',
    formName: '오전 순찰일지',
    title: '오전 순찰 특이사항 없음',
    writerName: '박도현',
    attachmentCount: 0,
  },
  {
    id: 'work-log-3',
    writtenTime: '12:40',
    formName: '사육장 청소일지',
    title: '파충류관 사육장 청소',
    writerName: '이서준',
    attachmentCount: 2,
  },
  {
    id: 'work-log-4',
    writtenTime: '15:00',
    formName: '오후 순찰일지',
    title: '수달사 펜스 점검',
    writerName: '김유영',
    attachmentCount: 0,
  },
  {
    id: 'work-log-5',
    writtenTime: '18:10',
    formName: '마감일지',
    title: '마감 점검 완료',
    writerName: '김유영',
    attachmentCount: 1,
  },
]
