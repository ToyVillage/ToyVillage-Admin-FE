import styled from '@emotion/styled'
import { Skeleton, SkeletonStatus } from '@/shared/ui'
import { LoginBrandPanel } from './ui/LoginBrandPanel'
import {
  LoginBrand,
  LoginCard,
  LoginCardArea,
  LoginPageLayout,
} from './ui/LoginLayout'

// Figma `login (skeleton)`(yot 2963:25076). 로그인 화면 코드(청크)를 받는 동안 보인다.
// 로그인 화면은 조회가 없어 이 스켈레톤이 화면의 유일한 대기 상태다.
export function LoginPageSkeleton() {
  return (
    <SkeletonStatus>
      <LoginPageLayout>
        <LoginBrandPanel loading />
        <LoginCardArea>
          <LoginCard>
            <LoginBrand>
              <Skeleton width={136} height={114} radius={20} />
              <HeadingGroup>
                <TitleLine>
                  <Skeleton width={110} height={32} />
                </TitleLine>
                <DescriptionLines>
                  <Skeleton width="100%" height={19} />
                  <Skeleton width="100%" height={19} />
                </DescriptionLines>
              </HeadingGroup>
            </LoginBrand>
            <Form>
              <Field>
                <LabelLine>
                  <Skeleton width={61} height={17} />
                </LabelLine>
                <Skeleton width="100%" height={64} radius={8} />
              </Field>
              <Field>
                <LabelLine>
                  <Skeleton width={81} height={17} />
                </LabelLine>
                <Skeleton width="100%" height={64} radius={8} />
              </Field>
              <SubmitButton>
                <Skeleton width="100%" height={78} radius={0} />
              </SubmitButton>
            </Form>
          </LoginCard>
        </LoginCardArea>
      </LoginPageLayout>
    </SkeletonStatus>
  )
}

const HeadingGroup = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`

const TitleLine = styled.div`
  padding: 8px 0;
`

const DescriptionLines = styled.div`
  display: flex;
  width: 100%;
  padding: 5px 0;
  flex-direction: column;
  gap: 10px;
`

// 로그인 폼과 같은 자리(카드 위 324px)에 둔다.
const Form = styled.div`
  position: absolute;
  top: 324px;
  left: 40px;
  display: flex;
  width: 640px;
  flex-direction: column;

  @media (max-width: 767px) {
    position: static;
    width: 100%;
    margin-top: 32px;
  }
`

// 실제 폼처럼 오류 문구 자리까지 높이를 잡는다. Figma 스켈레톤(454px)보다 두 번째 칸이 30px 아래지만,
// 스켈레톤이 걷힐 때 비밀번호 칸이 내려가지 않게 실제 화면에 맞춘다.
const Field = styled.div`
  display: flex;
  min-height: 160px;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 767px) {
    min-height: 136px;
  }
`

const LabelLine = styled.div`
  padding: 5px 0 4px;
`

// 로그인 버튼처럼 위쪽에만 테두리가 있다.
const SubmitButton = styled.div`
  overflow: hidden;
  margin-top: 68px;
  border-top: 1px solid ${({ theme }) => theme.colors.dialogBorder};
  border-radius: 12px;

  @media (max-width: 767px) {
    margin-top: 32px;
  }
`
