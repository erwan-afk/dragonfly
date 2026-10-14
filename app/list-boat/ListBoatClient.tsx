'use client';

import BoatListingFormV2 from '@/components/ui/BoatListingForm/BoatListingFormV2';

export default function ListBoatClient({
  user,
  preference,
  initialBoatId,
  products
}: {
  user: any;
  preference: string | null;
  initialBoatId?: string | null;
  products: any[];
}) {
  return (
    <section className="bg-fullwhite">
      <div className="max-w-screen-xl mx-auto">
        <BoatListingFormV2
          user={user}
          products={products}
          preference={preference}
          initialBoatId={initialBoatId}
        />
      </div>
    </section>
  );
}


