import React from 'react';
import { DailyReport } from '../types';
import { localized } from '../localization';
import FaceOverview from './face/FaceOverview';
import FaceDetailsList from './face/FaceDetailsList';
import FaceFeatureDetail from './face/FaceFeatureDetail';
import { FaceFeatureId, resolveFaceBig6 } from './face/faceFeatureMeta';

interface FaceAnalysisProps {
    data: DailyReport | null;
    dayNumber: number;
    history?: DailyReport[];
    isFreeUser?: boolean;
    onShowPaywall?: () => void;
    onNavigateToRecommendations?: () => void;
}

const FaceAnalysis: React.FC<FaceAnalysisProps> = ({
    data,
    dayNumber,
    history = [],
    isFreeUser = true,
    onShowPaywall,
    onNavigateToRecommendations,
}) => {
    const [showDebug, setShowDebug] = React.useState(false);
    // Page 2: "See Your Details" slide-up; Page 3: single feature detail (stacked)
    const [showDetails, setShowDetails] = React.useState(false);
    const [selectedFeature, setSelectedFeature] = React.useState<FaceFeatureId | null>(null);

    // In dev mode, if data is missing structural results, hydrate it with complete dev mock data
    let reportData = data;
    if (import.meta.env.DEV && (!data || !data.faceState || !data.recommendations?.eliteReport)) {
        reportData = {
            ...data,
            id: data?.id || 'mock-dev-id',
            date: data?.date || new Date().toISOString(),
            imageUrl: data?.imageUrl || '/images/hero-scan-default.png',
            global_score: data?.global_score || 7.8,
            faceState: data?.faceState || {
                geometry: {
                    cheekboneWidthRatio: 1.24,
                    midfaceRatio: 1.95,
                    upperThirdRatio: 0.33,
                    middleThirdRatio: 0.34,
                    lowerThirdRatio: 0.33,
                    gonialAngle: 121,
                    jawCheekboneRatio: 0.90,
                    ramusRatio: 0.46,
                    nasofrontalAngle: 125,
                    chinProjectionRatio: 28,
                    lipElineDistUpper: 1.5,
                    lipElineDistLower: 1.0,
                    cervicoMentalAngle: 105,
                    symmetryAvg: 0.94,
                    goldenRatioFaceIPD: 88,
                    goldenRatioMouthNose: 1.62,
                    faceLengthWidthRatio: 1.35,
                    eyeTilt: 2.0,
                }
            },
            analysis: data?.analysis || {
                scanId: 'mock-scan',
                timestamp: Date.now(),
                skin: { features: {}, zones: {} },
                face: {
                    landmarks: {},
                    ratios: {},
                    profile: { faceShape: 'Oval' }
                },
                spectral: { uvDamage: 0.2, hyperpigmentation: 0.3, vascular: 0.1, darkCircles: 0.4 }
            },
            scoring: {
                ...data?.scoring,
                scanId: 'mock-scan',
                globalScore: data?.scoring?.globalScore || 7.8,
                potentialScore: data?.scoring?.potentialScore || 9.2,
                skin: data?.scoring?.skin || {
                    statusScores: { overallSkin: 8, hydration: 7, redness: 9, pores: 6, spots: 8 },
                    overallScore: 8,
                    ageEstimate: 26,
                },
                face: data?.scoring?.face || {
                    statusScores: {
                        faceLengthWidthBalance: 8.2,
                        verticalFacialDistribution: 8.0,
                        jawCheekboneRatio: 8.5,
                        overallStructure: 8.1,
                    },
                    archetype: "THE WARRIOR",
                    archetypeDebug: {
                        traits: { fwhr: 8.5, cheekbones: 8.0, jawline: 8.5, harmony: 8.0 },
                        candidates: [
                            { id: "warrior", displayName: "THE WARRIOR", score: 85, passedGate: true }
                        ]
                    },
                    faceBig6: {
                        overallFaceBig6: 8.6,
                        eyes: { score: 8.8, status: 'elite', statusLabel: 'Elite', breakdown: [
                            { label: 'Canthal Tilt', score: 9.0, tag: 'angle' },
                            { label: 'Intercanthal Ratio', score: 8.5, tag: 'ratio' },
                            { label: 'Brow Projection', score: 8.8, tag: 'projection' },
                            { label: 'Eye Spacing', score: 8.9, tag: 'ratio' },
                        ] },
                        nose: { score: 6.5, status: 'average', statusLabel: 'Average', breakdown: [
                            { label: 'Alar / Intercanthal', score: 6.8, tag: 'ratio' },
                            { label: 'Nose-Face Length', score: 7.2, tag: 'ratio' },
                            { label: 'Alar Symmetry', score: 6.0, tag: 'symmetry' },
                            { label: 'Nasal Tip Angle', score: 6.1, tag: 'angle' },
                        ] },
                        jawline: { score: 9.0, status: 'elite', statusLabel: 'Elite', breakdown: [
                            { label: 'Gonial Angle', score: 8.5, tag: 'angle' },
                            { label: 'Bigonial/Bizygomatic', score: 9.1, tag: 'ratio' },
                            { label: 'Jaw Definition', score: 9.3, tag: 'morphology' },
                            { label: 'Jaw Taper', score: 9.0, tag: 'ratio' },
                        ] },
                        chin: { score: 7.4, status: 'good', statusLabel: 'Good', breakdown: [
                            { label: 'Horizontal Projection', score: 8.0, tag: 'projection' },
                            { label: 'Cervicomental Angle', score: 7.5, tag: 'angle' },
                            { label: 'Vertical Height', score: 6.8, tag: 'ratio' },
                            { label: 'Chin Taper', score: 7.2, tag: 'ratio' },
                        ] },
                        midface: { score: 8.6, status: 'elite', statusLabel: 'Elite', breakdown: [
                            { label: 'FWHR', score: 8.8, tag: 'ratio' },
                            { label: 'Cheekbone Ratio', score: 8.5, tag: 'ratio' },
                            { label: 'Malar Projection', score: 8.4, tag: 'projection' },
                            { label: 'Mid-Lower Balance', score: 8.7, tag: 'ratio' },
                        ] },
                        harmony: { score: 8.9, status: 'elite', statusLabel: 'Elite', breakdown: [
                            { label: 'Facial Thirds', score: 8.9, tag: 'ratio' },
                            { label: 'Overall Symmetry', score: 9.0, tag: 'symmetry' },
                            { label: 'Golden Ratio', score: 8.8, tag: 'ratio' },
                            { label: 'Phi Concordance', score: 8.9, tag: 'ratio' },
                        ] }
                    },
                    measurements: {
                        facialThirds: {
                            upper: 0.33, mid: 0.34, lower: 0.33,
                            score: 8.0, verdict: "Balanced", deviation: 0.01,
                            debugLog: "Avg Dev: 1.0%",
                            impacts: [
                                { metric: "Cheekbones", state: "Strong", val: "1.24", reasoning: "Ideal cheekbone prominence", rawScore: 8.5, measurementLabel: "Width Ratio" },
                                { metric: "FWHR", state: "Balanced", val: "1.95", reasoning: "Ideal compact midface", rawScore: 8.8, measurementLabel: "Ratio" },
                                { metric: "Facial Thirds", state: "Balanced", val: "33/34/33", reasoning: "Equal vertical thirds", rawScore: 8.0, measurementLabel: "U/M/L %" }
                            ]
                        },
                        jawAngularity: {
                            gonialAngle: 121, gonialScore: 8.5, overallScore: 8.5,
                            gonialVerdict: "Ideal", definitionVerdict: "Sharp", ramusVerdict: "Strong",
                            definitionScore: 8.5, ramusScore: 8.5,
                            impacts: [
                                { metric: "Gonial Angle", state: "Ideal", val: "121.0°", reasoning: "Optimal gonial angle", rawScore: 8.5, measurementLabel: "Angle" },
                                { metric: "Jaw Width", state: "Strong", val: "0.90", reasoning: "Strong lower jaw definition", rawScore: 8.2, measurementLabel: "Ratio" },
                                { metric: "Ramus Length", state: "Strong", val: "0.46", reasoning: "Excellent ramus height", rawScore: 8.8, measurementLabel: "Ratio" }
                            ],
                            debugLog: "Gonial: 8.5"
                        },
                        sideProfile: {
                            overallScore: 7.9,
                            nasofrontalAngle: { angle: 125, score: 8.0, verdict: "Balanced" },
                            rickettsELine: { upperDist: 1.5, lowerDist: 1.0, score: 8.0, verdict: "Balanced" },
                            ramus: { ratio: 0.46, score: 8.5, verdict: "Strong" },
                            impacts: [
                                { metric: "Nasofrontal", state: "Balanced", val: "125.0°", reasoning: "Balanced nose bridge angle", rawScore: 8.0, measurementLabel: "Angle" },
                                { metric: "Chin Projection", state: "Strong", val: "28.0%", reasoning: "Strong chin definition", rawScore: 8.5, measurementLabel: "Projection" },
                                { metric: "E-Line", state: "Balanced", val: "1.2%", reasoning: "Balanced lip positioning", rawScore: 8.0, measurementLabel: "Lip Position" }
                            ],
                            debugLog: "Naso: 8.0 | Chin: 8.5",
                            _scoring_formula: "Score = (Nasofrontal * 30%) + (Chin Proj * 40%) + (E-Line * 30%)"
                        },
                        harmony: {
                            overallScore: 8.0,
                            symmetry: 0.94, symmetryVerdict: "High",
                            goldenRatioScore: 8.5, goldenRatioVerdict: "Elite",
                            impacts: [
                                { metric: "Symmetry", state: "High", val: "94.0%", reasoning: "Minimal symmetry deviation", rawScore: 8.5, measurementLabel: "Variance" },
                                { metric: "Golden Ratio", state: "Elite", val: "%88", reasoning: "Near-perfect facial proportion mapping", rawScore: 8.8, measurementLabel: "Match" },
                                { metric: "Lip-Nose Ratio", state: "Balanced", val: "1.62", reasoning: "Balanced mouth width to nose width", rawScore: 8.0, measurementLabel: "Ratio" }
                            ],
                            debugLog: "Sym: 8.5 | Golden: 8.8"
                        }
                    }
                }
            },
            recommendations: data?.recommendations || {
                motivationalNote: 'You have a great foundation, just a few tweaks away from your maximum potential.',
                skincare: [],
                lifestyle: [],
                big6Insights: {
                    acneClarity: "Minimal active breakouts. Focus on preventing congestion in the T-zone.",
                    texturePores: "Generally smooth, but visible pores around the cheeks and nose.",
                    barrierDefense: "Strong overall, but slight compromise detected on the chin area.",
                    sebumDynamics: "Slightly oily in the T-zone, well-balanced elsewhere.",
                    toneUniformity: "Even tone with minor post-inflammatory hyperpigmentation.",
                    visualFatigue: "Good radiance, but dark circles indicate slight visual fatigue."
                }
            }
        } as any;

        if (!reportData.recommendations.eliteReport) {
            reportData.recommendations.eliteReport = {
                featureBreakdown: [
                    { featureName: "Front Profile", score: 8.2, analysis: "Excellent facial proportions with strong zygomatic width." },
                    { featureName: "Side Profile", score: 7.9, analysis: "Balanced chin projection and ideal nasofrontal angle." },
                    { featureName: "Jawline", score: 8.5, analysis: "Sharp gonial angle with defined jaw-to-neck separation." },
                    { featureName: "Facial Harmony", score: 8.0, analysis: "High symmetry across facial thirds and golden ratio mapping." }
                ],
                structuralVerdict: "Your structural foundation is solid. Focus on the refinement markers to achieve Legendary status.",
                technicalAssets: [
                    { term: "Zygomatic Width", explanation: "Prominent cheekbones providing structural framing." },
                    { term: "Gonial Angle", explanation: "Ideal 121-degree angle defining the lower face." }
                ],
                technicalDeficits: [
                    { term: "Slight Under-eye Hollowness", explanation: "Can be addressed with hydration and rest." }
                ]
            };
        }
        if (!reportData.recommendations.faceBig6Insights) {
            reportData.recommendations.faceBig6Insights = {
                eyes: "Your eye shape has positive canthal tilt, giving a sharp, alert look. No signs of hooding or fatigue.",
                nose: "Your nose profile is straight and proportional to your midface. It anchors your facial symmetry well.",
                jawline: "Strong gonial angle. Your jawline is well-defined and separates cleanly from your neck.",
                chin: "Chin projection is balanced with your lower lip. No signs of recession.",
                midface: "Compact midface ratio gives you a highly youthful and aesthetic framing.",
                harmony: "All facial thirds are exceptionally balanced. Your facial architecture scores very highly."
            };
        }
    }

    const eliteReport = reportData?.recommendations?.eliteReport;

    // Empty / partial data states. We guard each independent shape so a missing
    // recommendations payload (e.g. LLM stage failed) doesn't blow up the whole tab.
    if (!reportData?.analysis?.face || !reportData?.faceState || !reportData?.recommendations || !eliteReport) {
        const isMissingRecs = !!reportData?.analysis?.face && !!reportData?.faceState && (!reportData?.recommendations || !eliteReport);
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 pt-16">
                <div className="relative mb-8">
                    <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(99,102,241,0.15)] mx-auto">
                        <svg className="w-14 h-14 text-indigo-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div className="absolute inset-0 w-28 h-28 mx-auto rounded-[2.5rem] border border-indigo-500/10 animate-ping" style={{ animationDuration: '3s' }} />
                </div>
                <h2 className="text-3xl font-black text-[#1D1D1F] tracking-tight mb-3">
                    {isMissingRecs ? (
                        <>{localized('Signal Pending', 'Sinyal Beklemede')}<br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">{localized('For This Scan', 'Bu Ölçüm İçin')}</span>
                        </>
                    ) : (
                        <>{localized('Your Face Signal', 'Yüz Sinyalin')}<br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">{localized('Locked', 'Kilitli')}</span>
                        </>
                    )}
                </h2>
                <p className="text-[15px] text-[#48484A] leading-relaxed max-w-[300px] mb-8">
                    {isMissingRecs
                        ? localized("We couldn't generate structural notes for this scan. Run a new scan; trends hate gaps.", "Bu ölçüm için yapısal yorum üretilemedi. Yeni bir tarama al; trend boşluk sevmez.")
                        : localized('Take the first scan to unlock face archetype, Big 6 scores, symmetry, and structural verdict.', 'Yüz arketipi, Big 6 skorları, simetri ve yapısal verdict için ilk ölçümü al.')}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {localized(['Face archetype', 'Big 6 scores', 'Symmetry', 'Structural signal'], ['Yüz arketipi', 'Big 6 skorları', 'Simetri', 'Yapısal sinyal']).map(f => (
                        <div key={f} className="px-3 py-1.5 bg-black/[0.04] border border-black/[0.06] rounded-full text-xs text-[#48484A] font-medium">
                            {f}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const debug = reportData.scoring?.face?.archetypeDebug;
    const faceBig6Scores = resolveFaceBig6(reportData);
    const faceBig6Insights = reportData.recommendations?.faceBig6Insights;

    const openFeature = (id: FaceFeatureId) => setSelectedFeature(id);

    return (
        <div className="w-full">
            {/* PAGE 1 — Face Dashboard */}
            <FaceOverview
                data={reportData}
                history={history}
                onSeeAll={() => setShowDetails(true)}
                onSelectFeature={openFeature}
                onArchetypeClick={debug ? () => setShowDebug(true) : undefined}
            />

            {/* PAGE 2 — See Your Details (slide-up) */}
            {showDetails && (
                <FaceDetailsList
                    scores={faceBig6Scores}
                    onClose={() => setShowDetails(false)}
                    onSelectFeature={openFeature}
                />
            )}

            {/* PAGE 3 — Feature Detail (slide-up, stacks above page 2) */}
            {selectedFeature && (
                <FaceFeatureDetail
                    featureId={selectedFeature}
                    scores={faceBig6Scores}
                    aiExplanation={faceBig6Insights?.[selectedFeature]}
                    isFreeUser={isFreeUser}
                    onClose={() => setSelectedFeature(null)}
                    onShowPaywall={onShowPaywall}
                    onNavigateToRecommendations={onNavigateToRecommendations}
                />
            )}

            {/* DEV LOG MODAL */}
            {showDebug && debug && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] border border-black/5 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#F5F5F7]/50">
                            <h3 className="text-sm font-black text-[#1D1D1F] uppercase tracking-widest italic">Archetype Engine Log</h3>
                            <button onClick={() => setShowDebug(false)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-colors text-xs">✕</button>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">Trait Analysis (0-10)</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(debug.traits).map(([trait, val]) => (
                                        <div key={trait} className="bg-[#F5F5F7] p-3 rounded-2xl border border-black/5">
                                            <p className="text-[9px] text-[#86868B] font-bold uppercase truncate">{trait.replace('_', ' ')}</p>
                                            <p className="text-sm font-black text-[#1D1D1F]">{val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Candidate Rankings</p>
                                <div className="space-y-2">
                                    {debug.candidates.sort((a, b) => b.score - a.score).map((c) => (
                                        <div key={c.id} className={`p-4 rounded-3xl border ${c.passedGate ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/10 opacity-50'}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-black text-white uppercase">{c.displayName}</span>
                                                <span className="text-xs font-black text-white italic">%{Math.round(c.score)}</span>
                                            </div>
                                            <p className={`text-[8px] font-bold uppercase tracking-widest ${c.passedGate ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {c.passedGate ? 'Gate Passed' : `Blocked: ${c.gateTrait} (${c.gateValue} < ${c.gateThreshold})`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-white/[0.02] text-center border-t border-white/5">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest italic">Transparency Protocol Active</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaceAnalysis;
