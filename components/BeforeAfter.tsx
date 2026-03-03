import React, { useState } from 'react';
import { DailyReport } from '../types';
import { ShareIcon } from './icons/ShareIcon';
import { t } from '../localization';

interface BeforeAfterProps {
  firstReport: DailyReport;
  lastReport: DailyReport;
  daysApart: number;
}

const BeforeAfter: React.FC<BeforeAfterProps> = ({ firstReport, lastReport, daysApart }) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  const scoreDiff = lastReport.global_score - firstReport.global_score;
  const improvement = Math.abs(scoreDiff);
  const isImprovement = scoreDiff > 0;

  const handleShare = async () => {
    const before = Math.round(firstReport.global_score);
    const after = Math.round(lastReport.global_score);
    const diff = Math.round(scoreDiff);
    const text = t.shareProgressText(daysApart, before, after, diff, isImprovement);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.shareProgressTitle,
          text: text,
          url: window.location.origin,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(text + '\n' + window.location.origin);
      alert(t.shareProgressCopied);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {t.beforeAfterTitle(daysApart)}
          </h2>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isImprovement ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
            <span className="text-2xl font-bold">{t.beforeAfterPoints(Math.round(scoreDiff), isImprovement)}</span>
          </div>
        </div>

        {/* Image Comparison Slider */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-6 shadow-2xl">
          {/* Before Image (Full) */}
          <img
            src={firstReport.imageUrl}
            alt="Before"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* After Image (Clipped) */}
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={lastReport.imageUrl}
              alt="After"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Slider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={(e) => {
              const handleMove = (moveEvent: MouseEvent) => {
                const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
                if (rect) {
                  const x = moveEvent.clientX - rect.left;
                  const percent = (x / rect.width) * 100;
                  setSliderPosition(Math.max(0, Math.min(100, percent)));
                }
              };
              
              const handleUp = () => {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              };
              
              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);
            }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-white text-sm font-bold">
            {t.beforeAfterBefore}: {Math.round(firstReport.global_score)}
          </div>
          <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-white text-sm font-bold">
            {t.beforeAfterAfter}: {Math.round(lastReport.global_score)}
          </div>
        </div>

        {/* Stats Comparison */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-xs text-gray-400 mb-1">{t.skin_score}</p>
            <p className="text-lg font-bold text-teal-400">
              {isImprovement && lastReport.skin.skin_score > firstReport.skin.skin_score ? '+' : ''}
              {Math.round(lastReport.skin.skin_score - firstReport.skin.skin_score)}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-xs text-gray-400 mb-1">{t.symmetry_score}</p>
            <p className="text-lg font-bold text-purple-400">
              {lastReport.symmetry.symmetry_score > firstReport.symmetry.symmetry_score ? '+' : ''}
              {Math.round(lastReport.symmetry.symmetry_score - firstReport.symmetry.symmetry_score)}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-xs text-gray-400 mb-1">{t.structure_score}</p>
            <p className="text-lg font-bold text-orange-400">
              {lastReport.face_shape.structure_score > firstReport.face_shape.structure_score ? '+' : ''}
              {Math.round(lastReport.face_shape.structure_score - firstReport.face_shape.structure_score)}
            </p>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <ShareIcon className="w-5 h-5" />
          {t.beforeAfterShare}
        </button>
      </div>
    </div>
  );
};

export default BeforeAfter;

