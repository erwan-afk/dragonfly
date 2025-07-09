import { Skeleton } from '@heroui/skeleton';
import Card from '../Card/Card';

export default function AuthSkeleton() {
  return (
    <div className="flex flex-col justify-between max-w-2xl m-auto w-full">
      <Skeleton className="rounded-lg" isLoaded={false}>
        <div className="space-y-6 p-6"></div>
      </Skeleton>
    </div>
  );
}
