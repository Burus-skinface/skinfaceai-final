import React from 'react';

const SkeletonBar: React.FC<{ width?: string; height?: string; className?: string }> = ({ width = 'w-full', height = 'h-4', className }) => (
    <div className={`${width} ${height} bg-slate-200 dark:bg-slate-700 rounded ${className} animate-pulse`}></div>
);

const ProgressTrackerSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <SkeletonBar width="w-1/3" height="h-8" className="mb-4" />
      
      <div className="h-64 mb-6 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>

      <div>
        <SkeletonBar width="w-1/4" height="h-6" className="mb-3" />
        <div className="flex overflow-x-auto space-x-3 pb-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3 w-28 h-16 animate-pulse"
            >
              <SkeletonBar width="w-3/4" height="h-5" className="mb-2 mx-auto" />
              <SkeletonBar width="w-1/2" height="h-3" className="mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressTrackerSkeleton;
