import { Skeleton } from '@heroui/skeleton';

export default function BoatDetailSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <Skeleton className="rounded-lg mb-4" isLoaded={false}>
          <div className="w-2/3 h-12 bg-default-200 rounded-lg" />
        </Skeleton>
        <Skeleton className="rounded-lg" isLoaded={false}>
          <div className="w-1/3 h-6 bg-default-200 rounded-lg" />
        </Skeleton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Image Gallery */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="rounded-lg" isLoaded={false}>
            <div className="w-full h-96 bg-default-200 rounded-lg" />
          </Skeleton>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="rounded-lg" isLoaded={false}>
                <div className="w-full h-20 bg-default-200 rounded-lg" />
              </Skeleton>
            ))}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Price Section */}
          <div className="space-y-2">
            <Skeleton className="rounded-lg" isLoaded={false}>
              <div className="w-1/4 h-4 bg-default-200 rounded-lg" />
            </Skeleton>
            <Skeleton className="rounded-lg" isLoaded={false}>
              <div className="w-1/2 h-8 bg-default-200 rounded-lg" />
            </Skeleton>
          </div>

          {/* Specifications */}
          <div className="space-y-4">
            <Skeleton className="rounded-lg" isLoaded={false}>
              <div className="w-1/3 h-6 bg-default-200 rounded-lg" />
            </Skeleton>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="rounded-lg" isLoaded={false}>
                  <div className="w-1/3 h-4 bg-default-200 rounded-lg" />
                </Skeleton>
                <Skeleton className="rounded-lg" isLoaded={false}>
                  <div className="w-1/4 h-4 bg-default-200 rounded-lg" />
                </Skeleton>
              </div>
            ))}
          </div>

          {/* Contact Button */}
          <Skeleton className="rounded-lg" isLoaded={false}>
            <div className="w-full h-12 bg-default-200 rounded-lg" />
          </Skeleton>
        </div>
      </div>

      {/* Description Section */}
      <div className="mt-12 space-y-4">
        <Skeleton className="rounded-lg" isLoaded={false}>
          <div className="w-1/4 h-8 bg-default-200 rounded-lg" />
        </Skeleton>
        <div className="space-y-2">
          <Skeleton className="rounded-lg" isLoaded={false}>
            <div className="w-full h-4 bg-default-200 rounded-lg" />
          </Skeleton>
          <Skeleton className="rounded-lg" isLoaded={false}>
            <div className="w-full h-4 bg-default-200 rounded-lg" />
          </Skeleton>
          <Skeleton className="rounded-lg" isLoaded={false}>
            <div className="w-3/4 h-4 bg-default-200 rounded-lg" />
          </Skeleton>
        </div>
      </div>

      {/* Related Boats Section */}
      <div className="mt-16 space-y-6">
        <Skeleton className="rounded-lg" isLoaded={false}>
          <div className="w-1/3 h-8 bg-default-200 rounded-lg" />
        </Skeleton>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="rounded-lg" isLoaded={false}>
                <div className="w-full h-48 bg-default-200 rounded-lg" />
              </Skeleton>
              <Skeleton className="rounded-lg" isLoaded={false}>
                <div className="w-3/4 h-6 bg-default-200 rounded-lg" />
              </Skeleton>
              <Skeleton className="rounded-lg" isLoaded={false}>
                <div className="w-1/2 h-4 bg-default-200 rounded-lg" />
              </Skeleton>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
