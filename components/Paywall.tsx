import React, { useState, useRef } from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { GiftIcon } from './icons/GiftIcon';
import { CheckIcon } from './icons/CheckIcon';
import { PRICING_PLANS, SubscriptionTier } from '../types/subscription';

const carouselData = [
    {
        title: "Spectral Skin Analysis",
        subtitle: "See Hidden Damage",
        overallScore: 9.1,
        metric: {
            name: "UV Damage Level",
            score: 85,
            idealMin: 80,
            idealMax: 100,
            userValue: 85,
            min: 0,
            max: 100,
            status: "HEALTHY",
            description: "Minimal sun damage detected under UV light."
        },
        image: "https://images.unsplash.com/photo-1556228852-6d45a72f2316?q=80&w=987&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        title: "Face Symmetry",
        subtitle: "Top 22%",
        overallScore: 8.4,
        metric: {
            name: "Symmetry Score",
            score: 88,
            idealMin: 0.85,
            idealMax: 0.95,
            userValue: 0.82,
            min: 0.5,
            max: 1,
            status: "VERY BALANCED",
            description: "Your facial features are very well-balanced."
        },
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=987&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        title: "Sharp Jawline",
        subtitle: "Top 12%",
        overallScore: 9.2,
        metric: {
            name: "Jawline Angle",
            score: 95,
            idealMin: 125,
            idealMax: 135,
            userValue: 128,
            min: 110,
            max: 150,
            status: "IDEAL ANGLE",
            description: "Your jawline has a strong, defined angle."
        },
        image: "https://images.unsplash.com/photo-1615109398623-88346a601842?q=80&w=987&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
];


const CustomSlider = ({ min, max, userValue, idealMin, idealMax }: { min: number, max: number, userValue: number, idealMin: number, idealMax: number }) => {
    const userPercentage = ((userValue - min) / (max - min)) * 100;
    const idealStartPercentage = ((idealMin - min) / (max - min)) * 100;
    const idealWidthPercentage = ((idealMax - idealMin) / (max - min)) * 100;

    return (
        <div className="relative w-full">
            <div className="h-2 bg-white/20 rounded-full">
                <div
                    className="absolute h-2 bg-teal-500 rounded-full"
                    style={{ left: `${idealStartPercentage}%`, width: `${idealWidthPercentage}%` }}
                />
            </div>
            <div
                className="absolute -top-1.5 w-6 h-6 rounded-full bg-orange-400 border-4 border-[#252537] shadow-lg"
                style={{ left: `calc(${userPercentage}% - 12px)` }}
            />
            <div className="flex justify-between text-xs text-white/50 mt-2">
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>
    );
};

interface PaywallProps {
    onClose: () => void;
    onUpgrade: (tier: SubscriptionTier) => void;
}

const Paywall: React.FC<PaywallProps> = ({ onClose, onUpgrade }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown
    const scrollRef = useRef<HTMLDivElement>(null);

    // Countdown timer
    React.useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollLeft = scrollRef.current.scrollLeft;
            const itemWidth = scrollRef.current.scrollWidth / carouselData.length;
            const newIndex = Math.round(scrollLeft / itemWidth);
            if (newIndex !== currentIndex) {
                setCurrentIndex(newIndex);
            }
        }
    };

    const scrollTo = (index: number) => {
        if (scrollRef.current) {
            const itemWidth = scrollRef.current.scrollWidth / carouselData.length;
            scrollRef.current.scrollTo({
                left: itemWidth * index,
                behavior: 'smooth'
            });
        }
    };

    const handleNext = () => {
        const nextIndex = Math.min(currentIndex + 1, carouselData.length - 1);
        scrollTo(nextIndex);
    };

    const handlePrev = () => {
        const prevIndex = Math.max(currentIndex - 1, 0);
        scrollTo(prevIndex);
    };


    const wavyBackground = "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3e%3cpath fill='%233a2d5b' fill-opacity='0.2' d='M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,133.3C672,117,768,139,864,165.3C960,192,1056,224,1152,229.3C1248,235,1344,213,1392,202.7L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z'%3e%3c/path%3e%3c/svg%3e\")";


    return (
        <div className="relative flex flex-col h-full w-full max-w-md mx-auto bg-[#1e1e2f] text-white overflow-hidden" style={{ backgroundImage: wavyBackground, backgroundRepeat: 'no-repeat', backgroundPosition: 'top' }}>
            <header className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
                <button onClick={onClose} className="p-2 bg-black/20 rounded-full">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Glow Up Score</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 flex flex-col justify-center pt-20">
                {/* Same Carousel Logic - Good for Teaser */}
                <div ref={scrollRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                    {carouselData.map((item, index) => (
                        <div key={index} className="flex-shrink-0 w-full snap-center flex flex-col items-center px-4">
                            <div className="w-full bg-black/20 rounded-2xl p-4 mb-4 backdrop-blur-sm border border-white/10 flex items-center gap-4">
                                <div className="p-2 bg-black/30 rounded-lg">
                                    <svg className="w-8 h-8 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12C5 7.02944 7.02944 5 12 5" /><path d="M5 12C5 16.9706 7.02944 19 12 19" /><path d="M12 5C16.9706 5 19 7.02944 19 12" /><path d="M12 19C16.9706 19 19 16.9706 19 12" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">{item.title}</h2>
                                    <p className="text-sm text-white/60">{item.subtitle}</p>
                                </div>
                                <p className="ml-auto text-4xl font-bold text-blue-400">{item.overallScore}</p>
                            </div>

                            <div className="w-full aspect-[4/5] bg-cover bg-center rounded-2xl relative shadow-lg" style={{ backgroundImage: `url(${item.image})` }}>
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
                                <div className="absolute inset-x-4 bottom-4 bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-5 text-left text-white">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold max-w-[70%]">{item.metric.name}</h3>
                                        <span className="px-3 py-1 bg-green-500/80 text-white text-lg font-bold rounded-md">{item.metric.score}</span>
                                    </div>
                                    <div className="flex items-center gap-4 my-4">
                                        <span className="text-sm text-white/70">Ideal</span>
                                        <span className="text-sm text-white/70">You</span>
                                    </div>

                                    <CustomSlider
                                        min={item.metric.min}
                                        max={item.metric.max}
                                        userValue={item.metric.userValue}
                                        idealMin={item.metric.idealMin}
                                        idealMax={item.metric.idealMax}
                                    />

                                    <h4 className="font-bold mt-4">{item.metric.status}</h4>
                                    <p className="text-sm text-white/70 mt-1">{item.metric.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center space-x-2 mt-4">
                    {carouselData.map((_, index) => (
                        <button key={index} onClick={() => scrollTo(index)} className={`w-2 h-2 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-white/30'}`}></button>
                    ))}
                </div>
            </main>

            <footer className="p-6 pt-2 pb-8">
                <h2 className="text-center font-black text-3xl mb-1 mt-4 italic tracking-tighter">Unlock Your True Potential</h2>
                <p className="text-center text-gray-400 text-sm mb-6">Reveal your scores & access 20+ specialized metrics</p>

                {/* Pricing Cards */}
                <div className="space-y-3 mb-4">
                    {PRICING_PLANS.map((plan) => (
                        <button
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`relative w-full text-left p-4 rounded-3xl border-2 transition-all ${selectedPlan === plan.id
                                ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                                : 'border-white/10 bg-white/5'
                                }`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-black rounded-full shadow-lg tracking-wider">
                                    {plan.badge}
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`font-bold text-lg ${selectedPlan === plan.id ? 'text-white' : 'text-gray-400'}`}>{plan.name}</h3>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-2xl font-black text-white">
                                            {plan.price}
                                        </p>
                                        <span className="text-sm text-gray-500 font-medium">{plan.period}</span>
                                    </div>
                                    {plan.id === 'monthly' && (
                                        <p className="text-xs font-bold text-green-400 mt-1">Save 20% vs Weekly</p>
                                    )}
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlan === plan.id
                                    ? 'border-amber-400 bg-amber-400'
                                    : 'border-gray-600'
                                    }`}>
                                    {selectedPlan === plan.id && (
                                        <CheckIcon className="w-3 h-3 text-black" />
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Upgrade Button */}
                <button
                    onClick={() => {
                        const plan = PRICING_PLANS.find(p => p.id === selectedPlan);
                        if (plan) {
                            onUpgrade(plan.tier);
                            onClose();
                        }
                    }}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-teal-400 to-cyan-500 text-black font-bold text-xl rounded-2xl shadow-lg hover:opacity-90 transition-opacity"
                >
                    <span role="img" aria-label="rocket">🚀</span>
                    Start {PRICING_PLANS.find(p => p.id === selectedPlan)?.name} Now
                </button>

                <div className="text-center mt-4">
                    <div className="flex justify-center items-center space-x-4 text-xs text-white/50">
                        <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>Cancel Anytime
                        </span>
                        <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>7-Day Free Trial
                        </span>
                        <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>Secure Payment
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Paywall;
