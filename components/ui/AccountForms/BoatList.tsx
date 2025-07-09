'use client';

import { useRouter } from 'next/navigation';
import { Tables } from '@/types_db';
type Boat = Tables<'boats'>; // Type pour les données de la table 'boats'

export default function BoatList({ boats }: { boats: Boat[] }) {
  const router = useRouter();

  function handleEdit(boatId: string) {
    router.push(`/edit-listing/${boatId}`);
  }

  return (
    <ul className="space-y-4">
      {boats.map((boat) => (
        <li key={boat.id} className="p-4 bg-zinc-800 rounded-md">
          <h3 className="text-xl font-semibold text-white">{boat.model}</h3>
          <p className="text-zinc-400">{boat.description}</p>
          <p className="text-white">Price: ${boat.price}</p>
          <button
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={() => handleEdit(String(boat.id))}
          >
            Edit
          </button>
        </li>
      ))}
    </ul>
  );
}
