
import type { AnalysisResults } from '../analysis/types';
import type { ScoringResults } from '../scoring/types';
import type { DailyReport } from '../../types';

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

export interface RecommendationsResult {
  big6Insights: Big6Insights; // Dynamic AI Insights
  eliteReport?: EliteReport; // Optional for backward compatibility
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
CURRENT SCAN:
${currentData}

PREVIOUS SCAN:
${previousData}
---------------------

OUTPUT REQUIREMENTS:
1. **big6Insights**: One short, punchy, continuous paragraph for each of the 6 categories, strictly following the Data Mapping and Guardrails.
2. **motivationalNote**: A 2-sentence FRIENDLY summary of today's SKIN analysis findings.
3. **eliteReport**: A structural aesthetic breakdown (Front Architecture, Side Profile, Jawline, Harmony, Spectral).
4. **priorityOrder**: Ordered list of focus areas.
5. **focusAreas**, **dailyRoutine**, **monthlyGoals**: Actionable plans based on current deficits.
`
        }
      ]
    }
  ];
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
      motivationalNote: { type: "STRING" }
    },
    required: ['big6Insights', 'priorityOrder', 'focusAreas', 'dailyRoutine', 'monthlyGoals', 'motivationalNote']
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
