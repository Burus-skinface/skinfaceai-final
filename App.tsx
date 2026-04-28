
import React, { useState, useEffect } from "react";
import { DailyReport } from "./types";
import UploadScreen from "./components/UploadScreen";
import Results from "./components/Results";
import Progress from "./components/Progress";
import FaceAnalysis from "./components/FaceAnalysis";
import Recommendations from "./components/Recommendations";
import { generateProgressCompliment } from "./services/geminiService";
import { FireIcon } from "./components/icons/FireIcon";
import { LockIcon } from "./components/icons/LockIcon";
import { t } from "./localization";

import { SkinLayerIcon } from "./components/icons/SkinIcon";
import { LineChartIcon } from "./components/icons/LineChartIcon";
import { ScanFaceIcon } from "./components/icons/ScanFaceIcon";
import { Sparkles } from "./components/icons/SparklesIcon";
import { SpectrumIcon } from "./components/icons/SpectrumIcon";
import { CameraIcon } from "./components/icons/CameraIcon";
import HistoryCalendar from './components/HistoryCalendar';
import DailyCheckIn from './components/DailyCheckIn';
import Paywall from "./components/Paywall";
import { supabase } from "./services/supabase";
import OnboardingManager from "./components/onboarding/OnboardingManager";
import ScanCTA from "./components/onboarding/ScanCTA";
import GlobalAppHeader from "./components/GlobalAppHeader";
import NotificationSettings from "./components/NotificationSettings";
import AuthGate from "./components/AuthGate";
import SplashScreen from "./components/SplashScreen";
import { scheduleAllNotifications, getNotificationPreferences } from "./utils/notifications";
import { savePendingReferral, trackReferralSignup } from "./services/referralService";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";


const App: React.FC = () => {
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
  const [progressCompliment, setProgressCompliment] = useState<string | null>(null);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [showDailyPrompt, setShowDailyPrompt] = useState(false);
  const [showScanCamera, setShowScanCamera] = useState(false);
  const [showReadyToScan, setShowReadyToScan] = useState(false);
  const [pendingReport, setPendingReport] = useState<DailyReport | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [forceStartAnalysis, setForceStartAnalysis] = useState(false);
  // Premium subscription state — the single source of truth for feature access
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('is_premium') === 'true';
  });

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Detect referral code from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      savePendingReferral(refCode);
      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.pathname);
      console.log('📎 Referral code detected:', refCode);
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
        if (showDailyPrompt) { setShowDailyPrompt(false); return; }
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
  }, [activeTab, isPaywallVisible, showAuthGate, showScanCamera, showReadyToScan, showNotifSettings, showDailyPrompt]);

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
        // P0 FIX: Always check if the user already has an active subscription on startup
        const ENTITLEMENT_ID = import.meta.env.VITE_RC_ENTITLEMENT_ID || 'premium';
        const { customerInfo } = await Purchases.getCustomerInfo();
        const hasActiveEntitlement = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
        setIsPremium(hasActiveEntitlement);
        localStorage.setItem('is_premium', hasActiveEntitlement ? 'true' : 'false');
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
            const validHistory = (cloudHistory as any[]).map(h => ({
              id: h.id,
              date: h.created_at,
              imageUrl: h.image_url || 'placeholder.jpg',
              faceState: h.face_state,
              analysis: h.analysis_results,
              recommendations: h.recommendations,
              timestamp: new Date(h.created_at).getTime(),
              global_score: h.analysis_results?.scoring?.totalScore || 0
            })) as DailyReport[];

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

  // Effect: When user logs in and there's a pending report, save it
  useEffect(() => {
    if (user && pendingReport) {
      const saveAndShow = async () => {
         // Save to local history WITHOUT base64 data (GDPR + QuotaExceededError guard)
        const stripHeavyData = (report: any) => ({
          ...report,
          imageUrl: undefined,
          faceState: report.faceState ? {
              ...report.faceState,
              primaryImageJpegBase64: undefined,
              retainedCropJpegBase64: undefined
          } : undefined
        });

        const updatedHistory = [...history, pendingReport];
        setHistory(updatedHistory);
        try {
          localStorage.setItem("face_analysis_history", JSON.stringify(updatedHistory.map(stripHeavyData)));
        } catch (err: any) {
          console.error("Storage Save Failed:", err);
        }

        // Save to Supabase
        try {
          const { error } = await supabase.from('scans').insert({
            id: pendingReport.id,
            user_id: user.id,
            image_url: pendingReport.imageUrl,
            face_state: pendingReport.faceState,
            analysis_results: pendingReport.analysis,
            recommendations: pendingReport.recommendations,
            created_at: pendingReport.date
          });
          if (error) console.error("Supabase Save Error:", error);
        } catch (err) {
          console.error("Failed to save scan to cloud:", err);
        }

        // Show results
        setAnalysisData(pendingReport);
        setPendingReport(null);
        setShowAuthGate(false);
        setShowScanCamera(false);
        setActiveTab("results");
        setContentKey(prev => prev + 1);
      };
      saveAndShow();
    }
  }, [user, pendingReport]);

  const handleShowPaywall = () => {
    setIsPaywallVisible(true);
  };

  const handleClosePaywall = () => {
    setIsPaywallVisible(false);
  };

  // P0 FIX: Called when RevenueCat confirms a successful purchase
  const handleUpgrade = async () => {
    setIsPremium(true);
    localStorage.setItem('is_premium', 'true');
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
    // Lock premium tabs for free users
    const premiumTabs = ['face', 'recommendations'];
    if (premiumTabs.includes(tab) && !isPremium) {
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
    // Pipeline only runs after auth (user or guest), so always save
    // 1. Add to history (Optimistic UI Update)
    const updatedHistory = [...history, newReport];
    setHistory(updatedHistory);

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
      alert(`⚠️ HISTORY SAVE FAILED (Storage Full?)\nError: ${err.message}\n\nAnalysis will still be shown!`);
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
          recommendations: newReport.recommendations,
          created_at: newReport.date // ISO string
        });

        if (error) console.error("Supabase Save Error:", error);
      } catch (err) {
        console.error("Failed to save scan to cloud:", err);
      }
    }

    // 3. Set as current Analysis
    setAnalysisData(newReport);
    setShowScanCamera(false);
    setForceStartAnalysis(false);
    setActiveTab("results");

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
    return <OnboardingManager onComplete={handleOnboardingComplete} onCompleteWithData={handleOnboardingCompleteWithData} initialStep={1} />;
  }

  // CRITICAL PM FIX: User has no scan history → never show empty main app.
  // Always drive them to first scan (ScanCTA acts as Step 4 fallback).
  // If user exits/skips camera, they are routed right back here instead of the empty Turkish pages.
  if (history.length === 0 && !showScanCamera && !showReadyToScan && !showAuthGate) {
    return <ScanCTA onStart={handleConfirmScan} onBack={() => {
        if (isGuest) {
            setSessionOnboardingComplete(false);
        } else {
            handleLogout();
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
        user={user}
        history={history}
        onNavigateToProgress={() => changeTab("progress")}
        onLogout={handleLogout}
      />;
      case "progress": {
        return <Progress history={history} onSelectReport={handleSelectReport} compliment={progressCompliment} />;
      }
      case "face": return <FaceAnalysis data={analysisData} dayNumber={dayNumberForReport} />;
      case "recommendations": return <Recommendations data={analysisData} gender={userData?.gender} />;
      default: return <Results
        data={analysisData}
        dayNumber={dayNumberForReport}
        user={user}
        history={history}
        onNavigateToProgress={() => changeTab("progress")}
        onLogout={handleLogout}
      />;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F5F5F7] text-[#1D1D1F] overflow-x-hidden font-sans w-full h-full pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]">
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500/90 text-white text-[11px] sm:text-xs font-bold text-center py-2 z-[200] backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)]">
          You are offline. Features may be limited.
        </div>
      )}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(168,85,247,0.05),rgba(255,255,255,0))]" />

      {/* Persistent Global Header - Visible on ALL tabs */}
      {contentKey >= 0 && <GlobalAppHeader user={user} onLogout={handleLogout} onShowNotificationSettings={() => setShowNotifSettings(true)} />}

      <div className={`fade-in-up visible p-4 sm:p-6 pb-28 ${activeTab === "results" ? "pt-4" : "pt-28"} max-w-3xl mx-auto`} key={contentKey}>
        {renderContent()}
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

      {/* Daily Check-in Overlay */}
      {showDailyPrompt && (
        <DailyCheckIn
          lastScanDate={history[history.length - 1]?.date}
          onScan={() => {
            setShowDailyPrompt(false);
            setShowScanCamera(true);
          }}
          onSkip={() => {
            setShowDailyPrompt(false);
          }}
        />
      )}

      {/* Notification Settings Modal */}
      {showNotifSettings && (
        <NotificationSettings onClose={() => setShowNotifSettings(false)} />
      )}
    </div>
  );
};

export default App;
