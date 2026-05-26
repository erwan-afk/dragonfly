import Logo from '@/components/icons/Logo';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getAuthTypes,
  getViewTypes,
  getDefaultSignInView,
  getRedirectMethod
} from '@/utils/auth-helpers/settings';
import Card from '@/components/ui/Card';
import PasswordSignIn from '@/components/ui/AuthForms/PasswordSignIn';
import EmailSignIn from '@/components/ui/AuthForms/EmailSignIn';
import Separator from '@/components/ui/AuthForms/Separator';
import OauthSignIn from '@/components/ui/AuthForms/OauthSignIn';
import ForgotPassword from '@/components/ui/AuthForms/ForgotPassword';
import UpdatePassword from '@/components/ui/AuthForms/UpdatePassword';
import SignUp from '@/components/ui/AuthForms/Signup';
import AuthTabs from '@/components/ui/AuthForms/AuthTabs';
import { FloatingPaths } from '@/components/ui/FloatingPaths';

export default async function SignIn({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { disable_button: boolean };
}) {
  const { allowOauth, allowPassword } = getAuthTypes();
  const viewTypes = getViewTypes();
  const redirectMethod = getRedirectMethod();

  // Declare 'viewProp' and initialize with the default value
  let viewProp: string;

  // Assign url id to 'viewProp' if it's a valid string and ViewTypes includes it
  if (typeof params.id === 'string' && viewTypes.includes(params.id)) {
    // Redirect old unified views to the main signin page
    if (params.id === 'password_signin' || params.id === 'signup') {
      return redirect('/signin');
    }
    viewProp = params.id;
  } else {
    const preferredSignInView =
      cookies().get('preferredSignInView')?.value || null;
    viewProp = getDefaultSignInView(preferredSignInView);
    return redirect(`/signin/${viewProp}`);
  }

  // Check if the user is already logged in and redirect to the account page if so
  let user = null;
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    user = session?.user || null;
  } catch (error) {
    console.error('Error getting user session:', error);
  }

  if (user && viewProp !== 'update_password') {
    return redirect('/account');
  } else if (!user && viewProp === 'update_password') {
    return redirect('/signin/password_signin');
  }

  return (
    <div className="relative h-[700px] md:overflow-hidden lg:grid lg:grid-cols-2 max-w-screen-xl mx-auto px-16 xl:px-0">
      <div className="relative hidden h-full flex-col border-r bg-oceanblue p-10 lg:flex rounded-xl">
        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">
              &ldquo;This Platform has helped me to save time and serve my
              clients faster than ever before.&rdquo;
            </p>
            <footer className="font-mono font-semibold text-sm">
              ~ 3Hulls User
            </footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>
      <div className="relative flex flex-col justify-center ">
        <div
          aria-hidden
          className="-z-10 absolute inset-0 isolate opacity-60 contain-strict"
        >
          <div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-140 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
        </div>

        <div className="mx-auto space-y-4 w-full px-4 sm:px-0 sm:w-sm">
          <Logo className="h-5  lg:hidden" />

          <div className="space-y-2">
            {/* password_signin and signup now redirect to /signin/auth - this should not be reached */}

            {/* Keep individual forms for other views - with consistent styling */}
            {viewProp === 'email_signin' && (
              <div className="w-full sm:w-[420px] shadow-xl bg-white rounded-xl border-2 border-oceanblue/20 overflow-hidden">
                <div className="overflow-hidden p-8">
                  <EmailSignIn
                    allowPassword={allowPassword}
                    redirectMethod={redirectMethod}
                    disableButton={searchParams.disable_button}
                  />
                </div>
              </div>
            )}
            {viewProp === 'forgot_password' && (
              <div className="w-full sm:w-[420px] shadow-xl bg-white rounded-xl border-2 border-oceanblue/20 overflow-hidden">
                <div className="overflow-hidden p-8">
                  <ForgotPassword
                    redirectMethod={redirectMethod}
                    disableButton={searchParams.disable_button}
                  />
                </div>
              </div>
            )}
            {viewProp === 'update_password' && (
              <div className="w-full sm:w-[420px] shadow-xl bg-white rounded-xl border-2 border-oceanblue/20 overflow-hidden">
                <div className="overflow-hidden p-8">
                  <UpdatePassword redirectMethod={redirectMethod} />
                </div>
              </div>
            )}

            {/* OAuth for non-tab views */}
            {viewProp !== 'update_password' &&
              viewProp !== 'password_signin' &&
              viewProp !== 'signup' &&
              allowOauth && (
                <>
                  <Separator text="Or" />
                  <OauthSignIn />
                </>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
