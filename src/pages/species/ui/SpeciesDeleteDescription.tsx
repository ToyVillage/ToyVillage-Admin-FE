interface SpeciesDeleteDescriptionProps {
  target: 'species' | 'individual'
}

// 삭제 확인 모달 본문. 종은 Figma `609:14119`, 개체는 `610:14119` 문구다(하위 기록 연쇄 삭제 안내).
export function SpeciesDeleteDescription({
  target,
}: SpeciesDeleteDescriptionProps) {
  return (
    <>
      {target === 'species'
        ? '등록된 개체와 관찰 기록도 함께 삭제되며'
        : '등록된 관찰 기록도 함께 삭제되며'}
      <br />
      삭제 후에는 복구할 수 없습니다
    </>
  )
}
