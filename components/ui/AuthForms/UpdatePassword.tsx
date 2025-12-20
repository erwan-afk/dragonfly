'use client';

import Button from '@/components/ui/Button';
import { updatePassword } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import Input from '@/components/ui/Input/Input';

interface UpdatePasswordProps {
  redirectMethod: string;
}

export default function UpdatePassword({
  redirectMethod
}: UpdatePasswordProps) {
  const router = redirectMethod === 'client' ? useRouter() : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    await handleRequest(e, updatePassword, router);
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col space-y-1 mb-8">
        <h1 className="font-bold text-oceanblue text-40 tracking-wide">
          Update Password
        </h1>
        <p className="text-base text-darkgrey">
          Update your password
        </p>
      </div>
      <form
        noValidate={true}
        className="mb-4"
        onSubmit={(e) => handleSubmit(e)}
      >
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Input
              id="password"
              label="New Password"
              placeholder="Password"
              type="password"
              name="password"
              autoComplete="current-password"
            />
            <Input
              id="passwordConfirm"
              label="Confirm New Password"
              placeholder="Password"
              type="password"
              name="passwordConfirm"
              autoComplete="current-password"
            />
          </div>
          <Button
            text="Update Password"
            type="submit"
            loading={isSubmitting}
            anim_disabled
          />
        </div>
      </form>
    </div>
  );
}
