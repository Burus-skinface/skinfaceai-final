import React from 'react';

const SkeletonBar: React.FC<{ width?: string; height?: string; className?: string }> = ({ width = 'w-full', height = 'h-4', className }) => (
    <div className={`${width} ${height} bg-slate-200 dark:bg-slate-700 rounded ${className} animate-pulse`}></div>
);


const FacialAnalysisResultSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
                <SkeletonBar width="w-1/2" height="h-8" className="mb-1" />
                <SkeletonBar width="w-1/3" height="h-4" className="mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 flex flex-col items-center">
                        <div className="bg-slate-200 dark:bg-slate-700 rounded-lg shadow-md w-full max-w-xs aspect-square animate-pulse"></div>
                        <div className="mt-6 w-full bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg space-y-2">
                            <SkeletonBar width="w-1/3" height="h-6" />
                            <SkeletonBar />
                            <SkeletonBar width="w-5/6" />
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        <SkeletonBar width="w-1/4" height="h-6" />
                        {[...Array(3)].map((_, index) => (
                            <div key={index} className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                                    <div className="flex-1 space-y-2">
                                        <SkeletonBar width="w-1/4" />
                                        <SkeletonBar width="w-1/3" height="h-3" />
                                    </div>
                                </div>
                                <SkeletonBar />
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600/50 space-y-3">
                                   <SkeletonBar width="w-1/5" height="h-3" />
                                   <SkeletonBar width="w-5/6" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacialAnalysisResultSkeleton;
