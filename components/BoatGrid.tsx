import SpotlightBoats from '@/components/ui/SpotlightBoats/SpotlightBoats';

interface BoatGridProps {
  boats: any[];
}

export default function BoatGrid({ boats }: BoatGridProps) {
  return (
    <section id="Boats" className="w-full pt-[60px] px-16 md:px-0">
      <div className="mx-auto max-w-screen-xl flex flex-col gap-32">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-oceanblue text-32">
            <span className="text-articblue">Boats</span> in spotlight
          </h1>
          {/* <Button
            text="View more"
            icon="view"
            bgColor="bg-articblue"
            iconColor="text-fullwhite"
            href="/forsale"
          /> */}
        </div>
        <SpotlightBoats key="homepage" spotlight boats={boats ?? []} />
      </div>
    </section>
  );
}
