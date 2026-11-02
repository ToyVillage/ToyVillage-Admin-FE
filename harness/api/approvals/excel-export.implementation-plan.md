# Implementation Plan — excel-export

## 승인 기준

- `GET /excel`, Bearer, ADMIN. Swagger 대조 차이 0건. Notion 명세 없음.
- 실제 서버 테스트 disabled.

## 재사용할 기존 코드

- `api`(`src/shared/api/axios.ts`), `paramsSerializer: { indexes: null }`(`getDocuments` 선례)
- `downloadFile`(`src/shared/ui/fileAttachment.ts`), `Toast`(`src/shared/ui`)
- `ExportTargetCard`의 카드 스타일, `ExportCheckbox`의 native input 방식

## 변경 파일

- 신규 `src/entities/excel-export/api/types.ts` — `ExcelExportType`, `ExcelExportMode`, `ExcelExportQuery`(요청 타입).
- 신규 `src/entities/excel-export/api/exportExcel.ts` — `exportExcel(query): Promise<Blob>`, `readExcelExportErrorMessage(error)`.
- `src/entities/excel-export/model/targets.ts` — Figma 항목 10개로 교체하고 `dated` 추가. 항목 id를 서버 `types` 값으로 바꿔 대응 표를 두지 않는다.
- `src/entities/excel-export/model/types.ts` — 옵션 타입 갱신, `ExcelExportRequest`에 `mode` 추가.
- 삭제 `src/entities/excel-export/model/mock.ts`, `src/entities/excel-export/index.ts` 갱신.
- 신규 `src/features/export-excel/lib/exportFileName.ts` — 파일 이름 생성.
- `src/features/export-excel/ui/ExcelExportForm.tsx` — mutation 교체, 파일 저장, 성공·실패 토스트, 형식 상태.
- `src/shared/ui/Toast.tsx` — 선택 prop `fitContent` 추가. 폭을 문구에 맞추고 간격을 12px로 한다. 기본값은 지금과 같아 다른 화면은 바뀌지 않는다.
- `src/features/export-excel/ui/ExportTargetGrid.tsx` — 항목 격자를 5열로 변경(Figma `2995:25186`). 1384px 이하는 2열.
- `src/features/export-excel/ui/ExportTargetCard.tsx` — padding `24px 20px`, 간격 12px(Figma 항목 232px).
- 신규 `src/features/export-excel/ui/ExportFormatField.tsx`, `ui/assets/radio-on.svg` — Figma `파일 형식` 카드(`3706:25836`). 에셋은 Figma `radio / on`을 내려받아 쓴다.
- `src/features/export-excel/ui/ExportSummary.tsx` — `선택한 항목`과 나란히 `파일 형식` 확장자 표시(Figma `3706:25850`).
- `src/pages/settings/excel-download` — 변경 없음. 카드 순서는 `ExcelExportForm`이 정한다.
- `harness/publishing/specs/excel-download.spec.md`, `harness/publishing/approvals/excel-download.scenario-draft.md` — 변경 시나리오 반영(승인 대상).
- `tests/e2e/excel-download.spec.ts` — 승인 뒤 S2·S4·S6·S15·S16 수정, S17 추가, 퍼블리싱 재동결.
- 신규 `tests/e2e/api/excel-export.spec.ts`.

## 타입과 API 함수

```ts
export async function exportExcel(query: ExcelExportQuery): Promise<Blob> {
  const { data } = await api.get<Blob>('/excel', {
    params: query,
    paramsSerializer: { indexes: null },
    responseType: 'blob',
    timeout: 300_000,
  })
  return data
}
```

- `startDate`·`endDate`가 null이면 파라미터에서 뺀다.
- `readExcelExportErrorMessage`: 413이고 본문 Blob의 JSON에 `message`가 있으면 그 값, 아니면 공통 실패 문구.

## Query/Mutation과 캐시

- `useMutation` 유지. 무효화 없음. 파일을 캐시하지 않는다.
- 성공 시 `downloadFile(fileName, blob)`. 파일 이름은 요청 시점의 선택으로 만든다.

## UI 연결

### 내보낼 항목

- 2026-11-02 갱신된 Figma를 따른다. 10개 항목을 5열로 놓는다. 10개를 모두 고르면 `전체 선택`이 선택 상태이고 요약은 `10개`다.

### 파일 형식

- 2026-11-02 갱신된 Figma를 따른다. `내보낼 항목`과 `기간` 사이의 전체 너비 카드이고, 선택지는 `엑셀 파일 (.xlsx)`(기본), `압축 파일 (.zip)` 2개다. 설명 문구도 Figma 그대로다.
- 이름이 `파일 형식`인 radio group이다. 카드 아무 곳이나 눌러 고른다. 다른 화면에 갔다 오면 기본값으로 돌아간다.
- 요약 카드는 `선택한 항목`과 `파일 형식`(`.xlsx`·`.zip`)을 나란히 보여 준다. 카드 크기는 Figma와 같이 그대로다. 버튼 라벨은 형식과 관계없이 `엑셀 다운로드`다.

### 토스트

- Figma `엑셀 다운로드 · 토스트`(`2983:25078`)를 따른다. 성공 `엑셀 파일을 내려받았습니다`, 실패 `엑셀 파일 생성에 실패했습니다`.
- 413은 Figma에 없어 서버 문구를 그대로 보여 준다.
- 아이콘 모양과 색 그림자는 공통 `Toast`가 Figma와 달라도 이 작업에서 바꾸지 않는다. 다른 화면 전체가 함께 바뀌기 때문이다.

## 검증 순서

1. `yarn harness:api:gate excel-export`
2. `yarn harness:api:policy excel-export <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn harness:verify` 등 style 정책 검사
5. e2e는 로컬에서 실행하지 않는다. `tests/e2e/api/excel-export.spec.ts`와 `tests/e2e/excel-download.spec.ts`는 PR CI 결과로 확인한다.

## STOP 조건과 미해결 질문

승인할 때 함께 확정할 값:

1. Notion에 없는 API — Swagger 기준, 제안 API ID `EXCEL_EXPORT`, 역할 ADMIN, 오류 필드 필수.
2. 요청 시간 초과 5분.
3. 요청 중에는 버튼만 비활성(퍼블리싱 spec 그대로).
4. Figma 데이터 없음 토스트(`2995:25691`)는 미구현. 서버가 데이터 없음을 구분해 주지 않는다.
