import { Skeleton } from '@heroui/skeleton';

export default function BoatListingSkeleton() {
  return (
    <section className="bg-fullwhite">
      <div className="max-w-screen-xl mx-auto py-[112px] flex flex-row gap-[56px]">
        <Skeleton
          className="w-full h-[1000px] rounded-[24px] bg-gray-200"
          isLoaded={false}
        />
        <Skeleton
          className="w-full h-[100px] mx-[53px] my-[20px] rounded-[7px]  bg-gray-200"
          isLoaded={false}
        />
      </div>
    </section>
  );
}
