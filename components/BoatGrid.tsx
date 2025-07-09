import SpotlightBoats from '@/components/ui/SpotlightBoats/SpotlightBoats';

interface BoatGridProps {
  boats: any[];
}

export default function BoatGrid({ boats }: BoatGridProps) {
  return (
    <section id="Boats" className="w-full py-[128px] bg-lightgrey ">
      <div className="mx-auto max-w-screen-xl flex flex-col gap-[80px]">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-oceanblue text-56">
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
