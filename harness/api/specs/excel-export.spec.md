---
feature: excel-export
api_id: EXCEL_EXPORT
target_page: src/pages/settings/excel-download/ExcelDownloadPage.tsx
notion_page:
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

엑셀 다운로드 화면(`/settings/excel-download`)의 mock 경계(`requestMockExcelExport`)를 실제 내보내기 요청(GET `/excel`)으로 바꿔 선택한 항목과 기간의 파일을 내려받게 한다. 이슈 #282.

# 대상 페이지 또는 컴포넌트

- `src/entities/excel-export` (mock 제거, 요청 함수·항목↔서버 값 매핑)
- `src/features/export-excel` (다운로드 mutation, 파일 저장, 실패 토스트, 파일 형식 선택, 항목 10개 격자)
- `src/shared/ui/Toast.tsx` (문구에 맞춰 폭을 늘리는 선택 prop. 다른 화면은 그대로)
- 페이지 `src/pages/settings/excel-download/ExcelDownloadPage.tsx`는 변경 없음

# 연동할 API

- API ID: `EXCEL_EXPORT`
- Notion 검색(`EXCEL`·`엑셀`·`/excel`) 0건 — 제안 ID. 개발자 지시(2026-11-02 "스웨거에서 확인")에 따라 staging Swagger `excel-controller`만 기준으로 삼는다.

# 기대 성공 동작

- `엑셀 다운로드`를 누르면 GET `/excel`을 한 번 보내고, 받은 파일을 내려받는다.
- 화면 항목 하나가 서버 `types` 값 하나다(Figma 2026-11-02):

| 화면 항목 | `types` |
| --- | --- |
| 동물 리스트 | `ANIMAL` |
| 관찰일지 | `ANIMAL_OBSERVATION` |
| 4층 먹이 급여 | `FEED_LOG` |
| 5층 먹이 급여 | `FIFTH_FLOOR_FEED_LOG` |
| 업무관리 | `TASK` |
| 업무보고 | `WORK_REPORT` |
| 업무일지관리 | `WORK_LOG` |
| 단체예약 | `RESERVATION` |
| 공지사항 | `NOTICE` |
| 직원 계정 관리 | `TEAM_MEMBER` |

- `DOCUMENT`는 화면에 항목이 없어 보내지 않는다.
- `mode`는 화면에서 고른다(개발자 결정 2026-11-02). `엑셀 파일 (.xlsx)` = `SHEET`(기본), `압축 파일 (.zip)` = `ZIP`. Figma `파일 형식` 카드(`3706:25836`)를 따른다.
- `전체 기간`이면 `startDate`·`endDate`를 보내지 않는다. 그 밖에는 `YYYY-MM-DD`로 보낸다.
- 파일 이름은 화면이 만든다. 서버 CORS 설정이 `Content-Disposition`을 노출하지 않아 브라우저에서 읽을 수 없기 때문이다.
  - 형식: `{항목 1개면 화면 이름, 여러 개면 통합}[_시작일_종료일].{xlsx|zip}`
  - `전체 기간`이거나 기간 미적용 항목(`동물 리스트`, `직원 계정 관리`)만 골랐으면 날짜를 붙이지 않는다.

# 기대 오류 동작

- 413 → 서버 `message`를 오류 토스트로 보여 준다(최대 건수 초과, 첨부파일 총용량 초과). Figma에 없는 상태다.
- 400·500·네트워크·시간 초과 → 오류 토스트 `엑셀 파일 생성에 실패했습니다`(Figma `2995:25804`).
- 403은 공통 인터셉터(재발급 → 실패 시 `/login`)가 처리한다.
- 실패해도 선택한 항목·기간·형식은 그대로 두고 다시 시도할 수 있다.

# 캐시 갱신 기대

- 서버 데이터를 바꾸지 않아 무효화할 query가 없다. 받은 파일을 캐시하지 않는다.
- 조회 API지만 사용자가 버튼을 눌렀을 때만 보내고 파일을 저장하는 동작이므로 퍼블리싱 spec의 mutation을 유지한다.

# 페이지 이동 또는 사용자 알림

- 페이지 이동 없음.
- 요청 중에는 버튼을 비활성화한다. 라벨은 그대로 둔다(퍼블리싱 spec).
- 성공하면 토스트 `엑셀 파일을 내려받았습니다`(Figma `2995:25578`).
- 엑셀 토스트는 폭 440px에서 시작해 문구에 맞춰 늘어나고 아이콘과 글자 간격은 12px이다(Figma `excel / 토스트`).

# 비고 및 제약

- 실제 서버 테스트는 비활성화한다.
- 공통 axios `timeout` 10초를 이 요청만 5분으로 늘린다. 서버가 첨부파일까지 받아 파일을 만들기 때문이다.
- `types`는 `types=A&types=B`로 보낸다(`getDocuments`와 같음).
- 파일 형식 카드와 항목 10개 격자는 2026-11-02 갱신된 Figma를 따른다. 서버에 휴관일 내보내기 값이 없어 `휴관일 관리`는 항목에서 뺐다. 퍼블리싱 spec·시나리오를 함께 고치고 퍼블리싱 재승인을 받는다.

# 확인이 필요한 명세 항목

1. Notion 명세 DB에 이 API를 추가해 달라.
2. 접근 역할·응답 필드 필수 여부가 Swagger에 없다. BE 코드 `hasRole("APP_ADMIN")`을 근거로 ADMIN, 오류 필드는 필수로 둔다.
3. CORS `exposedHeaders`에 `Content-Disposition`을 넣으면 서버 파일 이름을 그대로 쓸 수 있다.
4. Figma `선택한 기간에 데이터가 없습니다` 토스트(`2995:25691`)는 구현하지 못했다. 서버가 데이터가 없어도 200과 헤더만 있는 파일을 돌려줘 화면이 구분할 수 없다. 구분할 응답이 필요하다.
5. 관찰일지는 화면 문구가 `관찰일 기준`인데 서버는 작성일시(`createdAt`)로 거른다. 업무보고 `제출일 기준`도 `createdAt`이다. 같은 뜻인지 확인 필요.
