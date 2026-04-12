
// controllers/faceStratController.js

/**
 * Dashboard endpoint: Validates & authorizes scores.
 * Free users get null scores (paywall teaser).
 * Premium users get their real scores passed through.
 */
export const getDashboardData = async (req, res) => {
    try {
        const user = req.user || { isPremium: false };
        // Trust the frontend isPremium if provided (for referral rewards)
        const isPremium = req.body.isPremium === true || user.isPremium === true;
        const clientScores = req.body.scores;

        const responseData = {
            scores: {
                general: isPremium ? (clientScores?.general ?? null) : null,
                potential: isPremium ? (clientScores?.potential ?? null) : null,
            },
            modules: {
                dashboard: true,
                detailedFeatures: isPremium,
                maxxingGuide: isPremium
            }
        };

        res.json({ success: true, data: responseData, isPremium });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ success: false, error: "Analysis failed" });
    }
};
