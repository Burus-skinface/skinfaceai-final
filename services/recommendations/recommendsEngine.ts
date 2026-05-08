
import type { AnalysisResults } from '../analysis/types';
import type { ScoringResults } from '../scoring/types';
import type { DailyReport } from '../../types';
import { PRODUCT_CATALOG } from '../../utils/products';

// SECURITY UPDATE: Gemini API Key is no longer used here.
// All requests are routed through the secure backend proxy.
const API_ENDPOINT = '/api/analyze'; // Relative path for proxying

export interface UserPreferences {
  goal?: string;
  style?: string;
  constraints?: string[];
  age?: string;
  gender?: string;
}

export interface EliteReport {
  featureBreakdown: {
    featureName: string;
    score: number;
    analysis: string;
  }[];
  structuralVerdict: string;
  technicalAssets: {
    term: string;
    explanation: string;
  }[];
  technicalDeficits: {
    term: string;
    explanation: string;
  }[];
}

export interface Big6Insights {
  acneClarity: string;
  texturePores: string;
  barrierDefense: string;
  sebumDynamics: string;
  toneUniformity: string;
  visualFatigue: string;
}

export interface FaceBig6Insights {
  eyes: string;
  nose: string;
  jawline: string;
  chin: string;
  midface: string;
  harmony: string;
}

export interface RecommendedProduct {
  productId: string;
  confidenceScore: number;
  reason: string;
}

export interface RecommendationsResult {
  big6Insights: Big6Insights;           // Skin Big 6 AI Insights
  faceBig6Insights?: FaceBig6Insights;  // [NEW] Face Big 6 AI Insights
  eliteReport?: EliteReport;            // Optional for backward compatibility
  priorityOrder: string[];
  focusAreas: {
    area: string;
    why: string;
    actions: string[];
    timeline: '3_months' | '6_months' | '12_months';
  }[];

  dailyRoutine: {
    morning: string[];
    evening: string[];
  };

  monthlyGoals: {
    month1: string;
    month3: string;
    month6: string;
    month12: string;
  };

  motivationalNote: string;
  recommendedProducts?: RecommendedProduct[];
}

/**
 * STAGE 4: Recommendations Engine (LLM Only, Results-Only Input)
 * 
 * CRITICAL: This engine NEVER sees FACE_STATE, images, or raw landmarks.
 * It only receives analysis results and scoring results.
 * 
 * It generates actionable recommendations based on what the user sees as results.
 */

/**
 * Build prompt from results (NO raw scan data)
 */
function buildPrompt(
  analysisResults: AnalysisResults,
  scoringResults: ScoringResults,
  userPreferences?: UserPreferences,
  previousScanData?: DailyReport
): any {
  const { skin: skinScores, face: faceScores, spectral: spectralScores } = scoringResults;

  // 1. Gender Context & Persona
  const gender = userPreferences?.gender?.toLowerCase() || 'neutral';
  const age = userPreferences?.age || '25-34';
  const isMale = gender === 'male';

  const tonePersona = isMale 
    ? "TONE: You are a strict, honest, masculine aesthetics (looksmaxxing) coach. Speak like a 'Warrior'. Command action. Be brutal but constructive."
    : "TONE: You are an educational, direct, but highly supportive skin and beauty coach. Explain the science gently but firmly. Inspire confidence.";

  const guardrails = `
GUARDRAILS (CRITICAL):
1. NO RAW NUMBERS: NEVER output raw backend values to the user (e.g. "You have 3500 red pixels" or "Laplacian is 0.04"). Translate data into human-readable actionable insights.
2. ORGANIC SYNTHESIS: Find correlations. Don't just say "Score dropped". Say WHY (e.g., "Texture is rough and luminance is low — lack of sleep is halting your cell turnover.").
3. DELTA (Δ) LOGIC: Compare CURRENT to PREVIOUS data. If improving, praise and motivate. If declining, alert and give a behavioral command (e.g., "Stop touching your face").
  `;

  const big6Mapping = `
DATA AGGREGATION MAPPING (THE BIG 6):
1. Acne & Clarity (Inputs: Active Acne, Marks). If Δ positive: fading message. If Δ negative: alert new lesions, command "hands off".
2. Texture & Pores (Inputs: Smoothness, Congestion). Gamify "Glass Skin". Warn if dead skin accumulates.
3. Barrier Defense (Inputs: Inflammation, Barrier). If dropping: ALARM mode. Dictate stopping acids, prescribe gentle repair.
4. Sebum Dynamics (Inputs: Oil/Hydration). Give cause-and-effect for "Oily-Dehydrated" skin. Don't just say "you are oily".
5. Tone Uniformity (Inputs: Tone Evenness, Redness). Report on pigment homogenization.
6. Visual Fatigue (Inputs: Radiance). Analyze fatigue relative to chronological age (${age}). Prescribe actions like "Morning Ice Ritual (De-puffing)".
  `;

  // Provide raw data to the LLM (Current vs Previous)
  const faceBig6Data = scoringResults.faceBig6 ? JSON.stringify({
    eyes:    { score: scoringResults.faceBig6.eyes.score,    breakdown: scoringResults.faceBig6.eyes.breakdown },
    nose:    { score: scoringResults.faceBig6.nose.score,    breakdown: scoringResults.faceBig6.nose.breakdown },
    jawline: { score: scoringResults.faceBig6.jawline.score, breakdown: scoringResults.faceBig6.jawline.breakdown },
    chin:    { score: scoringResults.faceBig6.chin.score,    breakdown: scoringResults.faceBig6.chin.breakdown },
    midface: { score: scoringResults.faceBig6.midface.score, breakdown: scoringResults.faceBig6.midface.breakdown },
    harmony: { score: scoringResults.faceBig6.harmony.score, breakdown: scoringResults.faceBig6.harmony.breakdown },
    overall: scoringResults.faceBig6.overallFaceBig6,
  }) : 'NOT_AVAILABLE';

  const currentData = JSON.stringify({
    advancedMetrics: scoringResults.advancedSkinMetrics,
    spectral: {
      pigment: spectralScores.statusScores?.pigmentUniformity,
      redness: spectralScores.statusScores?.rednessSignal,
      clarity: spectralScores.statusScores?.opticalClarity
    }
  });

  const previousData = previousScanData ? JSON.stringify({
    advancedMetrics: previousScanData.scoring?.advancedSkinMetrics,
    spectral: previousScanData.scoring?.spectral?.statusScores
  }) : "NO PREVIOUS SCAN (BASELINE DAY 1)";

  const catalogStr = PRODUCT_CATALOG.map(p => `ID: ${p.id} | Name: ${p.name} | Tags: ${p.tags.join(', ')} | Desc: ${p.description}`).join('\n');

  return [
    {
      role: "user",
      parts: [
        {
          text: `You are the "Skinface AI" Analytical Decision Engine.
Generate the user's daily actionable insights.

USER PROFILE: ${gender.toUpperCase()} | Age: ${age}
${tonePersona}

${guardrails}

${big6Mapping}

--- RAW DATA FEED ---
CURRENT SCAN (SKIN):
${currentData}

CURRENT SCAN (FACE STRUCTURE — Big 6):
${faceBig6Data}

PREVIOUS SCAN:
${previousData}
---------------------
--- PRODUCT CATALOG ---
You MUST recommend AT LEAST 4 and AT MOST 6 products from this exact catalog based on the user's needs.
${catalogStr}
-----------------------

OUTPUT REQUIREMENTS:
1. **big6Insights**: One short, punchy, continuous paragraph for each of the 6 SKIN categories, strictly following the Data Mapping and Guardrails.
2. **faceBig6Insights**: One short, punchy, continuous paragraph for each of the 6 FACE categories (Eyes, Nose, Jawline, Chin, Midface, Harmony). Translate scores and breakdowns into human-readable, actionable insights. Use looksmaxxing language for male users. Never output raw numbers — translate them into verdicts.
3. **motivationalNote**: A 2-sentence FRIENDLY summary of today's SKIN analysis findings.
4. **eliteReport**: A structural aesthetic breakdown (Front Architecture, Side Profile, Jawline, Harmony, Spectral).
5. **priorityOrder**: Ordered list of focus areas.
6. **focusAreas**, **dailyRoutine**, **monthlyGoals**: Actionable plans based on current deficits.
7. **recommendedProducts**: Based on the exact PRODUCT CATALOG provided above, return exactly 4-6 appropriate products. Include the exact "productId" string, a "confidenceScore" (integer 0-100 indicating how strong the fit is based on their unique scanning deficits), and a brief "reason" why it will fix their specific problem.
`
        }
      ]
    }
  ];
}

/**
 * Dev-only mock payload, never reachable in production builds.
 * Used to short-circuit network calls while iterating on UI locally.
 */
const MOCK_RECOMMENDATIONS: RecommendationsResult = {
  eliteReport: {
    featureBreakdown: [],
    structuralVerdict: "Your facial symmetry is within the top 15% of your age group. Strong jawline definition provides excellent framing.",
    technicalAssets: [{ term: "Zygomatic Width", explanation: "Strong cheekbone prominence adds character." }],
    technicalDeficits: [{ term: "Under-eye support", explanation: "Slight hollowness, easily improved with hydration." }]
  },
  big6Insights: {
    acneClarity: "Your skin is remarkably clear today. The slight redness from yesterday has completely faded. Keep your hands off your face to maintain this baseline.",
    texturePores: "Pore visibility is minimal across the T-zone. Your current exfoliation routine is working perfectly—don't increase the frequency.",
    barrierDefense: "Your lipid barrier looks robust. No signs of micro-inflammation or sensitivity detected. Keep using your ceramide moisturizer.",
    sebumDynamics: "Oil production is balanced. You're in the 'Goldilocks' zone—neither overly matte nor shiny. Your hydration levels are holding strong.",
    toneUniformity: "Pigment homogenization is excellent. Minor variations around the mouth are normal and do not detract from your overall radiance.",
    visualFatigue: "High radiance and low puffiness indicate good rest. Your eye area is bright, showing zero signs of chronological fatigue today."
  },
  faceBig6Insights: {
    eyes: "Your eye shape has positive canthal tilt, giving a sharp, alert look. No signs of hooding or fatigue.",
    nose: "Your nose profile is straight and proportional to your midface. It anchors your facial symmetry well.",
    jawline: "Strong gonial angle. Your jawline is well-defined and separates cleanly from your neck.",
    chin: "Chin projection is balanced with your lower lip. No signs of recession.",
    midface: "Compact midface ratio gives you a highly youthful and aesthetic framing.",
    harmony: "All facial thirds are exceptionally balanced. Your facial architecture scores very highly."
  },
  priorityOrder: ["Hydration", "Sun Protection", "Rest"],
  focusAreas: [
    {
      area: "Under-eye hydration",
      why: "To prevent future hollowness",
      actions: ["Apply hyaluronic acid serum on damp skin", "Get 8 hours of sleep"],
      timeline: "3_months"
    }
  ],
  dailyRoutine: {
    morning: ["Gentle Cleanser", "Vitamin C Serum", "SPF 50+ Moisturizer"],
    evening: ["Double Cleanse", "Peptide Serum", "Ceramide Night Cream"]
  },
  monthlyGoals: {
    month1: "Establish consistent hydration",
    month3: "Improve under-eye elasticity",
    month6: "Maintain zero breakouts",
    month12: "Achieve maximal skin radiance"
  },
  motivationalNote: "Your structure is elite. Stay consistent with your routine to maximize your natural potential.",
  recommendedProducts: [
    { productId: "cerave_moisturizer", confidenceScore: 95, reason: "Perfect for reinforcing your current barrier strength." },
    { productId: "paulas_choice_bha", confidenceScore: 88, reason: "Will maintain your cleared pores gently." }
  ]
};

/**
 * Local-dev escape hatch: allow short-circuiting the LLM call while iterating on UI.
 * Requires BOTH dev build (`import.meta.env.DEV`) AND opt-in flag
 * `VITE_DEV_BYPASS_RECOMMENDS=true` so it is impossible to ship to prod.
 */
function shouldUseRecommendsBypass(): boolean {
  return Boolean(import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_RECOMMENDS === 'true');
}

/**
 * Generate recommendations using Backend Proxy (LLM reasoning from results only)
 */
export async function generateRecommendations(
  analysisResults: AnalysisResults,
  scoringResults: ScoringResults,
  userPreferences?: UserPreferences,
  previousScanData?: DailyReport
): Promise<RecommendationsResult> {
  if (shouldUseRecommendsBypass()) {
    console.warn('[RECOMMENDS] DEV BYPASS active (VITE_DEV_BYPASS_RECOMMENDS=true) — returning mock payload. This will NEVER run in production builds.');
    return MOCK_RECOMMENDATIONS;
  }

  console.log('[RECOMMENDS] Generating recommendations via Secure Backend...');

  const schema = {
    type: "OBJECT",
    properties: {
      eliteReport: {
        type: "OBJECT",
        properties: {
          featureBreakdown: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                featureName: { type: "STRING" },
                score: { type: "NUMBER" },
                analysis: { type: "STRING" }
              },
              required: ['featureName', 'score', 'analysis']
            }
          },
          structuralVerdict: { type: "STRING" },
          technicalAssets: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                term: { type: "STRING" },
                explanation: { type: "STRING" }
              },
              required: ['term', 'explanation']
            }
          },
          technicalDeficits: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                term: { type: "STRING" },
                explanation: { type: "STRING" }
              },
              required: ['term', 'explanation']
            }
          }
        },
        required: ['featureBreakdown', 'structuralVerdict', 'technicalAssets', 'technicalDeficits']
      },
      big6Insights: {
        type: "OBJECT",
        properties: {
          acneClarity: { type: "STRING" },
          texturePores: { type: "STRING" },
          barrierDefense: { type: "STRING" },
          sebumDynamics: { type: "STRING" },
          toneUniformity: { type: "STRING" },
          visualFatigue: { type: "STRING" }
        },
        required: ['acneClarity', 'texturePores', 'barrierDefense', 'sebumDynamics', 'toneUniformity', 'visualFatigue']
      },
      faceBig6Insights: {
        type: "OBJECT",
        properties: {
          eyes:    { type: "STRING" },
          nose:    { type: "STRING" },
          jawline: { type: "STRING" },
          chin:    { type: "STRING" },
          midface: { type: "STRING" },
          harmony: { type: "STRING" }
        },
        required: ['eyes', 'nose', 'jawline', 'chin', 'midface', 'harmony']
      },
      priorityOrder: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Ordered list of focus areas, e.g. ['skin.acne', 'skin.pores', 'face.jawline']"
      },
      focusAreas: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            area: { type: "STRING" },
            why: { type: "STRING" },
            actions: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            timeline: {
              type: "STRING",
              enum: ['3_months', '6_months', '12_months']
            }
          },
          required: ['area', 'why', 'actions', 'timeline']
        }
      },
      dailyRoutine: {
        type: "OBJECT",
        properties: {
          morning: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          evening: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ['morning', 'evening']
      },
      monthlyGoals: {
        type: "OBJECT",
        properties: {
          month1: { type: "STRING" },
          month3: { type: "STRING" },
          month6: { type: "STRING" },
          month12: { type: "STRING" }
        },
        required: ['month1', 'month3', 'month6', 'month12']
      },
      motivationalNote: { type: "STRING" },
      recommendedProducts: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            productId: { type: "STRING" },
            confidenceScore: { type: "NUMBER" },
            reason: { type: "STRING" }
          },
          required: ['productId', 'confidenceScore', 'reason']
        }
      }
    },
    required: ['big6Insights', 'faceBig6Insights', 'priorityOrder', 'focusAreas', 'dailyRoutine', 'monthlyGoals', 'motivationalNote']
  };

  const prompt = buildPrompt(analysisResults, scoringResults, userPreferences, previousScanData);

  try {
    // 60-second timeout to prevent infinite hang on slow/dead server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        schema
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        console.error('[RECOMMENDATIONS] Rate limit exceeded.');
        throw new Error('DAILY_LIMIT_REACHED');
      }
      throw new Error(`Server error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;

  } catch (err) {
    console.error('[RECOMMENDS] API Failure:', err);
    throw err;
  }
}
