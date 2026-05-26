import AuthTabs from '@/components/ui/AuthForms/AuthTabs';
import SignInWrapper from '@/components/ui/SignInWrapper';

// Add metadata to help with loading
export const metadata = {
  title: 'Sign In - 3Hulls'
};

export default function SignIn({
  searchParams
}: {
  searchParams?: { callbackUrl?: string };
}) {
  const callbackUrl = searchParams?.callbackUrl;
  return (
    <SignInWrapper>
      <AuthTabs defaultMode="login" callbackUrl={callbackUrl} />
    </SignInWrapper>
  );
}
