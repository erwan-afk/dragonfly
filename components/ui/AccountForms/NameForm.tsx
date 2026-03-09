'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateName } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';

export default function NameForm({ userName }: { userName: string | null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentName, setCurrentName] = useState(userName);
  const [inputValue, setInputValue] = useState(userName ?? '');

  const hasChanged =
    inputValue.trim() !== '' && inputValue.trim() !== (currentName ?? '');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const newName = inputValue.trim();

    if (!newName) {
      setErrorMessage('Please enter a valid name');
      setIsSubmitting(false);
      return;
    }

    if (!hasChanged) {
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await handleRequest(e, updateName, router);

      if (result.success === false) {
        setErrorMessage(result.error || 'Error updating name');
      } else {
        setCurrentName(newName);
        router.push('/account?status=Success!');
      }
    } catch (err) {
      console.error('Error submitting name:', err);
      setErrorMessage('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="nameForm" onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="block text-oceanblue text-14 font-medium">
        Your name
      </label>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-articblue/10 flex items-center justify-center text-articblue text-14 font-semibold shrink-0">
          {(currentName ?? 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-oceanblue text-16 font-medium">
            {currentName || 'No name set'}
          </span>
        </div>
      </div>

      <input
        className="w-full p-3 border border-lightgrey rounded-lg focus:outline-none focus:border-articblue text-oceanblue text-14"
        name="fullName"
        placeholder="Enter your new name"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        maxLength={64}
      />

      <div className="flex items-center justify-between">
        <p className="text-12 text-darkgrey/50">64 characters maximum</p>
        <span className="text-12 text-darkgrey/50">{inputValue.length}/64</span>
      </div>

      {errorMessage && (
        <p className="text-red-500 text-13 bg-red-50 px-3 py-2 rounded-lg">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !hasChanged}
        className="text-fullwhite bg-oceanblue w-fit px-4 py-2 rounded-full text-14 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {isSubmitting ? 'Updating...' : 'Update name'}
      </button>
    </form>
  );
}
