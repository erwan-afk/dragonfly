import Link from 'next/link';
import { dragonflyModels } from '@/utils/constants';
import { getActiveModelCounts } from '@/utils/database/model-counts';
import { modelSlug } from '@/utils/forsale-models';

interface ModelsForSaleLinksProps {
  /** Model key to leave out (the page the links are shown on). */
  excludeKey?: string;
  heading?: string;
}

/**
 * Crawlable links to the "<model> for sale" pages that currently have
 * listings. Renders nothing when no model has an active listing, so it never
 * points visitors or search engines at empty pages.
 */
export default async function ModelsForSaleLinks({
  excludeKey,
  heading = 'Dragonfly trimarans for sale by model'
}: ModelsForSaleLinksProps) {
  const counts = await getActiveModelCounts();
  const models = dragonflyModels.filter(
    (m) => m.key !== excludeKey && (counts[m.key] ?? 0) > 0
  );
  if (models.length === 0) return null;

  return (
    <section className="max-w-screen-xl mx-auto px-16 xl:px-0 py-[32px] flex flex-col gap-16">
      <h2 className="text-oceanblue text-24 font-medium">{heading}</h2>
      <ul className="flex flex-wrap gap-12">
        {models.map((m) => (
          <li key={m.key}>
            <Link
              href={`/forsale/${modelSlug(m.key)}`}
              className="inline-flex items-center gap-8 border border-stonegrey/30 hover:border-articblue/60 hover:text-articblue rounded-[100px] px-16 py-8 text-14 text-oceanblue transition-colors"
            >
              {m.label} for sale
              <span className="text-stonegrey text-12">{counts[m.key]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
