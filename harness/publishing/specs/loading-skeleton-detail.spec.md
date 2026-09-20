---
feature: loading-skeleton-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 305:12757
  relatedNodeIds:
    - 2021:19967
    - 2021:20089
    - 2021:20692
    - 2021:20919
    - 2021:21097
    - 2021:21273
    - 2021:22217
    - 2021:21453
    - 2021:21824
    - 2021:22154
    - 2021:22388
    - 2021:22592
    - 2021:22659
    - 2021:22750
    - 2021:22902
    - 2021:23902
    - 2021:24145
    - 2021:24307
requires_functional_test: true
paths: src/shared/ui, src/pages
---

# 로딩 스켈레톤 · 상세/수정 행동명세

## 목적

상세·수정 화면이 첫 조회 중일 때 "불러오는 중" 카드나 빈 화면 대신 Figma `스켈레톤 · 상세`(`2021:24414`)·`스켈레톤 · 수정`(`2021:24415`) 모양의 스켈레톤을 보인다. 이슈 #108의 2차 범위. 공통 부품은 `loading-skeleton-list`에서 만든 `Skeleton`·`SkeletonStatus`를 재사용한다.

## 동작 (source of truth)

- 화면의 첫 조회가 끝나기 전에는 해당 화면의 스켈레톤을 보인다.
  - 스켈레톤 루트는 `role="status"`, `aria-busy="true"`, 접근 이름 `불러오는 중`을 가진다(`SkeletonStatus`).
- 조회가 성공하면 스켈레톤이 사라지고 실제 내용(상세) 또는 값이 채워진 폼(수정)이 보인다.
- 조회가 실패하거나 대상이 없으면 스켈레톤이 사라지고 기존 오류·없음 표시를 그대로 보인다.
- 수정 화면은 조회 중에 입력할 수 있는 빈 폼을 보이지 않는다(값이 채워지기 전 입력 방지).
- 적용 화면과 Figma 프레임:

  | 화면 | 경로 | Figma |
  | --- | --- | --- |
  | 공지사항 상세 | `/notices/list/:id` | `2021:19967` |
  | 휴관일 상세 | `/notices/guide/:id` | `2021:20089` |
  | 업무 상세 | `/tasks/:id` | `2021:20692` |
  | 업무보고 상세 | `/task-reports/:id` | `2021:20919` |
  | 업무일지 상세 | `/work-logs/:id` | `2021:21097` |
  | 업무일지 양식 상세 | `/work-logs/forms/:id` | `2021:21273` |
  | 먹이 급여 상세 | `/feeds/:id` | `2021:22217` |
  | 종 상세 | `/species/:speciesId` | `2021:21453` |
  | 개체 상세 | `/species/:speciesId/individuals/:individualId` | `2021:21824` |
  | 관찰 상세 | `/species/.../observations/:observationId` | `2021:22154` |
  | 공지사항 수정 | `/notices/list/:id/edit` | `2021:22388` |
  | 휴관일 수정 | `/notices/guide/:id/edit` | `2021:22592` |
  | 운영시간 수정 | `/notices/guide/hours/:date` | `2021:22659` |
  | 자료실 수정 | `/notices/resources/:id` | `2021:22750` |
  | 단체예약 수정 | `/notices/reservations/:id` | `2021:22902` |
  | 종 수정 | `/species/:speciesId/edit` | `2021:23902` |
  | 개체 수정 | `/species/:speciesId/individuals/:individualId/edit` | `2021:24145` |
  | 관찰 수정 | `/species/.../observations/:observationId/edit` | `2021:24307` |

## 데이터

- 기존 TanStack Query 조회의 `isPending`만 사용한다. 새 API 연결 없음.

## 컴포넌트 구조/props

- 화면별 스켈레톤은 각 page(`ui/`)에 둔다. 상세 공통 뼈대(뒤로가기·제목·본문 카드)는 필요하면 `shared/ui`에 `DetailSkeleton` 류로 묶는다.

## 비고

- 자료실·단체예약은 상세 경로가 곧 수정 폼이라 `수정` 프레임만 쓰고 `자료실 상세`(`2021:20123`)·`단체예약 상세`(`2021:20242`)는 대응 화면이 없다.
- `업무일지 양식 수정`(`2021:23425`)·`업무일지 구역 수정`(`2021:23689`)은 조회하는 수정 화면이 없어 제외한다.
- 업무 수정(`/tasks/:id/edit`)은 Figma 스켈레톤 프레임이 없어 이번 범위에서 제외한다.
