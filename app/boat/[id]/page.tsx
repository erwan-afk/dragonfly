import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { Metadata } from 'next';
import { dragonflyModels, currencies, countries, boatConditions } from '@/utils/constants';
import type { Boat } from '@/types/boats';
import BoatImageGallery from '@/components/ui/BoatImageGallery/BoatImageGallery';
import prisma from '@/utils/prisma/client';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { ViewTracker } from './ViewTracker';
import { ViewStats } from './ViewStats';
import FlagIcon from '@/components/icons/Flag';
import { normalizeImageUrls } from '@/utils/image-urls';
import { formatPriceNumber } from '@/utils/format-price';
import { buildBoatJsonLd } from '@/utils/json-ld';
import { getVideoEmbedUrl } from '@/utils/video-embed';
import { getURL } from '@/utils/helpers';
import { groupSpecsBySection } from '@/utils/specifications';

const getBoatRow = cache(async (id: string) => {
  const [row] = (await prisma.$queryRaw`
    SELECT b.id, b.model, b.price, b.country, b.description, b.email as boat_email, b.condition, b.year, b.photos, b.user_id, b.product_id, b.created_at, b.updated_at, b.currency, b.specifications, b.vat_paid, b.status, b.expires_at, b.view_count, b.has_extra_photos, b.video_url,
           u.name as user_name, u.full_name as user_full_name, u.email as user_email, u.avatar_url as user_avatar_url
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

  const jsonLd = buildBoatJsonLd(
    {
      id: boat.id,
      model: boat.model,
      price: boat.price,
      currency: boat.currency,
      country: boat.country,
      description: boat.description,
      photos: normalizedPhotos,
      condition: row.condition,
      specifications: boat.specifications,
      status: (boat as any).status,
      expiresAt: (boat as any).expires_at,
      createdAt: boat.createdAt,
      user: boat.user
    },
    allImages
  );

  return (
    <section id="Boats" className="w-full pb-[64px] lg:pb-[128px] bg-fullwhite">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker boatId={boat.id} />

      <div className="mx-auto max-w-screen-xl flex flex-col gap-[32px] lg:gap-[56px]">
        {/* Sold banner */}
        {isSold && (
          <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
            <span className="font-bold text-sm tracking-wider uppercase text-red-700">Sold</span>
            <span className="text-14 text-red-600">This boat has been sold and is no longer available.</span>
          </div>
        )}

        {/* Pending banner for owners */}
        {!isActive && !isSold && isOwner && (
          <div className="rounded-[12px] border border-orange-200 bg-orange-50 px-4 py-3 text-oceanblue">
            <div className="font-medium">Payment is being processed</div>
            <div className="text-14 text-darkgrey">
              Your listing will appear publicly as soon as Stripe confirms the
              payment (usually a few seconds). You can refresh this page.
            </div>
          </div>
        )}

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

        <div className="flex flex-col lg:flex-row justify-between gap-32">
          <div className="flex-1 flex flex-col gap-24 lg:gap-48">
            <div className="flex flex-row gap-8 items-center px-2.5 py-1.5 w-fit bg-oceanblue rounded-lg uppercase text-fullwhite">
              {boat.country}{' '}
              {boat.country && (
                <FlagIcon
                  flag={
                    countries.find((country) => country.key === boat.country)
                      ?.flag || ''
                  }
                />
              )}
            </div>
            <div className="gap-16 lg:gap-32 flex flex-col">
              <h1 className="text-articblue leading-[100%] text-32 lg:text-40">
                {dragonflyModels.find((model) => model.key === boat.model)
                  ?.label || boat.model}
                {row.year ? ` — ${row.year}` : ''}
              </h1>

              <h2 className="text-oceanblue leading-[100%] text-24 lg:text-32 font-medium">
                {formatPriceNumber(boat.price, boat.currency)}{' '}
                {currencies.find((currency) => currency.key === boat.currency)
                  ?.symbol || boat.currency}
              </h2>
              <div className="text-darkgrey text-16">{formattedDate}</div>
              {row.condition && (
                <div className="px-3 py-1.5 bg-articblue/10 text-articblue rounded-lg w-fit text-14 font-medium">
                  {boatConditions.find(c => c.key === row.condition)?.label || row.condition}
                </div>
              )}
            </div>
            <div className="w-full h-[1px] bg-stonegrey"></div>
            <h1 className="text-oceanblue text-20 lg:text-24">Description</h1>
            <p className="text-darkgrey text-16 lg:text-20 whitespace-pre-line break-words">{boat.description}</p>
            <div className="w-full h-[1px] bg-stonegrey"></div>
            <div className="flex flex-col gap-16 lg:gap-32">
              <h1 className="text-oceanblue text-20 lg:text-24">Specifications</h1>
              {(() => {
                const groups = groupSpecsBySection(boat.specifications || []);
                if (groups.length === 0) {
                  return (
                    <p className="text-stonegrey text-14 italic">
                      No specifications provided.
                    </p>
                  );
                }
                return (
                  <div className="flex flex-col gap-24">
                    {groups.map((group) => (
                      <div key={group.title} className="flex flex-col gap-12">
                        <h3 className="text-articblue text-16 lg:text-18 font-medium">
                          {group.title}
                        </h3>
                        <div className="flex flex-row gap-8 lg:gap-12 flex-wrap">
                          {group.items.map((spec) => (
                            <div
                              key={spec.key}
                              className="w-fit px-[10px] py-[6px] bg-lightgrey rounded-[6px] text-oceanblue text-14"
                            >
                              {spec.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Sidebar - seller card + stats */}
          <div className="w-full lg:w-[320px] flex flex-col gap-32">
            <div className="bg-lightgrey rounded-[12px] p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <div className="w-[46px] h-[46px] rounded-full overflow-hidden bg-white border-2 border-articblue flex items-center justify-center">
                  <div className="w-full h-full flex items-center justify-center text-articblue text-18 font-medium">
                    {boat.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="text-articblue text-24 lg:text-32 font-medium leading-tight">
                    {boat.user?.name || 'Anonymous user'}
                  </div>

                  <div className="text-darkgrey text-14">
                    <span className="font-medium">Mail : </span>
                    <span className="break-all">{boat.user?.email || 'Not available'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full h-[1px] px-6">
              <ViewStats boatId={boat.id} viewCount={row.view_count || 0} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
