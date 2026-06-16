import { Skeleton } from "@/components/ui/skeleton";

export default function CallLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-8 w-56" />
      </div>
      <Skeleton className="h-[280px] w-full rounded-2xl" />
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
