import React, { useMemo } from 'react';
import { DailyReport } from '../types';
import { getLocale, localized } from '../localization';

interface TrendChartProps {
    history: DailyReport[];
}

const TrendChart: React.FC<TrendChartProps> = ({ history }) => {
    const data = useMemo(() => {
        if (!history || history.length < 2) return [];
        // Sort oldest to newest
        const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Get last 7 entries for a clean weekly trend
        return sorted.slice(-7);
    }, [history]);

    if (data.length < 2) {
        return (
            <div className="bg-white/40 border border-purple-100 rounded-3xl p-6 mb-6 text-center shadow-sm w-full">
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">📈</span>
                </div>
                <h4 className="text-[#1D1D1F] font-bold text-sm mb-1">{localized('Glow trend locked', 'Glow trend kilitli')}</h4>
                <p className="text-xs text-[#86868B] max-w-[250px] mx-auto">{localized('Complete 2 glow checks. Then your line stops guessing and starts talking.', '2 glow check tamamla. Sonra çizgi tahmin etmeyi bırakıp konuşmaya başlar.')}</p>
            </div>
        );
    }

    const scores = data.map(d => Math.round(d.global_score));
    const minScore = Math.max(0, Math.min(...scores) - 4); // Lower bound padding
    const maxScore = Math.min(100, Math.max(...scores) + 4); // Upper bound padding
    const range = maxScore - minScore === 0 ? 1 : maxScore - minScore; 

    // Fluid SVG Canvas Mapping
    const svgWidth = 320;
    const svgHeight = 130;
    const paddingX = 25;
    const paddingY = 25;

    const netWidth = svgWidth - paddingX * 2;
    const netHeight = svgHeight - paddingY * 2;

    const points = data.map((d, index) => {
        const x = paddingX + (index / (data.length - 1)) * netWidth;
        const y = paddingY + netHeight - ((d.global_score - minScore) / range) * netHeight;
        return { x, y, score: Math.round(d.global_score), date: new Date(d.date) };
    });

    // Pure Math: Cubic Bezier Curve formulation for extremely smooth UI lines
    const createCurvedPath = (pts: {x:number, y:number}[]) => {
        if (pts.length === 0) return "";
        let path = `M ${pts[0].x},${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const cx = (p1.x + p2.x) / 2;
            path += ` C ${cx},${p1.y} ${cx},${p2.y} ${p2.x},${p2.y}`;
        }
        return path;
    };

    const linePath = createCurvedPath(points);
    const areaPath = `${linePath} L ${points[points.length-1].x},${svgHeight} L ${points[0].x},${svgHeight} Z`;

    // Trend Direction Logic
    const startScore = points[0].score;
    const endScore = points[points.length - 1].score;
    const trendIsUp = endScore >= startScore;
    const pointDifference = Math.abs(endScore - startScore);

    return (
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-[0_4px_25px_rgba(0,0,0,0.04)] w-full mb-6">
            
            {/* Header / Title */}
            <div className="flex items-center justify-between mb-6 px-1">
                <div>
                    <h3 className="text-xs font-semibold text-[#86868B] tracking-widest uppercase mb-1 drop-shadow-sm">{localized('Your Glow Trend', 'Glow Trendin')}</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-[#1D1D1F] leading-none tracking-tight">{endScore}</span>
                        <span className={`text-[11px] font-bold uppercase tracking-wide leading-relaxed px-2 py-0.5 rounded-md ${trendIsUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                            {trendIsUp ? localized(`+${pointDifference} level up`, `+${pointDifference} level up`) : localized(`-${pointDifference} streak warning`, `-${pointDifference} seri uyarısı`)}
                        </span>
                    </div>
                    <p className="text-[12px] text-[#86868B] mt-2">
                        {trendIsUp
                            ? localized('Nice. The glow line is moving. Do not break the streak now.', 'Güzel. Glow çizgisi hareket ediyor. Şimdi seriyi bozma.')
                            : localized('Warning. The glow line pulled back. One scan today keeps the streak alive.', 'Uyarı. Glow çizgisi geri çekildi. Bugünkü tarama seriyi hayatta tutar.')}
                    </p>
                </div>
            </div>

            {/* Render Pure Configured Chart */}
            <div className="relative w-full aspect-[5/2] mt-2">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25"></stop>
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0"></stop>
                        </linearGradient>
                        <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
                            <stop offset="100%" stopColor="#8b5cf6" /> {/* Purple */}
                        </linearGradient>
                    </defs>

                    {/* Area Under Curve Fill */}
                    <path 
                        d={areaPath} 
                        fill="url(#trendGradient)" 
                        className="transition-all duration-1000 ease-in-out" 
                    />

                    {/* Smooth Neon Line */}
                    <path 
                        d={linePath} 
                        fill="none" 
                        stroke="url(#lineColor)" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        className="drop-shadow-sm transition-all duration-1000 ease-in-out" 
                    />

                    {/* Data Points and Axis Legends */}
                    {points.map((p, i) => {
                        const isLast = i === points.length - 1;
                        return (
                            <g key={i}>
                                {/* Vertical Grid Hint for the final value */}
                                {isLast && (
                                    <line x1={p.x} y1={p.y} x2={p.x} y2={svgHeight} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3"/>
                                )}
                                
                                <circle 
                                    cx={p.x} cy={p.y} 
                                    r={isLast ? "5" : "3.5"} 
                                    fill={isLast ? "#8b5cf6" : "white"} 
                                    stroke={isLast ? "white" : "#8b5cf6"} 
                                    strokeWidth="2" 
                                    className="transition-all duration-300 hover:r-[6]" 
                                />
                                
                                {/* Ghosted Background For Text Contrast */}
                                <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="11" fontWeight="900" stroke="white" strokeWidth="3" fill="none">
                                    {p.score}
                                </text>
                                <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="11" fontWeight="900" fill={isLast ? "#1D1D1F" : "#6B7280"}>
                                    {p.score}
                                </text>

                                {/* Labels (Day of Week) */}
                                <text x={p.x} y={svgHeight + 16} textAnchor="middle" fontSize="9" fontWeight={isLast ? "bold" : "normal"} fill={isLast ? "#1D1D1F" : "#9CA3AF"}>
                                    {p.date.toLocaleDateString(getLocale(), { weekday: 'short' })}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default TrendChart;
