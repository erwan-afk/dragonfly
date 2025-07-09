'use client';

import Button from '@/components/ui/Button';
import { updateEmail } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@heroui/input';

export default function EmailForm({ userEmail }: { userEmail: string | null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const newEmail = e.currentTarget.newEmail.value.trim();

    if (newEmail === userEmail) {
      setErrorMessage("L'e-mail est identique à l'ancien.");
      setIsSubmitting(false);
      return;
    }

    const result = await handleRequest(e, updateEmail, router);

    if (result.success === false) {
      setErrorMessage(
        result.error || "Erreur lors de la mise à jour de l'e-mail."
      );
    } else {
      console.log('E-mail mis à jour avec succès.');
      router.refresh();
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col w-full">
      <div className=" font-semibold">
        <form id="emailForm" onSubmit={handleSubmit}>
          <label className="block text-oceanblue text-14 font-medium mb-2">
            Change your email
          </label>
          <input
            defaultValue={userEmail ?? ''}
            type="email"
            name="newEmail"
            className="w-full p-3 border border-lightgrey rounded-lg focus:outline-none focus:border-articblue text-oceanblue text-14 font-normal"
            placeholder="Your new email..."
          />
        </form>
      </div>

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      <div className="flex flex-col justify-between gap-8">
        <p className="text-[12px] text-oceanblue">
          We will send you an e-mail to confirm the change.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`text-fullwhite bg-oceanblue w-fit px-[10px] py-[5px] rounded-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Updating...' : 'Update your email'}
        </button>
      </div>
    </div>
  );
}
