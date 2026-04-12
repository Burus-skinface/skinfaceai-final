import React, { useState } from 'react';

export type LegalTab = 'terms' | 'privacy' | 'medical';

interface LegalModalProps {
    isOpen: boolean;
    initialTab: LegalTab;
    onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, initialTab, onClose }) => {
    const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex flex-col w-full h-full bg-[#f5f5f7] text-[#1d1d1f] font-sans">
            <header className="sticky top-0 left-0 right-0 z-10 px-4 py-4 flex items-center justify-between border-b border-gray-200 bg-[#f5f5f7]/90 backdrop-blur-md">
                <div className="flex gap-4">
                    <button 
                        onClick={() => setActiveTab('terms')}
                        className={`text-sm font-bold ${activeTab === 'terms' ? 'text-[#1d1d1f] underline decoration-2 underline-offset-4' : 'text-gray-400'}`}
                    >
                        Terms
                    </button>
                    <button 
                        onClick={() => setActiveTab('privacy')}
                        className={`text-sm font-bold ${activeTab === 'privacy' ? 'text-[#1d1d1f] underline decoration-2 underline-offset-4' : 'text-gray-400'}`}
                    >
                        Privacy
                    </button>
                    <button 
                        onClick={() => setActiveTab('medical')}
                        className={`text-sm font-bold ${activeTab === 'medical' ? 'text-[#1d1d1f] underline decoration-2 underline-offset-4' : 'text-gray-400'}`}
                    >
                        Disclaimer
                    </button>
                </div>
                <button onClick={onClose} className="p-2 bg-black/5 hover:bg-black/10 rounded-full">
                    <svg className="w-5 h-5 text-[#1d1d1f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 text-sm text-gray-700 leading-relaxed font-serif pb-24">
                {activeTab === 'terms' && (
                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold text-black mb-6">Terms of Use</h1>
                        <p><strong>Last Updated:</strong> April 2026</p>
                        <p>Welcome to Skinface AI. By accessing or using our application, you agree to comply with and be bound by the following Terms of Use. If you do not agree to these terms, please do not use the app.</p>
                        
                        <h2 className="text-lg font-bold text-black mt-4">1. Acceptance of Terms</h2>
                        <p>By downloading, installing, or using the App, you agree to these Terms. You must be at least 13 years old (or the minimum legal age in your country) to use this service.</p>

                        <h2 className="text-lg font-bold text-black mt-4">2. Service Description</h2>
                        <p>Skinface AI provides AI-based facial geometry, symmetry, and aesthetic feature analysis strictly for entertainment, cosmetic, and personal tracking purposes.</p>

                        <h2 className="text-lg font-bold text-black mt-4">3. Subscriptions and Billing</h2>
                        <p>Premium features require a paid subscription. Payment will be charged to your Apple ID/Google Play account upon confirmation of purchase. Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period. You can manage your subscriptions in your device settings. Any unused portion of a free trial will be forfeited when a premium subscription is purchased.</p>

                        <h2 className="text-lg font-bold text-black mt-4">4. No Warranty ("As-Is")</h2>
                        <p>THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES. WE DO NOT GUARANTEE THAT THE APP WILL BE ERROR-FREE, ACCURATE, OR COMPLETELY SECURE. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</p>

                        <h2 className="text-lg font-bold text-black mt-4">5. Limitation of Liability</h2>
                        <p>IN NO EVENT SHALL SKINFACE AI, ITS FOUNDERS, EMPLOYEES, OR AFFILIATES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP OR RELIANCE ON ITS AI-GENERATED RESULTS.</p>

                        <h2 className="text-lg font-bold text-black mt-4">6. Intellectual Property</h2>
                        <p>All content, algorithms, designs, and logos are the intellectual property of Skinface AI. You may not reverse-engineer, copy, or distribute our proprietary software.</p>
                    </div>
                )}

                {activeTab === 'privacy' && (
                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold text-black mb-6">Privacy Policy</h1>
                        <p><strong>Last Updated:</strong> April 2026</p>
                        <p>Your privacy is strictly protected. This policy outlines how we handle your biometrics and personal data under GDPR and CCPA regulations.</p>
                        
                        <h2 className="text-lg font-bold text-black mt-4">1. Data Collection & Facial Images</h2>
                        <p>When you use our scanning feature, we process your facial image securely via encrypted connections. <strong>We do NOT store your raw images on our servers after the analysis is complete.</strong> Images are converted into temporary anonymized mathematical vectors (embeddings) strictly for the purpose of generating your Aesthetic Score. Once the result is delivered, the image is immediately discarded from working memory.</p>

                        <h2 className="text-lg font-bold text-black mt-4">2. Account Data</h2>
                        <p>If you create an account, we store your email address and encrypted authentication tokens. You have the right to request the complete deletion of your account and all associated historical data at any time via the "Delete Account" button in Settings.</p>

                        <h2 className="text-lg font-bold text-black mt-4">3. Third-Party Sharing</h2>
                        <p>We absolutely do not sell, rent, or trade your facial data or personal information to any third parties, advertisers, or data brokers.</p>

                        <h2 className="text-lg font-bold text-black mt-4">4. Your Rights</h2>
                        <p>You reserve the right to access, rectify, or erase your personal data under the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).</p>
                    </div>
                )}

                {activeTab === 'medical' && (
                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold border-b-4 border-red-500 inline-block pb-1 text-black mb-6">Strict Medical Disclaimer</h1>
                        
                        <div className="p-4 bg-red-100 rounded-lg text-red-900 border border-red-200 mb-6">
                            <strong>READ CAREFULLY:</strong> By using Skinface AI, you legally acknowledge and accept the terms of this medical disclaimer.
                        </div>

                        <h2 className="text-lg font-bold text-black mt-4">Not a Medical Device or Professional Advice</h2>
                        <p>Skinface AI ("The App") is designed <strong>EXCLUSIVELY for cosmetic, aesthetic, and entertainment purposes.</strong> The App is NOT a medical device, nor is it a substitute for professional medical advice, clinical diagnosis, or treatment.</p>

                        <h2 className="text-lg font-bold text-black mt-4">No Diagnosis of Skin Conditions</h2>
                        <p>While the App may use artificial intelligence to detect visual anomalies such as dark spots, redness, or textural irregularities (e.g., "acne risks," "UV damage"), these are purely aesthetic estimations based on pixel analysis. <strong>The App cannot and does not diagnose melanoma, skin cancer, dermatological diseases, or any other health condition.</strong></p>

                        <h2 className="text-lg font-bold text-black mt-4">Assumption of Risk & Release of Liability</h2>
                        <p>You assume full responsibility for your use of the App's recommendations. Skinface AI, its creators, and its incorporated entities are fully indemnified and shall bear zero liability for any misinterpretation of results, missed medical diagnoses, psychological distress, or subsequent actions you take based on the App's output. Always consult a licensed dermatologist or physician with any health-related concerns or before starting any skincare regimen.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LegalModal;
