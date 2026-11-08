import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import SpotlightBoats from '@/components/ui/SpotlightBoats/SpotlightBoats';
import ModelsForSaleLinks from '@/components/ui/ModelsForSaleLinks/ModelsForSaleLinks';
import Button from '@/components/ui/Button/Button';
import { auth } from '@/utils/auth/auth';
import { getBoatsByModel } from '@/utils/database/products';
import { getFavoritedBoatIds } from '@/utils/database/favorites';
import { getModelGuides } from '@/utils/blog-data';
import { getModelData } from '@/utils/models-data';
import { modelKeyFromSlug, modelSlug } from '@/utils/forsale-models';
import { getURL } from '@/utils/helpers';
import { buildBreadcrumbJsonLd } from '@/utils/json-ld';

export const dynamic = 'force-dynamic';

interface ModelForSalePageProps {
  params: { model: string };
}

const MAX_LISTINGS = 24;

async function loadActiveBoats(modelKey: string) {
  const boats = await getBoatsByModel(modelKey, MAX_LISTINGS);
  return boats.filter((b: any) => b.status === 'active');
}

function priceSummary(boats: any[]): string | null {
  if (boats.length === 0) return null;
  // Listings come in several currencies: summarise the most common one only.
  const byCurrency = new Map<string, number[]>();
  for (const b of boats) {
    const c = b.currency || 'EUR';
    byCurrency.set(c, [...(byCurrency.get(c) ?? []), b.price]);
  }
  const [currency, prices] = [...byCurrency.entries()].sort(
    (a, b) => b[1].length - a[1].length
  )[0];
  try {
    const fmt = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    });
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max
      ? `Asking price: ${fmt.format(min)}.`
      : `Asking prices from ${fmt.format(min)} to ${fmt.format(max)}${
          byCurrency.size > 1 ? ' (listings priced in ' + currency + ')' : ''
        }.`;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params
}: ModelForSalePageProps): Promise<Metadata> {
  const key = modelKeyFromSlug(params.model);
  const model = key ? getModelData(key) : null;
  if (!key || !model) {
    return { title: 'Page not found', robots: { index: false, follow: true } };
  }
  const boats = await loadActiveBoats(key);
  const n = boats.length;
  return {
    title: `${model.name} for Sale: Used Trimarans`,
    description:
      n > 0
        ? `${n} used ${model.name} trimaran${n > 1 ? 's' : ''} for sale right now. See photos, asking prices and locations, then contact the seller directly.`
        : `No ${model.name} is listed for sale at the moment. See other Dragonflies for sale, or list yours on 3Hulls.`,
    alternates: { canonical: getURL(`/forsale/${modelSlug(key)}`) },
    // A page without any listing has nothing to offer a search engine.
    robots: n > 0 ? { index: true, follow: true } : { index: false, follow: true }
  };
}

export default async function ModelForSalePage({
  params
}: ModelForSalePageProps) {
  const key = modelKeyFromSlug(params.model);
  const model = key ? getModelData(key) : null;
  if (!key || !model) notFound();

  const boats = await loadActiveBoats(key);
  const session = await auth.api.getSession({ headers: await headers() });
  const viewerUserId = session?.user?.id ?? null;
  const favoritedBoatIds = await getFavoritedBoatIds(
    viewerUserId,
    boats.map((b: any) => b.id)
  );
  const guides = getModelGuides(key);
  const summary = priceSummary(boats);
  const pageUrl = getURL(`/forsale/${modelSlug(key)}`);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: getURL('/') },
    { name: 'For sale', url: getURL('/forsale') },
    { name: `${model.name} for sale`, url: pageUrl }
  ]);
  const listJsonLd =
    boats.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${model.name} for sale`,
          itemListElement: boats.map((b: any, i: number) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: getURL(`/boat/${b.id}`)
          }))
        }
      : null;

  return (
    <div className="flex flex-col">
      <div className="max-w-screen-xl mx-auto w-full px-16 xl:px-0 py-[40px] lg:py-[60px] flex flex-col gap-48">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        {listJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
          />
        )}

        <header className="flex flex-col gap-16 max-w-3xl">
          <Link
            href="/forsale"
            className="text-stonegrey hover:text-articblue text-14 w-fit"
          >
            ← All boats for sale
          </Link>
          <h1 className="text-oceanblue text-32 lg:text-40 font-medium">
            {model.name} <span className="text-articblue">for sale</span>
          </h1>
          <p className="text-darkgrey text-16 leading-relaxed">
            {boats.length > 0
              ? `${boats.length} ${model.name} ${
                  boats.length > 1 ? 'listings are' : 'listing is'
                } live on 3Hulls. ${summary ?? ''}`
              : `There is no ${model.name} for sale on 3Hulls at the moment.`}{' '}
            {model.tagline}
          </p>
        </header>

        <section className="flex flex-col gap-24">
          {boats.length > 0 ? (
            <SpotlightBoats
              key={`forsale-${key}`}
              gridView
              boats={boats}
              favoritedBoatIds={favoritedBoatIds}
              isAuthenticated={!!viewerUserId}
            />
          ) : (
            <div className="bg-lightgrey rounded-xl p-32 flex flex-col items-start gap-16">
              <p className="text-darkgrey text-16">
                New boats are listed regularly. Browse every Dragonfly for
                sale, or place an ad if you own a {model.name}.
              </p>
              <div className="flex flex-col sm:flex-row gap-16">
                <Button
                  text="Browse all boats"
                  href="/forsale"
                  icon="view"
                  bgColor="bg-articblue"
                />
                <Button text="Place an ad" href="/list-boat" icon="add" />
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-16 max-w-3xl">
          <h2 className="text-oceanblue text-24 lg:text-32 font-medium">
            Buying a {model.name}
          </h2>
          <p className="text-darkgrey text-16 leading-relaxed">
            {model.audience}
          </p>
          <p className="text-darkgrey text-16 leading-relaxed">
            Specifications and history are on the{' '}
            <Link
              href={`/models/${model.key}`}
              className="text-articblue underline underline-offset-2"
            >
              {model.name} model page
            </Link>
            . Always check the spec sheet of the specific boat: equipment and
            build year change what a given listing includes.
          </p>
          {guides.length > 0 && (
            <ul className="flex flex-col gap-8 list-disc pl-24 text-darkgrey text-16">
              {guides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/blog/${g.slug}`}
                    className="text-articblue underline underline-offset-2"
                  >
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-16 max-w-3xl border-t border-stonegrey/30 pt-32">
          <h2 className="text-oceanblue text-24 font-medium">
            Selling your {model.name}?
          </h2>
          <p className="text-darkgrey text-16 leading-relaxed">
            3Hulls is a marketplace dedicated to Dragonfly trimarans, so your
            listing reaches buyers who are looking for this boat.
          </p>
          <div>
            <Button text="Place an ad" href="/list-boat" icon="add" />
          </div>
        </section>
      </div>

      <ModelsForSaleLinks
        excludeKey={key}
        heading="Other Dragonflies for sale"
      />
    </div>
  );
}
