import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon } from './icons/CameraIcon';
import { SkipForwardIcon } from './icons/SkipForwardIcon';
import { DailyReport } from '../types';
import { isToday } from '../utils/date';
import { t } from '../localization';
import FaceScanCamera from './FaceScanCamera';
import type { ComprehensiveFaceState } from '../services/faceScan/faceState';
import { runFullPipeline } from '../services/pipeline/analysisPipeline';


interface UploadScreenProps {
    onAnalysisComplete: (report: DailyReport) => void;
    onNeedAuth: () => void;
    onSkip: () => void;
    history: DailyReport[];
    autoStartCamera?: boolean;
    userData?: { age: string; gender: string } | null;
    user: any;
    forceStartAnalysis?: boolean;
}

const ANALYSIS_STEPS = [
    { label: "Mapping facial geometry", icon: "📐" },
    { label: "Analyzing skin texture", icon: "🔬" },
    { label: "Evaluating symmetry", icon: "⚖️" },
    { label: "Scanning hydration levels", icon: "💧" },
    { label: "Spectral biomarker scan", icon: "🧬" },
    { label: "Generating your report", icon: "✨" },
];

const DETECTION_LABELS = [
    { label: "Pore Size", x: 22, y: 28, delay: 1.0 },
    { label: "Texture", x: 75, y: 24, delay: 2.2 },
    { label: "Melanin", x: 18, y: 48, delay: 3.4 },
    { label: "Hydration", x: 78, y: 52, delay: 4.6 },
    { label: "Fine Lines", x: 25, y: 68, delay: 5.8 },
    { label: "Elasticity", x: 72, y: 72, delay: 7.0 },
];

const ScanAnalysisVisualizer: React.FC<{ faceState?: ComprehensiveFaceState; debugLogs?: string[] }> = ({ faceState, debugLogs = [] }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [visibleLabels, setVisibleLabels] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % ANALYSIS_STEPS.length);
        }, 2200);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + 0.6, 96));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Stagger detection labels
    useEffect(() => {
        const timers = DETECTION_LABELS.map((dl, i) =>
            setTimeout(() => setVisibleLabels(prev => Math.max(prev, i + 1)), dl.delay * 1000)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    const userPhoto = faceState?.primaryImageJpegBase64
        ? `data:image/jpeg;base64,${faceState.primaryImageJpegBase64}`
        : null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#FAFAFA] overflow-hidden">

            {/* ═══ HERO PHOTO SECTION (~60% of screen) ═══ */}
            <div className="relative w-full flex-[0_0_58%] overflow-hidden">
                {/* User's front photo — large, cinematic (base layer) */}
                {userPhoto ? (
                    <img
                        src={userPhoto}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                        alt=""
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                )}

                {/* Mirror overlay — same photo, scaleX(-1), animasyonlu fade */}
                {userPhoto && (
                    <motion.img
                        src={userPhoto}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{ scaleX: -1 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.35, 0.15, 0.35, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        alt=""
                    />
                )}

                {/* Cinematic vignette */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `
                            radial-gradient(ellipse 80% 70% at 50% 45%, transparent 40%, rgba(5,5,5,0.6) 100%),
                            linear-gradient(to bottom, transparent 60%, #050505 100%)
                        `
                    }}
                />

                {/* Purple scanning beam */}
                <motion.div
                    className="absolute left-0 right-0 h-[2px] pointer-events-none z-20"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.4) 20%, rgba(168,85,247,1) 50%, rgba(168,85,247,0.4) 80%, transparent 100%)',
                        boxShadow: '0 0 30px rgba(168,85,247,0.6), 0 0 60px rgba(168,85,247,0.3)',
                    }}
                    animate={{ top: ['5%', '85%', '5%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Second subtle scan beam (offset) */}
                <motion.div
                    className="absolute left-0 right-0 h-[1px] pointer-events-none z-20 opacity-40"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)',
                    }}
                    animate={{ top: ['80%', '10%', '80%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />

                {/* Detection labels floating on photo */}
                {DETECTION_LABELS.slice(0, visibleLabels).map((dl, i) => (
                    <motion.div
                        key={dl.label}
                        className="absolute z-30 flex items-center gap-1.5"
                        style={{ left: `${dl.x}%`, top: `${dl.y}%` }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Pulsing dot */}
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-black shadow-sm" />
                        </span>
                        {/* Label pill */}
                        <span className="text-[10px] font-semibold text-gray-800 bg-white backdrop-blur-sm px-2 py-0.5 rounded-full border border-gray-200 whitespace-nowrap">
                            {dl.label}
                        </span>
                    </motion.div>
                ))}

                {/* Top close button and AI badge */}
                <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-5 pt-12">
                    <div /> {/* spacer */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-2 bg-white backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                        <span className="text-[11px] font-semibold text-gray-800 tracking-wide">AI ACTIVE</span>
                    </motion.div>
                </div>

                {/* Grid overlay — subtle */}
                <div
                    className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
                        `,
                        backgroundSize: '48px 48px',
                    }}
                />
            </div>

            {/* ═══ BOTTOM GLASSMORPHIC PANEL ═══ */}
            <motion.div
                className="relative flex-1 z-20"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Top edge glow line */}
                <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                <div className="flex flex-col items-center justify-center h-full px-8 pb-6 pt-4">
                    {/* Title */}
                    <h2 className="text-[22px] font-bold text-white tracking-tight mb-1">
                        Analyzing Your Skin
                    </h2>
                    <p className="text-xs text-gray-500 mb-3">
                        Processing 120+ data points from your scan
                    </p>

                    {/* Animated step indicator */}
                    <div className="w-full mb-3">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center justify-center gap-2.5 h-10 bg-gray-50 rounded-xl border border-gray-200 px-4"
                            >
                                <span className="text-base">{ANALYSIS_STEPS[currentStep].icon}</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {ANALYSIS_STEPS[currentStep].label}
                                </span>
                                <motion.span
                                    className="text-gray-500 text-xs"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                >
                                    •••
                                </motion.span>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full mb-2">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2.5">
                            <motion.div
                                className="h-full rounded-full"
                                style={{
                                    width: `${progress}%`,
                                    background: 'linear-gradient(90deg, #9333ea, #6366f1, #8b5cf6)',
                                }}
                                transition={{ duration: 0.15, ease: "linear" }}
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] text-gray-600 font-mono tabular-nums">{Math.round(progress)}%</span>
                            <span className="text-[11px] text-gray-600">
                                Step {Math.min(currentStep + 1, ANALYSIS_STEPS.length)}/{ANALYSIS_STEPS.length}
                            </span>
                        </div>
                    </div>

                    {/* DEBUG LOG OVERLAY — visible on phone */}
                    {debugLogs.length > 0 && (
                        <div className="w-full max-h-28 overflow-y-auto bg-white border border-yellow-500/30 rounded-lg p-2 mt-1">
                            <p className="text-[9px] text-yellow-400 font-bold mb-1">🔍 DEBUG LOG</p>
                            {debugLogs.map((log, i) => (
                                <p key={i} className={`text-[9px] font-mono leading-tight ${
                                    log.startsWith('❌') ? 'text-red-400' :
                                    log.startsWith('✅') ? 'text-green-400' :
                                    log.startsWith('⏳') ? 'text-yellow-300' :
                                    'text-gray-400'
                                }`}>{log}</p>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const UploadScreen: React.FC<UploadScreenProps> = ({ onAnalysisComplete, onNeedAuth, onSkip, history, autoStartCamera = false, userData, user, forceStartAnalysis }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [useCameraScan, setUseCameraScan] = useState(false); // Default false, strictly controlled
    const [currentFaceState, setCurrentFaceState] = useState<ComprehensiveFaceState | undefined>(undefined);
    const [pendingFaceState, setPendingFaceState] = useState<ComprehensiveFaceState | null>(null);

    const dayNumber = history.length + 1;
    const hasUploadedToday = history.length > 0 && isToday(history[history.length - 1].date);

    // Auto-start camera if requested
    useEffect(() => {
        if (autoStartCamera) {
            setUseCameraScan(true);
        }
    }, [autoStartCamera]);

    // Auto-trigger pipeline when user logs in (or guest) after face capture
    useEffect(() => {
        if (pendingFaceState && (user || forceStartAnalysis)) {
            const fs = pendingFaceState;
            setPendingFaceState(null);
            runAnalysisPipeline(fs);
        }
    }, [user, forceStartAnalysis, pendingFaceState]);

    const addLog = (msg: string) => setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);

    // Step 1: Face captured from camera — check auth before running pipeline
    const handleFaceCaptured = (faceState: ComprehensiveFaceState) => {
        setCurrentFaceState(faceState);
        setUseCameraScan(false);

        if (user) {
            // User already logged in — run pipeline immediately
            runAnalysisPipeline(faceState);
        } else {
            // Not logged in — save face state and show auth gate
            setPendingFaceState(faceState);
            onNeedAuth();
        }
    };

    // Step 2: Actual analysis pipeline
    const runAnalysisPipeline = async (faceState: ComprehensiveFaceState) => {
        setCurrentFaceState(faceState);
        setLoading(true);
        setError(null);
        setDebugLogs([]);

        addLog('⏳ Pipeline starting...');

        try {
            const previewUrl = `data:image/jpeg;base64,${faceState.primaryImageJpegBase64}`;
            addLog(`✅ Image ready (${Math.round(previewUrl.length / 1024)}KB)`);

            // Get previous scan data for Delta (Δ) trend analysis
            const previousScanData = history.length > 0 ? history[history.length - 1] : undefined;
            addLog(`⏳ Running full pipeline (detection + scoring + LLM)...`);

            // NEW PIPELINE: Run full analysis pipeline
            const pipelineResult = await runFullPipeline(faceState, userData, previousScanData, addLog);
            addLog(`✅ Pipeline done! Score: ${pipelineResult.scoring.globalScore}`);

            // [SECURITY] Fetch Authorized Score from Backend
            // We send the 'faceState' or metrics to server, server calculates Score.
            // If Free User -> Server returns NULL for score.
            let authorizedGeneralScore: number | null = pipelineResult.scoring.globalScore;
            let authorizedPotentialScore: number | null = pipelineResult.scoring.potentialScore;

            try {
                // Use relative URL (goes through Vite proxy to server.js)
                const dashController = new AbortController();
                const dashTimeout = setTimeout(() => dashController.abort(), 10000);

                const response = await fetch('/api/dashboard', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: previewUrl,
                        scores: {
                            general: pipelineResult.scoring.globalScore,
                            potential: pipelineResult.scoring.potentialScore
                        }
                    }),
                    signal: dashController.signal,
                });

                clearTimeout(dashTimeout);

                if (response.ok) {
                    const serverRes = await response.json();
                    if (serverRes.success && serverRes.data.scores) {
                        authorizedGeneralScore = serverRes.data.scores.general ?? pipelineResult.scoring.globalScore;
                        authorizedPotentialScore = serverRes.data.scores.potential ?? pipelineResult.scoring.potentialScore;
                    }
                }
            } catch (e) {
                // Backend auth failed, using local score silently
            }

            // Create new report with pipeline structure AND Authorized Scores
            const newReport: DailyReport = {
                id: `report-${Date.now()}`,
                date: new Date().toISOString(),
                imageUrl: previewUrl,
                global_score: authorizedGeneralScore, // HIDDEN if null

                // New pipeline structure
                faceState: pipelineResult.faceState,
                analysis: pipelineResult.analysis,
                scoring: {
                    ...pipelineResult.scoring,
                    globalScore: authorizedGeneralScore ?? 0, // Fallback for TS, but UI handles null check
                    potentialScore: authorizedPotentialScore ?? 0
                },
                recommendations: pipelineResult.recommendations,

                // Legacy compatibility (can be removed later)
                low_confidence: pipelineResult.faceState.quality.overallConfidence < 0.7,
                daily_note: pipelineResult.recommendations.motivationalNote,
            };

            addLog('✅ Report created, navigating...');
            setLoading(false);
            onAnalysisComplete(newReport);
        } catch (err: any) {
            addLog(`❌ FAILED: ${err.message}`);
            setError(`${t.analysisFailed} (${err.message})`);
            setLoading(false);
        }
    };

    if (loading) {
        return <ScanAnalysisVisualizer faceState={currentFaceState} debugLogs={debugLogs} />;
    }

    // Main Render
    return (
        <div className="flex flex-col h-full bg-[#FAFAFA] text-white relative overflow-hidden">
            {/* Modern Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[80px]" />
                <div className="absolute inset-0 bg-noise-subtle opacity-30" />
            </div>

            <div className="z-10 flex flex-col items-center justify-center p-6 h-full text-center">

                {!useCameraScan && (
                    <div className="flex flex-col items-center max-w-sm animate-fade-in-up">
                        {/* Hero Visual - Face Guide */}
                        <div className="relative mb-8 group cursor-pointer" onClick={() => setUseCameraScan(true)}>
                            <div className="absolute inset-0 bg-black rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                            <div className="relative w-40 h-40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                                <img
                                    src="/images/face_guide.png"
                                    alt="Face Scan Guide"
                                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] opacity-90"
                                />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-3">
                            {t.faceScan || "Face Scan"}
                        </h1>
                        <p className="text-gray-400 text-sm mb-12 max-w-xs leading-relaxed">
                            {t.startScanDescription || "Identify skin health, structure, and spectral biomarkers in seconds."}
                        </p>

                        <button
                            onClick={() => setUseCameraScan(true)}
                            className="w-full bg-black  text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-sm transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group"
                        >
                            <CameraIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span>{t.startScan || "Start Live Scan"}</span>
                        </button>

                        <button onClick={onSkip} className="mt-6 flex items-center justify-center text-gray-500 hover:text-white text-sm transition-colors duration-300 py-2">
                            <SkipForwardIcon className="w-3 h-3 mr-1.5" />
                            {t.skipForNow}
                        </button>
                    </div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-red-900/20 border border-red-500/20 rounded-xl max-w-xs"
                    >
                        <p className="text-red-300 text-sm">{error}</p>
                    </motion.div>
                )}

                {useCameraScan && !loading && (
                    <div className="fixed inset-0 z-50 bg-black animate-fade-in">
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                setUseCameraScan(false);
                                if (autoStartCamera) onSkip(); // Return to results when in autoStart mode
                            }}
                            className="absolute top-6 right-6 z-[60] p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-500 hover:text-white border border-gray-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <FaceScanCamera
                            onFaceState={handleFaceCaptured}
                            onError={(e) => {
                                console.error(e);
                                setError("Camera failed. Please check permissions.");
                                setUseCameraScan(false);
                                if (autoStartCamera) onSkip();
                            }}
                            onClose={() => {
                                setUseCameraScan(false);
                                if (autoStartCamera) onSkip();
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadScreen;
