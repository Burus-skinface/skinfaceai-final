
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

  // Splash + Auth loading screen
  const [showSplash, setShowSplash] = useState(true);

  // Onboarding State
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    return localStorage.getItem("onboarding_completed") === "true";
  });

  // Onboarding Data State
  const [userData, setUserData] = useState<{ age: string; gender: string } | null>(() => {
    const saved = localStorage.getItem("user_demographics");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Auto-schedule notifications on mount
  useEffect(() => {
    const prefs = getNotificationPreferences();
    if (prefs.enabled) {
      scheduleAllNotifications(prefs);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    setOnboardingComplete(true);
  };

  const handleOnboardingCompleteWithData = (data: { age: string; gender: string }) => {
    setUserData(data);
    localStorage.setItem("user_demographics", JSON.stringify(data));
    localStorage.setItem("onboarding_completed", "true");
    setOnboardingComplete(true);
    // Auto-start scan after onboarding
    setShowScanCamera(true);
  };

  // Sync with Supabase on Auth Change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

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

              localStorage.setItem("face_analysis_history", JSON.stringify(sorted));

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
        // Save to local history
        const updatedHistory = [...history, pendingReport];
        setHistory(updatedHistory);
        try {
          localStorage.setItem("face_analysis_history", JSON.stringify(updatedHistory));
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

  const changeTab = (tab: string) => {
    // [TEASER LOCK] Check if scores are masked (Free User)
    const isLocked = analysisData?.global_score === null;
    const premiumTabs = ['face', 'spectral', 'recommendations'];

    if (premiumTabs.includes(tab) && isLocked) {
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
      localStorage.setItem("face_analysis_history", JSON.stringify(updatedHistory));
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
  if (!onboardingComplete) {
    return <OnboardingManager onComplete={handleOnboardingComplete} onCompleteWithData={handleOnboardingCompleteWithData} initialStep={user ? 2 : 1} />;
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
    setOnboardingComplete(false);
    localStorage.removeItem('onboardingComplete');
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
    <div className="relative min-h-screen bg-[#09090b] text-white overflow-x-hidden font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />

      {/* Persistent Global Header - Visible on ALL tabs */}
      {contentKey >= 0 && <GlobalAppHeader user={user} onLogout={handleLogout} onShowNotificationSettings={() => setShowNotifSettings(true)} />}

      <div className={`fade-in-up visible p-4 sm:p-6 pb-28 ${activeTab === "results" ? "pt-4" : "pt-28"} max-w-3xl mx-auto`} key={contentKey}>
        {renderContent()}
      </div>

      {/* Bottom Navigation — Slim Floating Island */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-white/[0.07] backdrop-blur-2xl border border-white/[0.12] rounded-full px-5 py-2.5 flex items-center gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50">
        <button onClick={() => changeTab("results")} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-all duration-200 flex-1 min-w-[48px]">
          <SkinLayerIcon className={`w-5 h-5 ${activeTab === "results" ? "text-purple-400" : "text-gray-500"}`} />
          <span className={`text-[10px] font-medium ${activeTab === "results" ? "text-purple-400" : "text-gray-500"}`}>{t.results}</span>
        </button>

        <button onClick={() => changeTab("face")} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-all duration-200 flex-1 min-w-[48px]">
          <ScanFaceIcon className={`w-5 h-5 ${activeTab === "face" ? "text-purple-400" : "text-gray-500"}`} />
          <span className={`text-[10px] font-medium ${activeTab === "face" ? "text-purple-400" : "text-gray-500"}`}>{t.details}</span>
        </button>

        {/* CENTER SCAN BUTTON */}
        <button
          onClick={handleStartScan}
          className="flex flex-col items-center justify-center -mt-5 mx-1 transition-transform duration-200 active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25 border-[3px] border-[#09090b]">
            <CameraIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-[9px] text-gray-500 mt-0.5 font-medium">Scan</span>
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
        <div className="fixed inset-0 bg-black z-[100] fade-in-up visible">
          <Paywall onClose={handleClosePaywall} onUpgrade={() => console.log('Upgrade clicked')} />
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
