'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@heroui/input';
import { updateName } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import Button from '../Button/Button';

export default function NameForm({ userName }: { userName: string | null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const newName = e.currentTarget.fullName.value.trim();
    console.log('Nouveau nom saisi:', newName);

    if (!newName) {
      setErrorMessage('Veuillez entrer un nom valide');
      setIsSubmitting(false);
      return;
    }

    if (newName === userName) {
      console.log('Le nom est inchangé, annulation...');
      setIsSubmitting(false);
      return;
    }

    console.log('Envoi de la requête pour:', newName);

    try {
      const result = await handleRequest(e, updateName, router);
      console.log('Résultat de handleRequest:', result);

      if (result.success === false) {
        setErrorMessage(result.error || 'Erreur lors de la mise à jour du nom');
      } else {
        console.log('Nom mis à jour avec succès, redirection...');
        router.push('/account?status=Success!');
      }
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      setErrorMessage('Une erreur inattendue est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="nameForm" onSubmit={handleSubmit} className="flex flex-col">
      <div className=" font-semibold">
        <label className="block text-oceanblue text-14 font-medium mb-2">
          Change your name
        </label>
        <input
          className="w-full p-3 border border-lightgrey rounded-lg focus:outline-none focus:border-articblue text-oceanblue text-14 font-normal"
          name="fullName"
          placeholder="Enter your full name"
          defaultValue={userName ?? ''}
          maxLength={64}
        />
      </div>

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      <div className="flex flex-col justify-between gap-8">
        <p className="text-[12px] text-oceanblue">64 characters maximum</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className={` text-fullwhite bg-oceanblue w-fit px-[10px] py-[5px] rounded-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Updating...' : 'Update your name'}
        </button>
      </div>
    </form>
  );
}
