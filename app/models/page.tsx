import Link from 'next/link';
import ModelImage from '@/components/ui/ModelImage/ModelImage';
import { allModels } from '@/utils/models-data';

export const metadata = {
  title: 'Dragonfly Models | 3Hulls',
  description:
    'Discover the full range of Dragonfly folding trimarans, from the compact Dragonfly 25 to the offshore-capable Dragonfly 40.'
};

export default function ModelsIndexPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-16 xl:px-0 py-[40px] lg:py-[80px]">
      <div className="flex flex-col gap-16 mb-48">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          <h1 className="text-oceanblue text-32 lg:text-40 font-medium">
            The <span className="text-articblue">Multihull</span> Experience
          </h1>
          <p className="text-stonegrey text-12 sm:text-right sm:max-w-xs leading-relaxed">
            Some images are AI-generated — images will be replaced with real
            photographs as they become available.
          </p>
        </div>
        <p className="text-darkgrey text-16 max-w-2xl">
          From the compact Dragonfly 25 to the flagship Dragonfly 40, every
          model in the range shares the same DNA: a fast, stable folding
          trimaran built to be lived with as much as it is sailed. Browse the
          full lineup below to find the boat that fits your sailing style.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-24 mb-48">
        {allModels.map((model) => (
          <Link
            key={model.key}
            href={`/models/${model.key}`}
            className="group flex flex-col border border-stonegrey/30 hover:border-articblue/60 rounded-xl overflow-hidden transition-colors duration-300"
          >
            <div className="relative w-full aspect-[4/3] bg-stonegrey/20">
              <ModelImage
                src={model.image}
                alt={`${model.name} trimaran — © Dragonfly / Quorning Boats`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            <div className="flex flex-col gap-8 p-24">
              <h2 className="text-oceanblue text-24 font-medium group-hover:text-articblue transition-colors">
                {model.name}
              </h2>
              <p className="text-darkgrey text-[13px]">{model.tagline}</p>
              <p className="text-stonegrey text-[11px] uppercase tracking-wider mt-8">
                {model.yearsProduced} · {model.designer}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="flex flex-col items-center gap-8 mt-8">
        <p className="text-stonegrey text-12 text-center">
          Model photographs courtesy of{' '}
          <a
            href="https://www.dragonfly.dk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-articblue transition-colors underline underline-offset-2"
          >
            Dragonfly / Quorning Boats — www.dragonfly.dk
          </a>
        </p>
        <p className="text-stonegrey text-12 text-center">
          Some images are AI-generated — images will be replaced with real
          photographs as they become available.
        </p>
      </div>
    </div>
  );
}
