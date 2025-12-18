'use client';

import BoatListingFormV2 from '@/components/ui/BoatListingForm/BoatListingFormV2';

export default function ListBoatClient({
  user,
  preference,
  products
}: {
  user: any;
  preference: string | null;
  products: any[];
}) {
  return (
    <section className="bg-fullwhite">
      <div className="max-w-screen-xl mx-auto">
        <BoatListingFormV2 user={user} products={products} preference={preference} />
      </div>
    </section>
  );
}


