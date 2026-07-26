# Shared Frontend Code Rules

퍼블리싱 하네스와 API 하네스가 함께 사용하는 프론트엔드 코드 규칙이다. 저장소의 실제 설정과 코드가 이 문서보다 우선한다.

## 1. FSD 레이어와 import 방향

- 레이어 배치와 import 방향의 기계적 기준은 `eslint.config.js`이다.
- 현재 레이어는 `src/{app,pages,features,entities,shared}`이며 정확한 허용 방향은 ESLint 결과를 따른다.

## 2. 스타일

- 스타일은 Emotion의 `styled` 또는 `css`로 작성한다.
- 제품 의미가 있는 solid color와 공통 font family는 기존 theme을 우선한다.
- 치수와 문맥 한정 값은 해당 Emotion 스타일에 작성한다.
- 인라인 `style={{}}`와 임의 CSS 파일을 추가하지 않는다.

## 3. 서버 상태와 클라이언트 상태

- 서버 데이터 fetching과 캐시는 TanStack Query의 `useQuery` 또는 `useMutation`을 사용한다.
- `useEffect`에서 HTTP 요청을 직접 실행하지 않는다.
- 서버 데이터를 Zustand에 복제하지 않는다.
- Zustand는 전역 UI 상태와 client-only 상태에만 사용한다.

## 4. HTTP

- 공통 Axios 인스턴스는 `src/shared/api/axios.ts`이다.
- 새 Axios 인스턴스, raw `axios` 호출, raw `fetch`를 추가하지 않는다.
- 컴포넌트에서 HTTP 요청을 직접 호출하지 않는다.

## 5. 라우팅

- 화면 이동은 React Router의 `Link` 또는 `useNavigate`를 사용한다.
- `window.location`을 직접 조작하지 않는다.

## 6. TypeScript

- 컴포넌트 props와 API request/response 타입을 명시한다.
- `any`와 `@ts-ignore`를 사용하지 않는다.
- `verbatimModuleSyntax: true`이므로 타입 전용 import는 `import type`을 사용한다.
- API request와 response 타입은 분리한다.
- optional과 nullable을 구분한다.

## 7. 컴포넌트 파일 구조

1. imports
2. 타입과 인터페이스
3. named function 컴포넌트
4. 훅 호출
5. 파생값
6. 이벤트 핸들러와 로컬 함수
7. JSX return
8. styled 정의와 순수 헬퍼

- 훅은 컴포넌트 본문 최상단에서 조건 없이 호출한다.
- 컴포넌트 안에서 styled 컴포넌트를 만들지 않는다.
- 한 파일에 컴포넌트 하나를 기본으로 한다.

## 8. 재사용

- 새 코드를 만들기 전에 유사한 기존 컴포넌트, 훅, API 모듈, 타입, Query Key 패턴을 검색한다.
- shared 코드는 도메인 타입에 의존하지 않는다.
- 복제와 성급한 공통화 모두 피하고 실제 중복과 책임 경계를 근거로 결정한다.

## 9. 검증

- 테스트 삭제, lint 완화, typecheck 제외, 오류 숨기기, 승인 게이트 우회로 검증을 통과시키지 않는다.
- 변경 범위의 표적 검증 후 `yarn lint`, `yarn typecheck`, `yarn build`를 수행한다.
