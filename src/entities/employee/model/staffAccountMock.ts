import { toIsoDate, todayCalendarDate } from '@/shared/lib'
import type { NewStaffAccountInput, StaffAccount } from './staffAccount'

// 퍼블리싱 mock. 직원 조회 API 가 생성일·비밀번호 변경 여부를 주지 않아
// 목록·삭제·비밀번호 초기화는 이 메모리 저장소로 흉내 낸다(새로고침하면 처음 값으로 돌아간다).
// `/api` 연동 시 이 파일의 함수만 실제 요청으로 바꾼다.
const initialStaffAccounts: StaffAccount[] = [
  {
    id: 1,
    name: '김수인',
    username: 'suin.kim',
    passwordChanged: true,
    createdAt: '2026-07-03',
  },
  {
    id: 2,
    name: '이승현',
    username: 'seunghyun.lee',
    passwordChanged: true,
    createdAt: '2026-06-21',
  },
  {
    id: 3,
    name: '이지아',
    username: 'jia.lee',
    passwordChanged: false,
    createdAt: '2026-06-02',
  },
  {
    id: 4,
    name: '박도현',
    username: 'dohyun.park',
    passwordChanged: true,
    createdAt: '2026-05-14',
  },
  {
    id: 5,
    name: '최민지',
    username: 'minji.choi',
    passwordChanged: false,
    createdAt: '2026-09-20',
  },
  {
    id: 6,
    name: '정하늘',
    username: 'haneul.jung',
    passwordChanged: true,
    createdAt: '2026-04-30',
  },
  {
    id: 7,
    name: '한서준',
    username: 'seojun.han',
    passwordChanged: true,
    createdAt: '2026-04-11',
  },
  {
    id: 8,
    name: '윤채원',
    username: 'chaewon.yoon',
    passwordChanged: false,
    createdAt: '2026-03-27',
  },
  {
    id: 9,
    name: '강민호',
    username: 'minho.kang',
    passwordChanged: true,
    createdAt: '2026-03-08',
  },
  {
    id: 10,
    name: '오예린',
    username: 'yerin.oh',
    passwordChanged: true,
    createdAt: '2026-02-19',
  },
  {
    id: 11,
    name: '서지훈',
    username: 'jihoon.seo',
    passwordChanged: false,
    createdAt: '2026-01-25',
  },
  {
    id: 12,
    name: '임다은',
    username: 'daeun.lim',
    passwordChanged: true,
    createdAt: '2026-01-06',
  },
]

let staffAccounts = initialStaffAccounts.map((account) => ({ ...account }))

export async function getStaffAccounts(): Promise<StaffAccount[]> {
  return staffAccounts.map((account) => ({ ...account }))
}

export async function deleteStaffAccount(id: number): Promise<void> {
  staffAccounts = staffAccounts.filter((account) => account.id !== id)
}

export async function resetStaffAccountPassword(id: number): Promise<void> {
  staffAccounts = staffAccounts.map((account) =>
    account.id === id ? { ...account, passwordChanged: false } : account,
  )
}

/** 계정 생성 API 가 성공한 뒤 목록 mock 에 새 계정을 맨 앞에 넣는다. */
export async function addStaffAccount({
  name,
  username,
}: NewStaffAccountInput): Promise<void> {
  const nextId = Math.max(0, ...staffAccounts.map((account) => account.id)) + 1
  staffAccounts = [
    {
      id: nextId,
      name,
      username,
      passwordChanged: false,
      createdAt: toIsoDate(todayCalendarDate()),
    },
    ...staffAccounts,
  ]
}
