import React, { useState } from 'react';
import { t } from '../localization';

interface LoginScreenProps {
  onLoginWithGoogle: () => void;
  onLoginWithEmail: (email: string, isSignup: boolean) => Promise<void>;
  onLoginAnonymously: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginWithGoogle, onLoginWithEmail, onLoginAnonymously }) => {
  const [showEmailSignup, setShowEmailSignup] = useState(false);
  const [isSignup, setIsSignup] = useState(false); // true = signup, false = signin
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await onLoginWithEmail(email, isSignup);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsSignup(!isSignup);
    setError('');
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 text-white overflow-y-auto">
      {/* Animated gradient orbs for depth */}
      <div className="fixed top-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
      
      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-start flex-1 w-full max-w-md px-6 sm:px-8 pt-12 pb-6">
        {/* Logo/Brand */}
        <div className="text-center mb-6 sm:mb-8 fade-in-up visible">
          {/* App Icon */}
          <div className="inline-flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 mb-5 sm:mb-6 bg-gradient-to-br from-teal-500/20 to-purple-600/20 backdrop-blur-xl rounded-[2.5rem] border border-teal-400/30 shadow-2xl shadow-teal-500/20 relative overflow-hidden">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 via-transparent to-purple-400/20"></div>
            
            {/* Face outline SVG */}
            <svg className="w-14 h-14 sm:w-16 sm:h-16 text-teal-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              <circle cx="9" cy="10" r="0.5" fill="currentColor" />
              <circle cx="15" cy="10" r="0.5" fill="currentColor" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5c0.5 0.5 1.5 1 3 1s2.5-0.5 3-1" />
            </svg>
          </div>
          
          {/* App Title */}
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3 tracking-tight px-4 bg-gradient-to-r from-teal-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent" style={{ fontWeight: 700 }}>
            Skinface AI
          </h1>
          
          {/* Subtitle */}
          <p className="text-base sm:text-lg text-gray-300 font-medium tracking-wide px-4 mb-1">
            Science-backed AI Cosmetologist
          </p>
          <p className="text-sm sm:text-base text-gray-400 px-4">
            you can trust
          </p>
          
          {/* Social Proof - Stats */}
          <div className="flex items-center justify-center gap-3 mt-5 px-4">
            <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-yellow-400 text-xs">⭐</span>
              <span className="text-white font-semibold text-xs">{t.rating}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-teal-400 text-xs">👥</span>
              <span className="text-white font-semibold text-xs">{t.users}</span>
            </div>
          </div>

          {/* Key Features Highlight */}
          <div className="mt-6 space-y-2.5 px-2">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-3.5 py-2.5 border border-teal-500/20 hover:border-teal-500/40 transition-all">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/30">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-xs sm:text-sm">AI-Powered Analysis</p>
                <p className="text-gray-400 text-[10px] sm:text-xs">Advanced facial recognition</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-3.5 py-2.5 border border-purple-500/20 hover:border-purple-500/40 transition-all">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-xs sm:text-sm">Track Progress</p>
                <p className="text-gray-400 text-[10px] sm:text-xs">See your glow up journey</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-3.5 py-2.5 border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-xs sm:text-sm">Smart Recommendations</p>
                <p className="text-gray-400 text-[10px] sm:text-xs">Personalized beauty tips</p>
              </div>
            </div>
          </div>
        </div>

      {/* Bottom Section - Login Options */}
        <div className="relative z-10 w-full max-w-md mt-auto pt-6 pb-6 space-y-3 fade-in-up visible">
          {!showEmailSignup ? (
            <>
              {/* Primary Action - Email Sign In */}
              <button
                onClick={() => {
                  setShowEmailSignup(true);
                  setIsSignup(false); // Default to sign in
                }}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-base sm:text-lg font-bold rounded-full shadow-2xl shadow-teal-500/50 hover:shadow-teal-500/70 hover:scale-[1.02] transition-all duration-300 transform active:scale-[0.98]"
              >
                {t.signInWithEmail || 'Sign in with email'}
              </button>

              {/* Secondary Action - Don't have account */}
              <button
                onClick={() => {
                  setShowEmailSignup(true);
                  setIsSignup(true); // Go to signup mode
                }}
                className="w-full py-3 text-gray-300 text-sm sm:text-base font-medium hover:text-white transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {t.dontHaveAccount || "I don't have an account"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Guest Option */}
              <button
                onClick={onLoginAnonymously}
                className="w-full py-2 text-gray-400 text-xs sm:text-sm font-normal hover:text-gray-300 transition-colors duration-200"
              >
                {t.continueAsGuest || 'Continue as Guest'}
              </button>
            </>
          ) : (
            /* Email Input Form */
            <div className="space-y-3 animate-fadeIn">
              <button
                onClick={() => {
                  setShowEmailSignup(false);
                  setError('');
                }}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t.back || 'Back'}
              </button>
              
              <h2 className="text-xl font-bold text-white mb-2">
                {isSignup ? (t.signUp || 'Sign Up') : (t.signIn || 'Sign In')}
              </h2>
              
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.enterEmail || "Enter your email"}
                    className="w-full py-3.5 pl-12 pr-6 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 text-base sm:text-lg rounded-full border border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-base sm:text-lg font-bold rounded-full shadow-2xl shadow-teal-500/50 hover:shadow-teal-500/70 hover:scale-[1.02] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (t.loading || 'Loading...') : (isSignup ? (t.signUp || 'Sign Up') : (t.signIn || 'Sign In'))}
                </button>
              </form>
              
              {/* Switch between Sign In / Sign Up */}
              <button
                onClick={handleModeSwitch}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                {isSignup 
                  ? (t.alreadyHaveAccount || 'Already have an account? Sign In')
                  : (t.dontHaveAccount || "Don't have an account? Sign Up")
                }
              </button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-br from-black via-gray-900 to-purple-900 text-gray-400">{t.or || 'or'}</span>
                </div>
              </div>

              {/* Google Sign In Option */}
              <button
                onClick={onLoginWithGoogle}
                className="w-full py-3.5 px-6 bg-white/10 backdrop-blur-sm text-white text-sm sm:text-base font-medium rounded-full border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-200 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t.continueWithGoogle}
              </button>
            </div>
          )}

          {/* Terms & Privacy */}
          <p className="text-center text-xs text-gray-400 px-2 leading-relaxed mt-4">
            By proceeding to use <span className="text-teal-400 font-medium">Skinface AI</span>, you agree to our{' '}
            <button className="text-gray-300 underline hover:text-white transition-colors">
              terms of use
            </button>{' '}
            and acknowledge that you have read our{' '}
            <button className="text-gray-300 underline hover:text-white transition-colors">
              privacy policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

