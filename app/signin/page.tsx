import AuthTabs from '@/components/ui/AuthForms/AuthTabs';
import SignInWrapper from '@/components/ui/SignInWrapper';

// Add metadata to help with loading
export const metadata = {
  title: 'Sign In - Dragonfly'
};

export default function SignIn() {
  return (
    <SignInWrapper>
      <AuthTabs defaultMode="login" />
    </SignInWrapper>
  );
}
