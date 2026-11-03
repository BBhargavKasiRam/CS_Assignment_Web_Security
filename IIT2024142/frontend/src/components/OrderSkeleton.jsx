import React from "react";
import { motion } from "motion/react";

export const OrderSkeleton = () => {
  return (
    <div className="bg-white border border-ink/5 p-10 flex flex-col lg:flex-row gap-12 shadow-xl animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full lg:w-64 h-64 bg-ink/5 flex-shrink-0" />

      {/* Details Skeleton */}
      <div className="grow flex flex-col justify-between py-2">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-4">
              <div className="h-2 w-20 bg-ink/5" />
              <div className="h-10 w-64 bg-ink/5" />
              <div className="h-4 w-40 bg-ink/5" />
            </div>
            <div className="text-right space-y-4">
              <div className="h-2 w-20 bg-ink/5 ml-auto" />
              <div className="h-10 w-32 bg-ink/5 ml-auto" />
            </div>
          </div>

          <div className="flex gap-12">
            <div className="space-y-2">
              <div className="h-2 w-16 bg-ink/5" />
              <div className="h-4 w-24 bg-ink/5" />
            </div>
            <div className="space-y-2">
              <div className="h-2 w-16 bg-ink/5" />
              <div className="h-4 w-24 bg-ink/5" />
            </div>
          </div>
        </div>

        <div className="flex gap-6 mt-10">
          <div className="h-12 w-40 bg-ink/5" />
          <div className="h-12 w-40 bg-ink/5" />
        </div>
      </div>
    </div>
  );
};
