'use client';

import React from 'react';
import PasswordSignIn from './PasswordSignIn';
import SignUp from './Signup';
import OauthSignIn from './OauthSignIn';
import ForgotPassword from './ForgotPassword';
import { getAuthTypes, getRedirectMethod } from '@/utils/auth-helpers/settings';

interface AuthTabsProps {
  allowOauth?: boolean;
  allowPassword?: boolean;
  defaultMode?: 'login' | 'signup' | 'forgot_password';
  callbackUrl?: string;
}

export default function AuthTabs({
  allowOauth,
  allowPassword,
  defaultMode = 'login',
  callbackUrl
}: AuthTabsProps) {
  const [mode, setMode] = React.useState<'login' | 'signup' | 'forgot_password'>(defaultMode);
  const redirectMethod = getRedirectMethod();

  // Get auth types if not provided
  const authTypes =
    allowOauth !== undefined && allowPassword !== undefined
      ? { allowOauth, allowPassword }
      : getAuthTypes();

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex flex-col space-y-1 mb-8 pb-32">
        <h1 className="font-bold text-oceanblue text-40 text-center">
          {mode === 'signup' ? 'Welcome!' : mode === 'forgot_password' ? 'Reset Password' : 'Nice to see you!'}
        </h1>
        <p className="text-base text-darkgrey text-center">
          {mode === 'signup'
            ? 'Create your 3Hulls account'
            : mode === 'forgot_password'
              ? "Enter your email and we'll send you a reset link"
              : 'Sign in to your account'}
        </p>
      </div>

      <div className="w-full max-w-[420px] overflow-hidden">
        <div className="overflow-hidden p-8">
          <div className="flex flex-col gap-4">
            {/* OAuth buttons */}
            {authTypes.allowOauth && mode !== 'forgot_password' && (
              <div className="flex flex-col gap-4">
                <OauthSignIn callbackUrl={callbackUrl} />
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-oceanblue/20"></div>
                  <span className="text-sm text-oceanblue/60 font-medium">
                    {mode === 'signup'
                      ? 'Or continue with Email'
                      : 'Or log in with your Email'}
                  </span>
                  <div className="flex-1 h-px bg-oceanblue/20"></div>
                </div>
              </div>
            )}

            {/* Form based on mode */}
            {mode === 'login' && (
              <PasswordSignIn key="login" redirectMethod={redirectMethod} callbackUrl={callbackUrl} />
            )}
            {mode === 'signup' && (
              <SignUp key="signup" redirectMethod={redirectMethod} callbackUrl={callbackUrl} />
            )}
            {mode === 'forgot_password' && (
              <ForgotPassword
                key="forgot"
                redirectMethod={redirectMethod}
                disableButton={false}
                onBackToLogin={() => setMode('login')}
              />
            )}

            {mode === 'login' && (
              <div className="text-center space-y-2">
                <p className="text-16 text-darkgrey">
                  <button
                    type="button"
                    className="text-articblue cursor-pointer hover:underline bg-transparent border-none p-0"
                    onClick={() => setMode('forgot_password')}
                  >
                    Forgot your password?
                  </button>
                </p>
                <p className="text-16 text-darkgrey">
                  New to 3Hulls?{' '}
                  <button
                    type="button"
                    className="text-articblue cursor-pointer hover:underline bg-transparent border-none p-0"
                    onClick={() => setMode('signup')}
                  >
                    Create an account
                  </button>
                </p>
              </div>
            )}

            {mode === 'signup' && (
              <div className="text-center">
                <p className="text-16 text-darkgrey">
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="text-articblue cursor-pointer hover:underline bg-transparent border-none p-0"
                    onClick={() => setMode('login')}
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
