import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabase';

interface WelcomeScreenProps {
    onNext: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext }) => {
    const [loading, setLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex flex-col h-full bg-[#050505] text-white font-sans overflow-hidden">
            {/* Background Ambience - Dark Aurora (Purple & Indigo) */}
            <motion.div
                className="absolute inset-x-0 -top-20 h-[70%] bg-purple-900/30 blur-[120px] rounded-full pointer-events-none"
                animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1], x: ['-5%', '5%', '-5%'] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute -inset-x-20 top-20 h-[60%] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none"
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1.1, 1, 1.1], x: ['5%', '-5%', '5%'] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <div className="bg-noise-subtle absolute inset-0 pointer-events-none" />

            {/* Main Content Area - Center Aligned */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center pt-8">

                {/* Logo — resmin kendisi zaten mor kare ikon + altında Skinface.ai yazısını içeriyor */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-6"
                >
                    <img
                        src="/skinface-logo.png"
                        alt="Skinface.ai"
                        className="w-[414px] h-auto mx-auto drop-shadow-[0_0_40px_rgba(168,85,247,0.35)] pointer-events-none"
                    />
                </motion.div>

                {/* Tagline inspired by reference */}
                <motion.h2
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-[22px] sm:text-[26px] font-medium leading-[1.3] tracking-tight text-white/95 max-w-[280px] sm:max-w-xs mx-auto text-balance"
                >
                    Science-backed AI Cosmetologist you can trust
                </motion.h2>

            </div>

            {/* Bottom Actions Area */}
            <div className="relative z-10 px-6 pb-8 w-full max-w-sm mx-auto flex flex-col gap-4">

                {/* Primary Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    whileHover={{ scale: 1.02, backgroundColor: "#f3f4f6" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNext}
                    className="w-full h-[56px] rounded-full font-semibold text-[17px] bg-white text-black shadow-lg shadow-white/10 transition-all flex items-center justify-center"
                >
                    Sign in with email
                </motion.button>

                {/* Secondary 'Google' Button mimicking the bottom pill */}
                <motion.button
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.08)" }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleGoogleLogin();
                    }}
                    disabled={loading}
                    className="w-full h-[56px] rounded-full bg-white/[0.04] backdrop-blur-md text-white/90 border border-white/10 flex items-center justify-center transition-all disabled:opacity-50"
                >
                    <div className="flex items-center gap-3">
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google"
                            className="w-[18px] h-[18px]"
                        />
                        <span className="font-medium text-[16px]">{loading ? 'Connecting...' : 'Continue with Google'}</span>
                    </div>
                </motion.button>

                {/* Subtle Terms Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="text-[11px] text-center text-white/40 leading-[1.6] mt-4 max-w-[280px] mx-auto"
                >
                    By proceeding to use Skinface.ai, you agree to our{' '}
                    <button
                        onClick={() => setShowTerms(true)}
                        className="text-white/70 underline decoration-white/30 underline-offset-2 hover:text-white transition-colors font-medium"
                    >
                        terms of use
                    </button>
                    {' '}and acknowledge that you have read our{' '}
                    <button
                        onClick={() => setShowTerms(true)}
                        className="text-white/70 underline decoration-white/30 underline-offset-2 hover:text-white transition-colors font-medium"
                    >
                        privacy policy
                    </button>
                </motion.p>
            </div>

            {/* Terms Modal */}
            <AnimatePresence>
                {showTerms && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setShowTerms(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1C1C1E] rounded-3xl p-6 max-w-sm w-full max-h-[70vh] overflow-y-auto border border-white/10"
                        >
                            <h2 className="text-xl font-bold text-white mb-4">Terms & Privacy</h2>

                            <div className="text-sm text-gray-400 space-y-4">
                                <p><strong className="text-white">1. Acceptance</strong><br />By using Skinface.ai, you agree to these terms.</p>
                                <p><strong className="text-white">2. Service</strong><br />AI-powered facial analysis for educational purposes only.</p>
                                <p><strong className="text-white">3. Privacy</strong><br />Your facial data is processed locally on your device.</p>
                                <p><strong className="text-white">4. Liability</strong><br />Skinface.ai is provided "as is" without warranties.</p>
                            </div>

                            <button
                                onClick={() => setShowTerms(false)}
                                className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
                            >
                                I Understand
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WelcomeScreen;
