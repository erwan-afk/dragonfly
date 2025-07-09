'use client'; // Ce composant est interactif

import BoatList from '@/components/ui/AccountForms/BoatList';
import { Tables } from '@/types_db';
type Boat = Tables<'boats'>; // Type pour les données de la table 'boats'

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
