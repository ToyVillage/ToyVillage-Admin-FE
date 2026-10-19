// 클릭 기록은 누른 요소를 `button[aria-label="홍길동 삭제"]`처럼 속성 값을 그대로 이어 붙여 만든다.
// 라벨에 직원·파일 이름이 들어가고, 값에 `"]` 가 섞이면 문자열에서 값만 잘라낼 수 없다.
// 그래서 라벨 속성이 보이면 문자열을 버리고 라벨 값 없이 다시 만든다.
const labelAttributes = ['aria-label', 'title', 'alt']

export function hasLabel(message: string): boolean {
  return labelAttributes.some((name) => message.includes(`[${name}=`))
}

// 태그·id·class·type·name 은 값을 남기고, 라벨 속성은 이름만 남긴다.
export function describeNode(
  tagName: string,
  getAttribute: (name: string) => string | null,
): string {
  let text = tagName.toLowerCase()
  const id = getAttribute('id')
  if (id) text += `#${id}`
  const className = getAttribute('class')?.trim()
  if (className) text += `.${className.split(/\s+/).join('.')}`
  for (const name of ['type', 'name']) {
    const value = getAttribute(name)
    if (value) text += `[${name}="${value}"]`
  }
  for (const name of labelAttributes) {
    if (getAttribute(name) !== null) text += `[${name}]`
  }

  return text
}
