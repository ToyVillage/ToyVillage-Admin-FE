import { useState } from 'react'
import styled from '@emotion/styled'
import { useMutation } from '@tanstack/react-query'
import {
  excelExportTargetOptions,
  requestMockExcelExport,
  type ExcelExportTarget,
} from '@/entities/excel-export'
import {
  applyPeriodPreset,
  formatPeriodSummary,
  initialExportPeriod,
  type ExportPeriod,
  type ExportPeriodPreset,
} from '../lib/exportPeriod'
import { ExportPeriodField } from './ExportPeriodField'
import { ExportSummary } from './ExportSummary'
import { ExportTargetGrid } from './ExportTargetGrid'

// 엑셀 다운로드 화면의 항목·기간 선택과 다운로드 요청.
// 다른 화면에 갔다 오면 처음 상태로 돌아간다(선택을 저장하지 않음).
export function ExcelExportForm() {
  const [selectedTargets, setSelectedTargets] = useState<ExcelExportTarget[]>(
    [],
  )
  const [period, setPeriod] = useState<ExportPeriod>(() =>
    initialExportPeriod(),
  )
  // 실제 API 연동 전에는 mock 경계만 호출한다.
  const exportMutation = useMutation({ mutationFn: requestMockExcelExport })

  const disabledReason = getDisabledReason(selectedTargets.length, period)

  function toggleTarget(target: ExcelExportTarget) {
    setSelectedTargets((current) =>
      current.includes(target)
        ? current.filter((item) => item !== target)
        : sortTargets([...current, target]),
    )
  }

  // 하나도 없을 때만 모두 고르고, 일부·전부 골랐으면 모두 해제한다(업무지시 담당자 선택과 같음).
  function toggleAllTargets() {
    setSelectedTargets((current) =>
      current.length === 0
        ? excelExportTargetOptions.map((option) => option.id)
        : [],
    )
  }

  function changePreset(preset: ExportPeriodPreset) {
    setPeriod((current) => applyPeriodPreset(preset, current.startDate))
  }

  // 날짜를 직접 바꾸면 기간 버튼은 `직접 선택`이 된다.
  // 시작일이 종료일보다 뒤면 종료일을 비워 다시 고르게 한다.
  function changeStartDate(date: string) {
    setPeriod((current) => ({
      preset: 'custom',
      startDate: date,
      endDate: current.endDate && current.endDate < date ? null : current.endDate,
    }))
  }

  function changeEndDate(date: string) {
    setPeriod((current) => ({ ...current, preset: 'custom', endDate: date }))
  }

  function download() {
    if (disabledReason || exportMutation.isPending) return
    const allPeriod = period.preset === 'all'
    exportMutation.mutate({
      targets: selectedTargets,
      startDate: allPeriod ? null : period.startDate,
      endDate: allPeriod ? null : period.endDate,
    })
  }

  return (
    <Form>
      <ExportTargetGrid
        selectedTargets={selectedTargets}
        onToggle={toggleTarget}
        onToggleAll={toggleAllTargets}
      />
      <Bottom>
        <ExportPeriodField
          period={period}
          onPresetChange={changePreset}
          onStartDateChange={changeStartDate}
          onEndDateChange={changeEndDate}
        />
        <ExportSummary
          selectedCount={selectedTargets.length}
          periodLabel={formatPeriodSummary(period)}
          disabledReason={disabledReason}
          pending={exportMutation.isPending}
          onDownload={download}
        />
      </Bottom>
    </Form>
  )
}

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`

// Figma 기간 카드(860)와 요약 카드(428) 사이 32px. 높이는 둘 중 큰 쪽에 맞춘다.
const Bottom = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 860fr) minmax(0, 428fr);
  gap: 32px;

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

// 비활성 이유는 위에서부터 먼저 맞는 하나만 보여 준다.
function getDisabledReason(
  selectedCount: number,
  period: ExportPeriod,
): string | null {
  if (selectedCount === 0) return '항목을 1개 이상 선택해주세요'
  if (period.preset === 'all') return null
  if (!period.startDate) return '시작일을 선택해주세요'
  if (!period.endDate) return '종료일을 선택해주세요'
  return null
}

function sortTargets(targets: ExcelExportTarget[]): ExcelExportTarget[] {
  return excelExportTargetOptions
    .map((option) => option.id)
    .filter((id) => targets.includes(id))
}
