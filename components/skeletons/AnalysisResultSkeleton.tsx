import React from 'react';

const SkeletonBar: React.FC<{ width?: string; height?: string; className?: string }> = ({ width = 'w-full', height = 'h-4', className }) => (
    <div className={`${width} ${height} bg-slate-200 dark:bg-slate-700 rounded ${className} animate-pulse`}></div>
);

const AnalysisResultSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
                <SkeletonBar width="w-1/2" height="h-8" className="mb-1" />
                <SkeletonBar width="w-1/3" height="h-4" className="mb-6" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 flex flex-col items-center">
                        <div className="bg-slate-200 dark:bg-slate-700 rounded-lg shadow-md w-full max-w-xs aspect-square animate-pulse"></div>
                        <div className="mt-6 flex flex-col items-center">
                            <SkeletonBar width="w-24" height="h-6" className="mb-2" />
                            <div className="relative w-32 h-32 md:w-40 md:h-40 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <SkeletonBar width="w-1/3" height="h-6" className="mb-3" />
                            <div className="space-y-3">
                                <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <SkeletonBar width="w-1/4" />
                                        <SkeletonBar width="w-12" height="h-6" />
                                    </div>
                                    <SkeletonBar />
                                </div>
                                <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <SkeletonBar width="w-1/4" />
                                        <SkeletonBar width="w-16" height="h-6" />
                                    </div>
                                    <SkeletonBar />
                                </div>
                            </div>
                        </div>
                        <div>
                            <SkeletonBar width="w-1/2" height="h-6" className="mb-3" />
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg space-y-3">
                                    <SkeletonBar width="w-1/3" />
                                    <SkeletonBar />
                                    <SkeletonBar width="w-3/4" />
                                </div>
                                <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg space-y-3">
                                    <SkeletonBar width="w-1/3" />
                                    <SkeletonBar />
                                    <SkeletonBar width="w-3/4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisResultSkeleton;
