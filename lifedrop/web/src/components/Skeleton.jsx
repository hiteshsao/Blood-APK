import React from 'react';

export function Skeleton({ className = '', variant = 'text' }) {
  let baseClass = 'animate-pulse bg-slate-200/80 rounded-xl';

  if (variant === 'circle') {
    baseClass += ' rounded-full';
  } else if (variant === 'card') {
    baseClass += ' rounded-2xl';
  }

  return <div className={`${baseClass} ${className}`} />;
}

export function RequestCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-24 h-3" />
          </div>
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <div className="bg-slate-50 p-4 rounded-xl space-y-2">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-3/4 h-3" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-24 h-8 rounded-lg" />
      </div>
    </div>
  );
}

export function DonorCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-36 h-5" />
        <Skeleton className="w-24 h-3" />
      </div>
      <div className="space-y-1.5 pt-2">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-2/3 h-3" />
      </div>
    </div>
  );
}

export default Skeleton;
