import React, { useState } from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { CheckIcon } from './icons/CheckIcon';
import { PRICING_PLANS, SubscriptionTier } from '../types/subscription';
import LegalModal, { LegalTab } from './LegalModal';
import { Purchases, PurchasesPackage, PACKAGE_TYPE } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

interface PaywallProps {
    onClose: () => void;
    onUpgrade: (tier: SubscriptionTier) => void;
}

const features = [
    {
        title: "Face & Symmetry Scores",
        desc: "Find out exactly how attractive your features are and how to enhance them.",
        icon: "✨"
    },
    {
        title: "Deep Skin Scan",
        desc: "Catch hidden acne, dark circles, and skin damage before they even appear.",
        icon: "🔬"
    },
    {
        title: "Unlimited Glow-Up Tracking",
        desc: "Log your daily selfies and literally watch yourself level up over time.",
        icon: "📈"
    },
    {
        title: "Your Personal Maxxing Plan",
        desc: "Step-by-step skincare, grooming, and style advice tailored strictly for you.",
        icon: "🎯"
    }
];

const Paywall: React.FC<PaywallProps> = ({ onClose, onUpgrade }) => {
    const [selectedPlan, setSelectedPlan] = useState<string>('weekly');
    const [showLegalTab, setShowLegalTab] = useState<LegalTab | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [rcPackages, setRcPackages] = useState<PurchasesPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

    React.useEffect(() => {
        const loadOfferings = async () => {
            if (!Capacitor.isNativePlatform()) return;
            try {
                const offerings = await Purchases.getOfferings();
                if (offerings.current && offerings.current.availablePackages.length !== 0) {
                    setRcPackages(offerings.current.availablePackages);
                    setSelectedPackage(offerings.current.availablePackages[0]); // Select first by default
                }
            } catch (e) {
                console.error("Error loading offerings", e);
            }
        };
        loadOfferings();
    }, []);

    const handleUpgradeClick = async () => {
        setIsPurchasing(true);
        
        if (Capacitor.isNativePlatform() && selectedPackage) {
            const ENTITLEMENT_ID = import.meta.env.VITE_RC_ENTITLEMENT_ID || 'premium';
            try {
                const { customerInfo } = await Purchases.purchasePackage({ aPackage: selectedPackage });
                if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
                    alert("Purchase successful! Welcome to premium.");
                    onUpgrade(selectedPlan as SubscriptionTier); 
                }
            } catch (e: any) {
                if (!e.userCancelled) {
                    alert("Purchase Error: " + e.message);
                }
            } finally {
                setIsPurchasing(false);
            }
        } else {
            // Web Mock
            setTimeout(() => {
                setIsPurchasing(false);
                alert("Sandbox: Connecting to App Store...\n[RevenueCat SDK will trigger native IAP prompt here in the native build]");
            }, 1500);
        }
    };

    const handleRestore = async () => {
        setIsRestoring(true);
        if (Capacitor.isNativePlatform()) {
            const ENTITLEMENT_ID = import.meta.env.VITE_RC_ENTITLEMENT_ID || 'premium';
            try {
                const { customerInfo } = await Purchases.restorePurchases();
                 if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
                    alert("Purchases restored successfully!");
                    onUpgrade(selectedPlan as SubscriptionTier);
                 } else {
                    alert("No active premium purchases found on this account.");
                 }
            } catch(e: any) {
                alert("Restore failed: " + e.message);
            } finally {
                setIsRestoring(false);
            }
        } else {
            setTimeout(() => {
                setIsRestoring(false);
                alert("No previous purchases found on this Apple ID.");
            }, 1500);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col w-full h-full bg-black/80 backdrop-blur-2xl text-white font-sans overflow-y-auto">
            {/* Header */}
            <header className="sticky top-0 left-0 right-0 z-10 px-4 py-5 flex items-center justify-between border-b border-white/[0.05]">
                <button 
                    onClick={onClose} 
                    className="p-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-full"
                >
                    <ArrowLeftIcon className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-sm font-semibold tracking-wide uppercase text-gray-500">Premium</h1>
                <button 
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className="text-[12px] font-semibold text-gray-400 hover:text-white transition-colors"
                >
                    {isRestoring ? 'Restoring...' : 'Restore'}
                </button>
            </header>

            <main className="flex-1 flex flex-col px-6 pb-24 pt-8 max-w-md mx-auto w-full">
                
                {/* Hero Typograhpy */}
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black tracking-tight leading-tight mb-3">
                        Unlock your <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500">
                            Full Potential.
                        </span>
                    </h2>
                    <p className="text-[15px] font-medium text-gray-500 px-4">
                        Join 20,000+ users maximizing their aesthetics with unparalleled AI insights.
                    </p>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-10">
                    {features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] transition-transform hover:scale-[1.01] hover:bg-white/[0.05]">
                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-black/30 rounded-xl text-2xl shadow-inner border border-white/[0.03]">
                                {feature.icon}
                            </div>
                            <div className="flex-1 pt-1">
                                <h3 className="text-base font-bold text-white mb-0.5">{feature.title}</h3>
                                <p className="text-[13px] text-gray-400 leading-snug">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pricing Toggles */}
                <div className="flex flex-col gap-3 mb-8">
                    {rcPackages.length > 0 ? (
                        rcPackages.map((pkg) => {
                            const isSelected = selectedPackage?.identifier === pkg.identifier;
                            return (
                                <button
                                    key={pkg.identifier}
                                    onClick={() => setSelectedPackage(pkg)}
                                    className={`relative flex items-center p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                                        isSelected 
                                        ? 'border-purple-600 bg-purple-900/20 shadow-md' 
                                        : 'border-white/[0.05] bg-black/40 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    {isSelected && pkg.packageType === PACKAGE_TYPE.ANNUAL && (
                                        <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                                            BEST VALUE
                                        </div>
                                    )}
                                    <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                                        isSelected ? 'border-purple-600' : 'border-white/20'
                                    }`}>
                                        {isSelected && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`text-base font-bold ${isSelected ? 'text-purple-400' : 'text-white'}`}>
                                            {pkg.product.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 font-medium">Auto-renews, cancel anytime</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-white">{pkg.product.priceString}</div>
                                        <div className="text-[10px] text-gray-400 font-semibold">{pkg.packageType === PACKAGE_TYPE.ANNUAL ? 'per year' : pkg.packageType === PACKAGE_TYPE.MONTHLY ? 'per month' : pkg.packageType === PACKAGE_TYPE.WEEKLY ? 'per week' : ''}</div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        // Fallback for Web/Sandbox
                        PRICING_PLANS.map((plan) => {
                            const isSelected = selectedPlan === plan.id;
                            return (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`relative flex items-center p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                                        isSelected 
                                        ? 'border-purple-600 bg-purple-900/20 shadow-md' 
                                        : 'border-white/[0.05] bg-black/40 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    {isSelected && (
                                        <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                                            BEST VALUE
                                        </div>
                                    )}
                                    <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                                        isSelected ? 'border-purple-600' : 'border-white/20'
                                    }`}>
                                        {isSelected && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`text-base font-bold ${isSelected ? 'text-purple-400' : 'text-white'}`}>
                                            {plan.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 font-medium">Auto-renews, cancel anytime</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-white">{plan.price}</div>
                                        <div className="text-[10px] text-gray-400 font-semibold">{plan.period}</div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Secure / Terms */}
                <div className="text-center px-1 mb-6">
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless canceled at least 24 hours before the end of the current period. By subscribing, you agree to our{' '}
                        <button onClick={() => setShowLegalTab('terms')} className="underline hover:text-gray-600">Terms</button>,{' '}
                        <button onClick={() => setShowLegalTab('privacy')} className="underline hover:text-gray-600">Privacy</button>, and{' '}
                        <button onClick={() => setShowLegalTab('medical')} className="underline hover:text-gray-600">Medical Disclaimer</button>.
                    </p>
                </div>

            </main>

            {/* Sticky Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/80 to-transparent z-20 pb-8 pointer-events-none">
                <div className="max-w-md mx-auto pointer-events-auto">
                    <button
                        onClick={handleUpgradeClick}
                        disabled={isPurchasing}
                        className="w-full relative group overflow-hidden bg-white text-black py-4 px-6 rounded-2xl font-bold text-lg shadow-[0_8px_30px_rgba(255,255,255,0.12)] transition-transform active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed"
                    >
                        {/* Glow effect underneath text */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {isPurchasing ? "Connecting to Store..." : "Glow Up Now"}
                            {!isPurchasing && <ArrowLeftIcon className="w-5 h-5 rotate-180" />}
                        </span>
                        
                        {/* Pulsing halo */}
                        {!isPurchasing && <div className="absolute inset-0 -z-10 bg-white/20 blur-xl rounded-2xl opacity-0 animate-[pulse_2s_ease-in-out_infinite]"></div>}
                    </button>
                </div>
            </div>

            <LegalModal 
                isOpen={showLegalTab !== null} 
                initialTab={showLegalTab || 'terms'} 
                onClose={() => setShowLegalTab(null)} 
            />
        </div>
    );
};

export default Paywall;
