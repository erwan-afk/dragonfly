import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { Metadata } from 'next';
import { dragonflyModels, currencies } from '@/utils/constants';
import type { Boat } from '@/types/boats';
import BoatImageGallery from '@/components/ui/BoatImageGallery/BoatImageGallery';
import prisma from '@/utils/prisma/client';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { ViewTracker } from './ViewTracker';
import { BoatDetails } from './BoatDetails';
import { normalizeImageUrls } from '@/utils/image-urls';
import { formatPriceNumber } from '@/utils/format-price';
import { buildBoatJsonLd, buildBreadcrumbJsonLd } from '@/utils/json-ld';
import { getVideoEmbedUrl } from '@/utils/video-embed';
import { getURL } from '@/utils/helpers';
import { getModelData } from '@/utils/models-data';
import { getBoatsByModel } from '@/utils/database/products';

const getBoatRow = cache(async (id: string) => {
  const [row] = (await prisma.$queryRaw`
    SELECT b.id, b.model, b.price, b.country, b.description, b.email as boat_email, b.condition, b.year, b.photos, b.user_id, b.product_id, b.created_at, b.updated_at, b.currency, b.specifications, b.vat_paid, b.status, b.expires_at, b.view_count, b.has_extra_photos, b.video_url,
           u.name as user_name, u.full_name as user_full_name, u.email as user_email, u.avatar_url as user_avatar_url, u.created_at as user_created_at
    FROM "boats" b
    LEFT JOIN "user" u ON b.user_id = u.id
    WHERE b.id = ${id}
    LIMIT 1
  `) as any[];
  return row ?? null;
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const row = await getBoatRow(params.id);
  if (!row) return { title: 'Listing not found' };

  const modelLabel = dragonflyModels.find((m) => m.key === row.model)?.label || row.model;
  const price = parseFloat(row.price.toString());
  const currencySymbol = currencies.find((c) => c.key === row.currency)?.symbol || row.currency;
  const photos = normalizeImageUrls(row.photos ?? []);
  const ogImage = photos[0] ?? `${getURL()}/images/dragonfly-boat.webp`;
  const pageUrl = getURL(`/boat/${row.id}`);
  const title = row.year
    ? `${modelLabel} ${row.year} — ${formatPriceNumber(price, row.currency)} ${currencySymbol}`
    : `${modelLabel} — ${formatPriceNumber(price, row.currency)} ${currencySymbol}`;
  const description = row.description
    ? String(row.description).slice(0, 160)
    : `${modelLabel} trimaran for sale at ${formatPriceNumber(price, row.currency)} ${currencySymbol}.`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: 'website',
      url: pageUrl,
      title,
      description,
      siteName: '3Hulls',
      images: [{ url: ogImage, width: 1200, height: 630, alt: modelLabel }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage]
    }
  };
}

export default async function BoatPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const viewerUserId = session?.user?.id ?? null;

  const row = await getBoatRow(params.id);

  if (!row) {
    notFound();
  }

  const boat = {
    ...row,
    price: parseFloat(row.price.toString()),
    createdAt: row.created_at,
    user: {
      name: row.user_full_name || row.user_name || null,
      email: row.boat_email || row.user_email,
      avatar_url: row.user_avatar_url
    }
  } as Boat & { status?: string; userId?: string };

  const isActive = (boat as any).status === 'active';
  const isSold = (boat as any).status === 'sold';
  const isOwner = !!viewerUserId && (boat as any).user_id === viewerUserId;

  if (!isActive && !isSold && !isOwner) {
    notFound();
  }

  if (!boat) {
    notFound();
  }

  const formattedDate = boat.createdAt
    ? new Date(boat.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      })
    : 'Unknown';

  const normalizedPhotos = normalizeImageUrls(boat.photos);
  const defaultImage = '/images/No-image.png';
  const allImages =
    normalizedPhotos.length > 0 ? normalizedPhotos : [defaultImage];

  console.log(`🖼️ Boat ${boat.id} images:`, {
    originalPhotos: boat.photos,
    normalizedPhotos: normalizedPhotos,
    finalImages: allImages
  });

  const modelLabel =
    dragonflyModels.find((model) => model.key === boat.model)?.label ||
    boat.model;

  const jsonLd = buildBoatJsonLd(
    {
      id: boat.id,
      modelLabel,
      year: row.year,
      price: boat.price,
      currency: boat.currency,
      description: boat.description,
      status: (boat as any).status,
      createdAt: boat.createdAt
    },
    allImages
  );

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: getURL('/') },
    { name: 'For Sale', url: getURL('/forsale') },
    { name: modelLabel, url: getURL(`/forsale?model=${boat.model}`) },
    {
      name: row.year ? `${modelLabel} ${row.year}` : modelLabel,
      url: getURL(`/boat/${boat.id}`)
    }
  ]);

  const modelData = getModelData(boat.model) || {
    key: boat.model,
    name: modelLabel,
    tagline: '',
    yearsProduced: '',
    designer: 'Quorning Boats',
    image: '/images/dragonfly-boat.webp',
    overview: [],
    history: [],
    sailing: '',
    audience: '',
    specs: []
  };

  const [similarBoatsRaw, favorite, listingsCount] = await Promise.all([
    getBoatsByModel(boat.model, 4),
    viewerUserId
      ? prisma.favorite.findUnique({
          where: { userId_boatId: { userId: viewerUserId, boatId: boat.id } }
        })
      : Promise.resolve(null),
    prisma.boat.count({ where: { userId: (boat as any).user_id, status: 'active' } })
  ]);

  const similarBoats = similarBoatsRaw.filter((b: any) => b.id !== boat.id).slice(0, 3);
  const sellerMemberSinceYear = row.user_created_at ? new Date(row.user_created_at).getFullYear() : null;

  return (
    <section id="Boats" className="w-full pb-[64px] lg:pb-[128px] bg-fullwhite">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ViewTracker boatId={boat.id} />

      <div className="mx-auto max-w-screen-xl flex flex-col gap-[32px] lg:gap-[56px]">
        <BoatImageGallery images={allImages} boatModel={boat.model} />

        {(() => {
          const embedUrl = getVideoEmbedUrl((row as any).video_url);
          if (!embedUrl) return null;
          return (
            <div className="w-full mt-16">
              <iframe
                src={embedUrl}
                title="Listing video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full aspect-video rounded-12 border border-stonegrey/30"
              />
            </div>
          );
        })()}

        <BoatDetails
          boat={{
            id: boat.id,
            model: boat.model,
            price: boat.price,
            currency: boat.currency,
            description: boat.description,
            country: boat.country,
            specifications: boat.specifications,
            user: boat.user
          }}
          year={row.year}
          formattedDate={formattedDate}
          condition={row.condition}
          isSold={isSold}
          isOwner={isOwner}
          isActive={isActive}
          viewCount={row.view_count || 0}
          model={modelData}
          similarBoats={similarBoats}
          sellerMemberSinceYear={sellerMemberSinceYear}
          sellerListingsCount={listingsCount}
          isFavoritedInitial={!!favorite}
          isAuthenticated={!!viewerUserId}
        />
      </div>
    </section>
  );
}
