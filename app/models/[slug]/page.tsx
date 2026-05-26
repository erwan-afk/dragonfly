import Link from 'next/link';
import ModelImage from '@/components/ui/ModelImage/ModelImage';
import { notFound } from 'next/navigation';
import SpotlightBoats from '@/components/ui/SpotlightBoats/SpotlightBoats';
import Button from '@/components/ui/Button/Button';
import { getModelData, modelsData, allModels } from '@/utils/models-data';
import { getBoatsByModel } from '@/utils/database/products';

export const dynamic = 'force-dynamic';

interface ModelPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ModelPageProps) {
  const model = getModelData(params.slug);
  if (!model) return { title: 'Model not found' };
  return {
    title: `${model.name} | 3Hulls`,
    description: model.tagline
  };
}

export async function generateStaticParams() {
  return Object.keys(modelsData).map((slug) => ({ slug }));
}

export default async function ModelDetailPage({ params }: ModelPageProps) {
  const model = getModelData(params.slug);
  if (!model) notFound();

  const boats = await getBoatsByModel(model.key, 6);

  const relatedModels = allModels.filter((m) => m.key !== model.key).slice(0, 3);

  return (
    <div className="max-w-screen-xl mx-auto px-16 xl:px-0 py-[40px] lg:py-[60px] flex flex-col gap-48 lg:gap-64">
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-32 lg:gap-48 items-center">
        <div className="flex flex-col gap-16">
          <Link
            href="/models"
            className="text-stonegrey hover:text-articblue text-14 w-fit"
          >
            ← All models
          </Link>
          <h1 className="text-oceanblue text-32 lg:text-40 font-medium">
            {model.name}
          </h1>
          <p className="text-darkgrey text-18">{model.tagline}</p>
          <p className="text-stonegrey text-[11px] uppercase tracking-wider">
            {model.yearsProduced} · {model.designer}
          </p>
          <div className="flex flex-row gap-16 mt-16">
            <Button
              text="View listings"
              icon="view"
              href={`/forsale?model=${model.key}`}
              bgColor="bg-articblue"
            />
          </div>
        </div>
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-lightgrey">
          <ModelImage
            src={model.image}
            alt={model.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Overview */}
      <section className="flex flex-col gap-24">
        <h2 className="text-oceanblue text-24 lg:text-32 font-medium">Overview</h2>
        <div className="flex flex-col gap-16 text-darkgrey text-16 leading-relaxed">
          {model.overview.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* History */}
      <section className="flex flex-col gap-24 bg-lightgrey rounded-xl p-32 lg:p-48">
        <h2 className="text-oceanblue text-24 lg:text-32 font-medium">
          History &amp; development
        </h2>
        <div className="flex flex-col gap-16 text-darkgrey text-16 leading-relaxed">
          {model.history.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* Specs */}
      <section className="flex flex-col gap-24">
        <h2 className="text-oceanblue text-24 lg:text-32 font-medium">
          Specifications
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-32 gap-y-16">
          {model.specs.map((spec) => (
            <div
              key={spec.label}
              className="flex flex-row justify-between items-baseline border-b border-stonegrey/30 py-12"
            >
              <span className="text-stonegrey text-14">{spec.label}</span>
              <span className="text-oceanblue text-16 font-medium text-right">
                {spec.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Sailing & Audience */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-32">
        <div className="flex flex-col gap-12">
          <h3 className="text-oceanblue text-20 font-medium">On the water</h3>
          <p className="text-darkgrey text-16 leading-relaxed">
            {model.sailing}
          </p>
        </div>
        <div className="flex flex-col gap-12">
          <h3 className="text-oceanblue text-20 font-medium">Who it's for</h3>
          <p className="text-darkgrey text-16 leading-relaxed">
            {model.audience}
          </p>
        </div>
      </section>

      {/* Listings */}
      <section className="flex flex-col gap-24">
        <div className="flex flex-row items-center justify-between flex-wrap gap-16">
          <h2 className="text-oceanblue text-24 lg:text-32 font-medium">
            Available <span className="text-articblue">{model.name}</span>
          </h2>
          {boats.length > 0 && (
            <Button
              text="View all listings"
              icon="view"
              href={`/forsale?model=${model.key}`}
              bgColor="bg-articblue"
            />
          )}
        </div>

        {boats.length > 0 ? (
          <SpotlightBoats key={`model-${model.key}`} gridView boats={boats} />
        ) : (
          <div className="bg-lightgrey rounded-xl p-32 text-center flex flex-col items-center gap-16">
            <p className="text-darkgrey text-16">
              No active {model.name} listings right now. Be the first to list
              yours.
            </p>
            <Button
              text="Place an ad"
              href="/list-boat"
              icon="add"
              bgColor="bg-articblue"
            />
          </div>
        )}
      </section>

      {/* Related models */}
      <section className="flex flex-col gap-24">
        <h2 className="text-oceanblue text-24 lg:text-32 font-medium">
          Other models
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-16">
          {relatedModels.map((related) => (
            <Link
              key={related.key}
              href={`/models/${related.key}`}
              className="group flex flex-row items-center gap-16 border border-stonegrey/30 hover:border-articblue/60 rounded-xl p-16 transition-colors duration-300"
            >
              <div className="relative w-[80px] h-[60px] rounded-md overflow-hidden flex-shrink-0">
                <ModelImage
                  src={related.image}
                  alt={related.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-oceanblue text-14 font-medium group-hover:text-articblue transition-colors">
                  {related.name}
                </span>
                <span className="text-stonegrey text-[11px] uppercase tracking-wider mt-4">
                  {related.yearsProduced}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
