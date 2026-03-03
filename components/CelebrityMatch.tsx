import React from 'react';
import { CelebrityMatch as CelebrityMatchType } from '../types';
import { Sparkles } from './icons/SparklesIcon';

interface CelebrityMatchProps {
    imageUrl: string;
    celebrityMatch?: CelebrityMatchType;
    faceShape: string;
}

const CelebrityMatch: React.FC<CelebrityMatchProps> = ({ imageUrl, celebrityMatch, faceShape }) => {
    if (!celebrityMatch) {
        return (
            <div className="bg-black/40 rounded-3xl p-6 border border-white/5 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                    <h3 className="text-white font-bold">Analyzing Archetype...</h3>
                    <p className="text-gray-400 text-xs mt-1">Our AI is comparing your facial landmarks against our celebrity database.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-[#1C1C1E] to-black rounded-[2rem] border border-white/10 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="p-6 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Aesthetic Twin</span>
                        </div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">
                            {celebrityMatch.name}
                        </h2>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <span className="text-lg font-bold text-white">{celebrityMatch.matchPercentage}%</span>
                        <span className="text-[10px] text-gray-400 ml-1 uppercase">Match</span>
                    </div>
                </div>

                {/* Comparison Visuals */}
                <div className="flex items-center gap-4 mb-6">
                    {/* User Image */}
                    <div className="flex-1 relative group">
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/5 group-hover:border-amber-500/30 transition-colors">
                            <img
                                src={imageUrl}
                                alt="You"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <span className="absolute bottom-3 left-3 text-xs font-bold text-white uppercase tracking-wider">You</span>
                        </div>
                    </div>

                    {/* Connection Line */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <div className="w-1 h-1 rounded-full bg-white/40" />
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                            <span className="text-xs font-bold text-white">vs</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white/40" />
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                    </div>

                    {/* Celebrity Placeholder/Image */}
                    <div className="flex-1 relative group">
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/5 bg-white/5 flex items-center justify-center relative group-hover:border-amber-500/30 transition-colors">
                            {/* Since we don't have a celebrity image URL in the type currently, we show a stylized placeholder or search link could go here */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-black" />
                            <div className="text-center p-2 relative z-10 opacity-60">
                                <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                <span className="text-[10px] font-medium text-amber-200/80 uppercase tracking-widest leading-relaxed">
                                    {celebrityMatch.name}
                                </span>
                            </div>
                        </div>
                        <span className="absolute bottom-3 right-3 text-xs font-bold text-amber-500 uppercase tracking-wider">Icon</span>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                    <p className="text-xs leading-relaxed text-gray-400">
                        <span className="text-white font-bold uppercase tracking-wide mr-2">Why:</span>
                        {celebrityMatch.description}
                    </p>
                </div>

                {/* Face Shape Tag */}
                <div className="mt-4 flex justify-center">
                    <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5 text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                        Shared Architecture: <span className="text-white">{faceShape}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CelebrityMatch;
