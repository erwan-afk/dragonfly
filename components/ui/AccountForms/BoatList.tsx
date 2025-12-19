'use client';

import { useRouter } from 'next/navigation';
import { Boat } from '@/types/database';
import { getModelLabel } from '@/utils/constants';

export default function BoatList({ boats }: { boats: Boat[] }) {
  const router = useRouter();

  function handleEdit(boatId: string) {
    router.push(`/edit-listing/${boatId}`);
  }

  // Fonction pour formater la date d'expiration
  function formatExpiryDate(expiresAt: Date | null): string {
    if (!expiresAt) return 'Date not set';

    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const formattedDate = expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    if (daysUntilExpiry < 0) {
      return `${formattedDate} (Expired)`;
    } else if (daysUntilExpiry === 0) {
      return `${formattedDate} (Expires today)`;
    } else if (daysUntilExpiry === 1) {
      return `${formattedDate} (Expires in 1 day)`;
    } else if (daysUntilExpiry <= 7) {
      return `${formattedDate} (Expires in ${daysUntilExpiry} days)`;
    } else {
      return `${formattedDate} (${daysUntilExpiry} days left)`;
    }
  }

  return (
    <ul className="space-y-4">
      {boats.map((boat) => (
        <li key={boat.id} className="p-4 bg-zinc-800 rounded-md">
          <h3 className="text-xl font-semibold text-white">{getModelLabel(boat.model)}</h3>
          <p className="text-zinc-400">{boat.description}</p>
          <p className="text-white">Price: ${Number(boat.price)}</p>
          <p className="text-zinc-300">
            Expires: {formatExpiryDate(boat.expiresAt)}
          </p>
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
