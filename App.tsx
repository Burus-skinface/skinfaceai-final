
import React, { useState, useEffect } from "react";
import { DailyReport } from "./types";
import UploadScreen from "./components/UploadScreen";
import Results from "./components/Results";
import Progress from "./components/Progress";
import FaceAnalysis from "./components/FaceAnalysis";
import Recommendations from "./components/Recommendations";
import { t } from "./localization";

import { SkinLayerIcon } from "./components/icons/SkinIcon";
import { LineChartIcon } from "./components/icons/LineChartIcon";
import { ScanFaceIcon } from "./components/icons/ScanFaceIcon";
import { Sparkles } from "./components/icons/SparklesIcon";
import { CameraIcon } from "./components/icons/CameraIcon";
import Paywall from "./components/Paywall";
import { supabase } from "./services/supabase";
import OnboardingManager from "./components/onboarding/OnboardingManager";
import ScanCTA from "./components/onboarding/ScanCTA";
import GlobalAppHeader from "./components/GlobalAppHeader";
import NotificationSettings from "./components/NotificationSettings";
import AuthGate from "./components/AuthGate";
import SplashScreen from "./components/SplashScreen";
import { ToastProvider, useToast } from "./components/ui/Toast";
import { scheduleAllNotifications, getNotificationPreferences } from "./utils/notifications";
import { updateStreak } from "./utils/streak";
import { savePendingReferral, trackReferralSignup } from "./services/referralService";
import { saveScanThumbnail } from "./utils/pendingScan";
import { trackEvent } from "./utils/analytics";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useSubscription } from "./hooks/useSubscription";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";


const AppInner: React.FC = () => {
  // Load history from localStorage on mount
  const [history, setHistory] = useState<DailyReport[]>(() => {
    const saved = localStorage.getItem("face_analysis_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [user, setUser] = useState<any>(null);

  // State variables
  const [activeTab, setActiveTab] = useState("results");
  const [analysisData, setAnalysisData] = useState<DailyReport | null>(() => {
    // On mount, load the last report if exists
    const saved = localStorage.getItem("face_analysis_history");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed[parsed.length - 1];
    }
    return null;
  });
  const [contentKey, setContentKey] = useState(0);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [showScanCamera, setShowScanCamera] = useState(false);
  const [showReadyToScan, setShowReadyToScan] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [forceStartAnalysis, setForceStartAnalysis] = useState(false);
  const toast = useToast();

  // Splash + Auth loading screen
  const [showSplash, setShowSplash] = useState(true);

  // Network State
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  // Onboarding State
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [sessionOnboardingComplete, setSessionOnboardingComplete] = useState(false);

  // Onboarding Data State
  const [userData, setUserData] = useState<{ age: string; gender: string } | null>(() => {
    const saved = localStorage.getItem("user_demographics");
    return saved ? JSON.parse(saved) : null;
  });
  const {
    isPremium,
    hasAccess,
    refreshSubscription,
    activateDevSubscription,
  } = useSubscription(user?.id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Detect referral code from URL on mount + native deep links
  useEffect(() => {
    const captureRef = (refCode: string | null) => {
      if (!refCode) return;
      savePendingReferral(refCode);
      console.log('📎 Referral code detected:', refCode);
    };

    const params = new URLSearchParams(window.location.search);
    captureRef(params.get('ref'));
    if (params.get('ref')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.pathname);
    }

    if (Capacitor.isNativePlatform()) {
      CapacitorApp.getLaunchUrl().then((result) => {
        if (result?.url) {
          try {
            const launchParams = new URL(result.url);
            captureRef(launchParams.searchParams.get('ref'));
          } catch { /* ignore malformed launch URLs */ }
        }
      }).catch(() => {});

      const listener = CapacitorApp.addListener('appUrlOpen', (event) => {
        try {
          const openParams = new URL(event.url);
          captureRef(openParams.searchParams.get('ref'));
        } catch { /* ignore */ }
      });

      return () => {
        listener.then((l) => l.remove());
      };
    }
  }, []);

  // Auto-schedule notifications on mount
  useEffect(() => {
    const prefs = getNotificationPreferences();
    if (prefs.enabled) {
      scheduleAllNotifications(prefs);
    }
  }, []);

  // Back button handling & Offline detector
  useEffect(() => {
    // 1. Offline Listener
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Android Back Button
    let backButtonListener: any = null;
    const registerBackButton = async () => {
      if (!Capacitor.isNativePlatform()) return;
      backButtonListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        // Handle overlays first
        if (isPaywallVisible) { setIsPaywallVisible(false); return; }
        if (showNotifSettings) { setShowNotifSettings(false); return; }
        if (showAuthGate) { setShowAuthGate(false); return; }
        if (showScanCamera || showReadyToScan) {
          setShowScanCamera(false);
          setShowReadyToScan(false);
          return;
        }

        // Handle tabs
        if (activeTab !== "results") {
          setActiveTab("results");
          window.scrollTo(0, 0);
          return;
        }

        // Exit or regular back
        if (canGoBack) {
           window.history.back();
        } else {
           CapacitorApp.exitApp();
        }
      });
    };
    registerBackButton();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (backButtonListener && backButtonListener.remove) {
        backButtonListener.remove();
      }
    };
  }, [activeTab, isPaywallVisible, showAuthGate, showScanCamera, showReadyToScan, showNotifSettings]);

  // Initialize RevenueCat SDK + check existing subscription on startup
  useEffect(() => {
    const initRC = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        const platform = Capacitor.getPlatform();
        if (platform === "ios") {
          await Purchases.configure({ apiKey: import.meta.env.VITE_REVENUECAT_IOS_KEY || "" });
        } else if (platform === "android") {
          await Purchases.configure({ apiKey: import.meta.env.VITE_REVENUECAT_ANDROID_KEY || "" });
        }
        await refreshSubscription();
      } catch (e) {
        console.error("RevenueCat setup error:", e);
      }
    };
    initRC();
  }, []);

  const handleOnboardingComplete = () => {
    setSessionOnboardingComplete(true);
  };

  const handleOnboardingCompleteWithData = (data: { age: string; gender: string }) => {
    setUserData(data);
    localStorage.setItem("user_demographics", JSON.stringify(data));
    setSessionOnboardingComplete(true);
    // Auto-start scan after onboarding
    setShowScanCamera(true);
  };

  const handleDevSkip = () => {
    activateDevSubscription();
    const data = { age: "25-34", gender: "neutral" };
    setUserData(data);
    localStorage.setItem("user_demographics", JSON.stringify(data));
    setSessionOnboardingComplete(true);
    
    // Create a mock report directly
    const mockReport: DailyReport = {
        id: `mock-report-${Date.now()}`,
        date: new Date().toISOString(),
        imageUrl: '/images/hero-scan-default.png',
        global_score: 7.8,
        faceState: {
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
        scoring: {
            scanId: 'mock-scan',
            globalScore: 7.8,
            potentialScore: 9.2,
            skin: {
                statusScores: { overallSkin: 8, hydration: 7, redness: 9, pores: 6, spots: 8 },
                overallScore: 8,
                ageEstimate: 26,
            },
            face: {
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
                    eyes: { score: 8.8, breakdown: "Symmetrical, positive canthal tilt" },
                    nose: { score: 8.5, breakdown: "Straight profile, proportional" },
                    jawline: { score: 9.0, breakdown: "Defined angle, sharp demarcation" },
                    chin: { score: 8.2, breakdown: "Balanced projection" },
                    midface: { score: 8.6, breakdown: "Compact ratios" },
                    harmony: { score: 8.9, breakdown: "Highly balanced thirds" }
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
            },
            spectral: {
                overallScore: 8,
                statusScores: { overallSpectral: 8 }
            }
        },
        analysis: {
            scanId: 'mock-scan',
            timestamp: Date.now(),
            skin: {
                features: {},
                zones: { forehead: { riskScore: 0.2 }, leftCheek: { riskScore: 0.5 }, rightCheek: { riskScore: 0.1 }, chin: { riskScore: 0.8 }, nose: { riskScore: 0.3 } },
            },
            face: {
                landmarks: {},
                ratios: {},
                profile: { faceShape: 'Oval' }
            },
            spectral: { uvDamage: 0.2, hyperpigmentation: 0.3, vascular: 0.1, darkCircles: 0.4 },
        },
        recommendations: {
            motivationalNote: 'You have a great foundation, just a few tweaks away from your maximum potential.',
            skincare: [
                { category: 'Cleanser', why: 'To deeply clean pores.', name: 'Salicylic Acid Cleanser', usageTime: 'Morning' },
                { category: 'Moisturizer', why: 'To improve hydration and barrier function.', name: 'Hyaluronic Acid Cream', usageTime: 'Evening' }
            ],
            lifestyle: [
                { title: 'Drink More Water', description: 'Improves skin hydration and overall health.', impact: 8 },
                { title: 'Sleep 8 Hours', description: 'Reduces dark circles and stress markers.', impact: 9 }
            ],
            big6Insights: {
                acneClarity: "Minimal active breakouts. Focus on preventing congestion in the T-zone.",
                texturePores: "Generally smooth, but visible pores around the cheeks and nose.",
                barrierDefense: "Strong overall, but slight compromise detected on the chin area.",
                sebumDynamics: "Slightly oily in the T-zone, well-balanced elsewhere.",
                toneUniformity: "Even tone with minor post-inflammatory hyperpigmentation.",
                visualFatigue: "Good radiance, but dark circles indicate slight visual fatigue."
            },
            eliteReport: {
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
            },
            faceBig6Insights: {
                eyes: "Your eye shape has positive canthal tilt, giving a sharp, alert look. No signs of hooding or fatigue.",
                nose: "Your nose profile is straight and proportional to your midface. It anchors your facial symmetry well.",
                jawline: "Strong gonial angle. Your jawline is well-defined and separates cleanly from your neck.",
                chin: "Chin projection is balanced with your lower lip. No signs of recession.",
                midface: "Compact midface ratio gives you a highly youthful and aesthetic framing.",
                harmony: "All facial thirds are exceptionally balanced. Your facial architecture scores very highly."
            }
        }
    } as any; // Cast as any because the type definitions might be slightly strict in this old codebase

    setHistory([mockReport]);
    setAnalysisData(mockReport);
    localStorage.setItem("face_analysis_history", JSON.stringify([mockReport]));
    setActiveTab("results");
    setContentKey(prev => prev + 1);
  };

  // Sync with Supabase on Auth Change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      // Track referral signup when user authenticates
      if (session?.user && event === 'SIGNED_IN') {
        trackReferralSignup(session.user.id).catch(console.error);
        if (Capacitor.isNativePlatform()) {
          try { await Purchases.logIn({ appUserID: session.user.id }); } catch(e){}
        }
      }

      if (session?.user) {
        try {
          // 1. Fetch User Profile (Demographics)
          const { data: profile } = await supabase
            .from('profiles')
            .select('gender, age_range')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const newData = {
              age: profile.age_range || '25-34',
              gender: profile.gender || 'neutral'
            };
            setUserData(newData);
            localStorage.setItem("user_demographics", JSON.stringify(newData));
          }

          // 2. Fetch Cloud History
          const { data: cloudHistory } = await supabase
            .from('scans')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true });

          if (cloudHistory && cloudHistory.length > 0) {
            const validHistory = (cloudHistory as any[]).map(h => {
              const scoring = h.scoring ?? h.analysis_results?.scoring;
              const analysis = h.analysis_results ?? h.analysis;
              return {
                id: h.id,
                date: h.created_at,
                imageUrl: h.image_url || undefined,
                faceState: h.face_state,
                analysis,
                scoring,
                recommendations: h.recommendations,
                timestamp: new Date(h.created_at).getTime(),
                global_score: scoring?.globalScore ?? analysis?.scoring?.globalScore ?? 0,
              };
            }) as DailyReport[];

            // 3. SAFE MERGE: Combine Cloud + Local
            setHistory(prevLocal => {
              const combined = [...validHistory];
              const cloudIds = new Set(validHistory.map(r => r.id));

              prevLocal.forEach(localItem => {
                if (!cloudIds.has(localItem.id)) {
                  combined.push(localItem);
                }
              });

              const sorted = combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              // Save to localStorage WITHOUT base64 data to prevent QuotaExceededError
              const historyToSave = sorted.map(report => ({
                  ...report,
                  imageUrl: undefined,
                  faceState: report.faceState ? {
                      ...report.faceState,
                      primaryImageJpegBase64: undefined,
                      retainedCropJpegBase64: undefined
                  } : undefined
              }));
              localStorage.setItem("face_analysis_history", JSON.stringify(historyToSave));

              // Set latest as analysisData
              if (sorted.length > 0) {
                setAnalysisData(sorted[sorted.length - 1]);
              }

              return sorted;
            });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
      setIsAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // NOTE: We previously had a `pendingReport` flow here that paired with a `setPendingReport`
  // setter that was never actually called. The post-auth save path is fully handled by
  // UploadScreen via `forceStartAnalysis` + the in-component `pendingFaceState` queue.

  const handleShowPaywall = () => {
    setIsPaywallVisible(true);
  };

  const handleClosePaywall = () => {
    setIsPaywallVisible(false);
  };

  // Called when RevenueCat confirms a successful purchase
  const handleUpgrade = async () => {
    await refreshSubscription();
    setIsPaywallVisible(false);
    // Persist premium status to Supabase so other devices also know
    if (user) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          is_premium: true,
          premium_since: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Failed to sync premium status to cloud:', e);
      }
    }
  };

  const changeTab = (tab: string) => {
    if ((tab === 'face' && !hasAccess('face')) || (tab === 'recommendations' && !hasAccess('recommendations'))) {
      setIsPaywallVisible(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleStartScan = () => {
    setShowReadyToScan(true);
  };

  const handleConfirmScan = () => {
    setShowReadyToScan(false);
    setShowScanCamera(true);
  };

  const handleAnalysisComplete = async (newReport: DailyReport) => {
    saveScanThumbnail(newReport.id, newReport.imageUrl);

    // Pipeline only runs after auth (user or guest), so always save
    // 1. Add to history (Optimistic UI Update)
    const updatedHistory = [...history, newReport];
    setHistory(updatedHistory);

    // Advance daily streak (idempotent within the same day)
    try {
      updateStreak();
    } catch (e) {
      console.warn("[STREAK] update failed", e);
    }

    try {
      const historyToSave = updatedHistory.map(report => ({
          ...report,
          imageUrl: undefined, // Strip large base64 image to prevent QuotaExceededError
          faceState: report.faceState ? {
              ...report.faceState,
              primaryImageJpegBase64: undefined,
              retainedCropJpegBase64: undefined
          } : undefined
      }));
      localStorage.setItem("face_analysis_history", JSON.stringify(historyToSave));
    } catch (err: any) {
      console.error("Storage Save Failed:", err);
      toast.error("Couldn't save history locally — device storage is full. Your analysis still loads, but old scans may not persist.");
    }

    // 2. Persist to Cloud (Supabase) if logged in
    if (user) {
      try {
        const { error } = await supabase.from('scans').insert({
          id: newReport.id,
          user_id: user.id,
          image_url: newReport.imageUrl,
          face_state: newReport.faceState,
          analysis_results: newReport.analysis,
          scoring: newReport.scoring,
          recommendations: newReport.recommendations,
          created_at: newReport.date
        });

        if (error) {
          console.error("Supabase Save Error:", error);
          toast.error("Couldn't sync this scan to the cloud. Your scan is saved on this device.");
        }
      } catch (err) {
        console.error("Failed to save scan to cloud:", err);
        toast.error("Couldn't sync this scan to the cloud. Your scan is saved on this device.");
      }
    }

    // 3. Set as current Analysis
    setAnalysisData(newReport);
    setShowScanCamera(false);
    setForceStartAnalysis(false);
    setActiveTab("results");
    trackEvent('scan_completed', {
      score: newReport.scoring?.globalScore,
      hasRecommendations: Boolean(newReport.recommendations?.dailyRoutine?.morning?.length),
    });

    // 4. Increment content key to force re-render/animation
    setContentKey(prev => prev + 1);
  };

  // Auth gate handlers
  const handleNeedAuth = () => {
    setShowAuthGate(true);
  };

  const handleAuthGateAuthenticated = () => {
    // Auth listener in useEffect will set user → UploadScreen useEffect detects user + pendingFaceState → pipeline starts
    setShowAuthGate(false);
  };

  const handleAuthGateGuest = () => {
    // Guest mode: close auth gate and signal UploadScreen to start pipeline
    setShowAuthGate(false);
    setForceStartAnalysis(true);
  };

  const handleSelectReport = (reportId: string) => {
    const report = history.find(r => r.id === reportId);
    if (report) {
      setAnalysisData(report);
      setActiveTab("results");
      setContentKey(prev => prev + 1);
    }
  };

  // Loading screen during auth check
  if (showSplash || isAuthChecking) {
    return (
      <SplashScreen
        onReady={() => setShowSplash(false)}
        minDisplayMs={2200}
      />
    );
  }

  // Onboarding flow
  const isGuest = !user;
  const needsOnboarding = isGuest && !sessionOnboardingComplete;

  if (needsOnboarding) {
    return <OnboardingManager onComplete={handleOnboardingComplete} onCompleteWithData={handleOnboardingCompleteWithData} onDevSkip={handleDevSkip} initialStep={1} />;
  }

  // CRITICAL PM FIX: User has no scan history → never show empty main app.
  // Always drive them to first scan (ScanCTA acts as Step 4 fallback).
  // If user exits/skips camera, they are routed right back here instead of the empty Turkish pages.
  if (history.length === 0 && !showScanCamera && !showReadyToScan && !showAuthGate) {
    return <ScanCTA onStart={handleConfirmScan} onBack={() => {
        if (isGuest) {
            setSessionOnboardingComplete(false);
        } else {
            setShowReadyToScan(true);
        }
    }} />;
  }

  // Show ready to scan screen — use the premium ScanCTA from onboarding
  if (showReadyToScan) {
    return <ScanCTA onStart={handleConfirmScan} onBack={() => setShowReadyToScan(false)} />;
  }


  // Show camera for scanning
  if (showScanCamera) {
    return <>
      <UploadScreen
        onAnalysisComplete={handleAnalysisComplete}
        onNeedAuth={handleNeedAuth}
        onContinueAsGuest={handleAuthGateGuest}
        onSkip={() => setShowScanCamera(false)}
        history={history}
        autoStartCamera={true}
        userData={userData}
        user={user}
        forceStartAnalysis={forceStartAnalysis}
      />
      {/* Auth Gate must render here too — otherwise the early return hides it */}
      {showAuthGate && (
        <AuthGate
          onAuthenticated={handleAuthGateAuthenticated}
          onGuest={handleAuthGateGuest}
        />
      )}
    </>;
  }

  // If no history and no analysis data, show empty state instead of forcing scan

  const dayNumberForReport = analysisData ? (() => {
    const currentReportIndex = history.findIndex(r => r.id === analysisData.id);
    if (currentReportIndex === -1) return 1;

    const relevantHistory = history.slice(0, currentReportIndex + 1);
    const uniqueDates = new Set(
      relevantHistory.map(r => new Date(r.date).toDateString())
    );

    return uniqueDates.size;
  })() : 0;

  const handleLogout = async () => {
    // Clear user data and redirect to login
    setUser(null);
    setSessionOnboardingComplete(false);
    localStorage.removeItem('user_demographics');
    localStorage.removeItem('face_analysis_history');
    setHistory([]);
    setAnalysisData(null);
    if (Capacitor.isNativePlatform()) {
       try { await Purchases.logOut(); } catch(e) {}
    }
    await supabase.auth.signOut();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "results": return <Results
        data={analysisData}
        dayNumber={dayNumberForReport}
        onShowPaywall={handleShowPaywall}
        user={user}
        history={history}
        onNavigateToProgress={() => changeTab("progress")}
        onLogout={handleLogout}
        onNewScan={handleStartScan}
        onShowNotificationSettings={() => setShowNotifSettings(true)}
        isFreeUser={!isPremium}
        onNavigateToRecommendations={() => changeTab("recommendations")}
      />;
      case "progress": {
        return <Progress history={history} onSelectReport={handleSelectReport} compliment={null} onNewScan={handleStartScan} userId={user?.id ?? null} />;
      }
      case "face": return <FaceAnalysis
        data={analysisData}
        dayNumber={dayNumberForReport}
        history={history}
        isFreeUser={!isPremium}
        onShowPaywall={handleShowPaywall}
        onNavigateToRecommendations={() => changeTab("recommendations")}
      />;
      case "recommendations": return <Recommendations
        data={analysisData}
        gender={userData?.gender}
        user={user}
        isFreeUser={!isPremium}
        onShowPaywall={handleShowPaywall}
      />;
      default: return <Results
        data={analysisData}
        dayNumber={dayNumberForReport}
        onShowPaywall={handleShowPaywall}
        user={user}
        history={history}
        onNavigateToProgress={() => changeTab("progress")}
        onLogout={handleLogout}
        onNewScan={handleStartScan}
        onShowNotificationSettings={() => setShowNotifSettings(true)}
        isFreeUser={!isPremium}
        onNavigateToRecommendations={() => changeTab("recommendations")}
      />;
    }
  };

  return (
    <div className={`relative min-h-screen text-[#1D1D1F] overflow-x-hidden font-sans w-full h-full pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] ${activeTab === "results" ? "bg-[#fbf9f9]" : "bg-[#F5F5F7]"}`}>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500/90 text-white text-[11px] sm:text-xs font-bold text-center py-2 z-[200] backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)]">
          You are offline. Features may be limited.
        </div>
      )}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(168,85,247,0.05),rgba(255,255,255,0))]" />

      {/* Persistent Global Header - Visible on ALL tabs */}
      {contentKey >= 0 && !["results", "face", "recommendations"].includes(activeTab) && (
        <GlobalAppHeader user={user} onLogout={handleLogout} onShowNotificationSettings={() => setShowNotifSettings(true)} />
      )}

      <div className={`fade-in-up visible pb-28 ${["results", "face", "recommendations"].includes(activeTab) ? "pt-0" : activeTab === "progress" ? "pt-4" : "px-4 pt-28"} w-full max-w-lg mx-auto`} key={contentKey}>
        <ErrorBoundary key={contentKey}>
          {renderContent()}
        </ErrorBoundary>
      </div>

      {/* Bottom Navigation — Slim Floating Island */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-2xl border border-black/5 rounded-full px-5 py-2.5 flex items-center gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.08)] z-50">
        <button onClick={() => changeTab("results")} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-all duration-200 flex-1 min-w-[48px]">
          <SkinLayerIcon className={`w-5 h-5 ${activeTab === "results" ? "text-purple-400" : "text-gray-500"}`} />
          <span className={`text-[10px] font-medium ${activeTab === "results" ? "text-purple-400" : "text-gray-500"}`}>{t.results}</span>
        </button>

        <button onClick={() => changeTab("face")} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-all duration-200 flex-1 min-w-[48px]">
          <ScanFaceIcon className={`w-5 h-5 ${activeTab === "face" ? "text-purple-400" : "text-gray-500"}`} />
          <span className={`text-[10px] font-medium ${activeTab === "face" ? "text-purple-400" : "text-gray-500"}`}>{t.details}</span>
        </button>

        <button
          onClick={handleStartScan}
          className="flex flex-col items-center justify-center -mt-5 mx-1 transition-transform duration-200 active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-[#1D1D1F] flex items-center justify-center shadow-lg shadow-black/20 border-[3px] border-[#F5F5F7]">
            <CameraIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-[9px] text-[#86868B] mt-0.5 font-medium">Scan</span>
        </button>

        <button onClick={() => changeTab("recommendations")} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-all duration-200 flex-1 min-w-[48px]">
          <Sparkles className={`w-5 h-5 ${activeTab === "recommendations" ? "text-purple-400" : "text-gray-500"}`} />
          <span className={`text-[10px] font-medium ${activeTab === "recommendations" ? "text-purple-400" : "text-gray-500"}`}>{t.recommendations}</span>
        </button>

        <button onClick={() => changeTab("progress")} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-all duration-200 flex-1 min-w-[48px]">
          <LineChartIcon className={`w-5 h-5 ${activeTab === "progress" ? "text-purple-400" : "text-gray-500"}`} />
          <span className={`text-[10px] font-medium ${activeTab === "progress" ? "text-purple-400" : "text-gray-500"}`}>{t.progress}</span>
        </button>
      </div>

      {/* Paywall Overlay */}
      {isPaywallVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] fade-in-up visible">
          <Paywall onClose={handleClosePaywall} onUpgrade={handleUpgrade} />
        </div>
      )}

      {/* Auth Gate Overlay — shown after scan if not logged in */}
      {showAuthGate && (
        <AuthGate
          onAuthenticated={handleAuthGateAuthenticated}
          onGuest={handleAuthGateGuest}
        />
      )}

      {/* Notification Settings Modal */}
      {showNotifSettings && (
        <NotificationSettings onClose={() => setShowNotifSettings(false)} />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppInner />
  </ToastProvider>
);

export default App;
