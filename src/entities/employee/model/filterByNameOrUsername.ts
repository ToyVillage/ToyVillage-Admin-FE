interface NamedPerson {
  name: string
  username: string
}

// 이름 또는 아이디에 검색어가 든 사람만 남긴다(대소문자·앞뒤 공백 무시).
export function filterByNameOrUsername<T extends NamedPerson>(
  people: T[],
  keyword: string,
): T[] {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return people

  return people.filter(
    (person) =>
      person.name.toLowerCase().includes(needle) ||
      person.username.toLowerCase().includes(needle),
  )
}
