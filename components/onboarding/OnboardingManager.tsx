
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Screens
import WelcomeScreen from './WelcomeScreen';
import AgeSelection from './AgeSelection';
import GenderSelection from './GenderSelection';
import AIShowcase from './AIShowcase';
import ScanCTA from './ScanCTA';

interface OnboardingManagerProps {
    onComplete: () => void;
    initialStep?: number;
}

const OnboardingManager: React.FC<OnboardingManagerProps & { onCompleteWithData?: (data: { age: string; gender: string }) => void }> = ({ onComplete, onCompleteWithData, initialStep = 1 }) => {
    const [step, setStep] = useState(initialStep);
    const [userData, setUserData] = useState({ age: '', gender: '' });

    // Update step if initialStep specifically changes
    useEffect(() => {
        if (initialStep > 1) {
            setStep(initialStep);
        }
    }, [initialStep]);



    const [direction, setDirection] = useState(0);

    const nextStep = () => {
        setDirection(1);
        setStep(prev => prev + 1);
    };

    const prevStep = () => {
        setDirection(-1);
        setStep(prev => Math.max(1, prev - 1));
    };

    const handleComplete = () => {
        if (onCompleteWithData) {
            onCompleteWithData(userData);
        } else {
            onComplete();
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    return (
        <div className="h-screen w-full bg-[#050505] overflow-hidden relative">
            <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                    key={step}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    className="h-full w-full absolute inset-0"
                >
                    {step === 1 && <WelcomeScreen onNext={nextStep} />}
                    {step === 2 && <AgeSelection onNext={(age) => { setUserData(prev => ({ ...prev, age })); nextStep(); }} onBack={prevStep} />}
                    {step === 3 && <GenderSelection onNext={(gender) => { setUserData(prev => ({ ...prev, gender })); nextStep(); }} onBack={prevStep} />}
                    {step === 4 && <AIShowcase onNext={nextStep} onBack={prevStep} />}
                    {step === 5 && <ScanCTA onStart={handleComplete} onBack={prevStep} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default OnboardingManager;
