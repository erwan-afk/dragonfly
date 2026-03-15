'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Lock } from 'lucide-react';
import Input from '@/components/ui/Input/Input';
import Button from '@/components/ui/Button';
import SignInWrapper from '@/components/ui/SignInWrapper';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token: token!,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message || 'An error occurred.' });
      } else {
        setMessage({ type: 'success', text: 'Password reset successfully! Redirecting...' });
        setTimeout(() => router.push('/signin'), 2000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. The link may have expired.' });
    }

    setIsSubmitting(false);
  };

  return (
    <SignInWrapper>
      <div className="flex flex-col w-full">
        <div className="flex flex-col space-y-1 mb-8 pb-32">
          <h1 className="font-bold text-oceanblue text-24 lg:text-40 text-center">
            {token ? 'New Password' : 'Invalid Link'}
          </h1>
          <p className="text-base text-darkgrey text-center">
            {token
              ? 'Enter your new password below'
              : 'This reset link is invalid or has expired'}
          </p>
        </div>

        <div className="w-full sm:w-[420px] max-w-full overflow-hidden">
          <div className="overflow-hidden p-8">
            {!token ? (
              <div className="text-center">
                <Button
                  text="Request New Link"
                  onClick={() => router.push('/signin')}
                />
              </div>
            ) : (
              <>
                {message && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-sm ${
                      message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <form noValidate onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-4">
                    <Input
                      id="password"
                      placeholder="New password"
                      type="password"
                      name="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      startContent={<Lock className="w-5 h-5" />}
                    />
                    <Input
                      id="confirmPassword"
                      placeholder="Confirm password"
                      type="password"
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      startContent={<Lock className="w-5 h-5" />}
                    />
                    <Button
                      text={isSubmitting ? 'Updating...' : 'Update Password'}
                      lowercase
                      type="submit"
                      loading={isSubmitting}
                    />
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </SignInWrapper>
  );
}
