'use client'; // Ce composant est interactif

import BoatList from '@/components/ui/AccountForms/BoatList';
import { Boat } from '@/types/database';

export default function MyListings({ boats }: { boats: Boat[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Your Listings</h2>
      {boats.length === 0 ? (
        <p className="text-zinc-300">You have no listings yet.</p>
      ) : (
        <BoatList boats={boats} />
      )}
    </div>
  );
}
