import { Skeleton } from '@heroui/skeleton';

interface LoadingSkeletonProps {
  type: 'form' | 'page' | 'card' | 'list';
  count?: number;
}

export default function LoadingSkeleton({
  type,
  count = 1
}: LoadingSkeletonProps) {
  if (type === 'form') {
    return (
      <div className="space-y-6 p-6 bg-white max-w-screen-xl mx-auto py-[112px]">
        <Skeleton className="w-1/3 h-8 rounded-lg bg-gray-200" />
        <div className="space-y-4">
          <Skeleton className="w-full h-12 rounded-lg bg-gray-200" />
          <Skeleton className="w-full h-12 rounded-lg bg-gray-200" />
          <Skeleton className="w-full h-32 rounded-lg bg-gray-200" />
          <div className="flex gap-4">
            <Skeleton className="w-1/2 h-12 rounded-lg bg-gray-200" />
            <Skeleton className="w-1/2 h-12 rounded-lg bg-gray-200" />
          </div>
        </div>
        <Skeleton className="w-32 h-10 rounded-lg bg-gray-200" />
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className="space-y-8 p-6">
        <Skeleton className="w-1/2 h-12 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="w-full h-48 rounded-lg" />
              <Skeleton className="w-3/4 h-6 rounded-lg" />
              <Skeleton className="w-1/2 h-4 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <Skeleton className="w-full h-40 rounded-lg" />
        <Skeleton className="w-3/4 h-6 rounded-lg" />
        <Skeleton className="w-1/2 h-4 rounded-lg" />
        <Skeleton className="w-1/4 h-4 rounded-lg" />
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="flex items-center space-x-4 p-3 border rounded-lg"
          >
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-3/4 h-4 rounded-lg" />
              <Skeleton className="w-1/2 h-3 rounded-lg" />
            </div>
            <Skeleton className="w-16 h-8 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
