import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabase';

interface AuthGateProps {
    onAuthenticated: () => void;
    onGuest: () => void;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated, onGuest }) => {
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
            // OAuth redirects, so onAuthenticated will be called via App.tsx auth listener
        } catch (err: any) {
            console.error('Google login failed:', err);
            setError('Google login failed. Please try again.');
            setGoogleLoading(false);
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignup) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password: email, // simplified for now
                    options: { emailRedirectTo: window.location.origin }
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: { emailRedirectTo: window.location.origin }
                });
                if (error) throw error;
            }
            onAuthenticated();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#050505] flex flex-col items-center justify-center text-white font-sans overflow-hidden">
            {/* Background Aurora */}
            <motion.div
                className="absolute inset-x-0 -top-20 h-[60%] bg-purple-900/25 blur-[120px] rounded-full pointer-events-none"
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.08, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-0 inset-x-0 h-[40%] bg-indigo-900/15 blur-[100px] rounded-full pointer-events-none"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center px-6 w-full max-w-sm mx-auto"
            >
                {/* Lock Icon */}
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl border border-white/10 flex items-center justify-center mb-8 shadow-2xl shadow-purple-500/20"
                >
                    <svg className="w-10 h-10 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                </motion.div>

                {/* Title */}
                <h1 className="text-[26px] font-bold tracking-tight text-center mb-2">
                    Sign in to Start Analysis
                </h1>
                <p className="text-[15px] text-gray-400 text-center mb-8 leading-relaxed max-w-[260px]">
                    Create an account to save your results and track your skin progress
                </p>

                {!showEmailForm ? (
                    <div className="w-full space-y-3">
                        {/* Email Sign In */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowEmailForm(true)}
                            className="w-full h-[52px] rounded-full font-semibold text-[16px] bg-white text-black shadow-lg shadow-white/10 transition-all flex items-center justify-center"
                        >
                            Sign in with Email
                        </motion.button>

                        {/* Google */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGoogleLogin}
                            disabled={googleLoading}
                            className="w-full h-[52px] rounded-full bg-white/[0.04] backdrop-blur-md text-white/90 border border-white/10 flex items-center justify-center transition-all disabled:opacity-50"
                        >
                            <div className="flex items-center gap-2">
                                <img
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    alt="Google"
                                    className="w-[18px] h-[18px]"
                                />
                                <span className="font-medium text-[15px]">
                                    {googleLoading ? 'Connecting...' : 'Continue with Google'}
                                </span>
                            </div>
                        </motion.button>

                        {/* Divider */}
                        <div className="flex items-center gap-4 py-2">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-gray-500 font-medium">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Guest */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={onGuest}
                            className="w-full py-3 text-gray-400 text-[14px] font-medium hover:text-gray-300 transition-colors"
                        >
                            Continue as Guest
                        </motion.button>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-4"
                    >
                        {/* Back */}
                        <button
                            onClick={() => { setShowEmailForm(false); setError(''); }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>

                        <h2 className="text-xl font-bold text-white">
                            {isSignup ? 'Sign Up' : 'Sign In'}
                        </h2>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full py-4 pl-12 pr-6 bg-white/10 backdrop-blur-sm text-white placeholder-gray-500 text-base rounded-full border border-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full h-[52px] rounded-full font-bold text-[16px] bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Loading...' : (isSignup ? 'Sign Up' : 'Sign In')}
                            </motion.button>
                        </form>

                        <button
                            onClick={() => { setIsSignup(!isSignup); setError(''); }}
                            className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    </motion.div>
                )}
            </motion.div>

            {/* Terms */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-8 text-[11px] text-center text-white/30 px-8 max-w-[300px]"
            >
                By signing in, you agree to our terms of use and privacy policy.
            </motion.p>
        </div>
    );
};

export default AuthGate;
