
import type { AnalysisResults } from '../analysis/types';
import type { ScoringResults } from '../scoring/types';

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

export interface RecommendationsResult {
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
/**
 * Build prompt from results (NO raw scan data)
 */
function buildPrompt(
  analysisResults: AnalysisResults,
  scoringResults: ScoringResults,
  userPreferences?: UserPreferences
): any {
  const { skin: skinAnalysis, face: faceAnalysis, spectral: spectralAnalysis } = analysisResults;
  const { skin: skinScores, face: faceScores, spectral: spectralScores } = scoringResults;

  // Elite Aesthetic Architect data mapping (0-100 scale)
  // Safety: Handle NaN/Infinity with fallback to 50 (Neutral) to prevent JSON errors
  const safeScore = (val: number) => (Number.isFinite(val) ? Math.round(val * 10) : 50);

  const eliteScores = {
    length_width_score: safeScore(faceScores.statusScores.faceLengthWidthBalance),
    vertical_distribution_score: safeScore(faceScores.statusScores.verticalFacialDistribution),
    eye_axis_score: safeScore(faceScores.statusScores.eyeAxisTiltQuality),
    brow_structure_score: safeScore(faceScores.statusScores.browRidgeProjection),
    jaw_cheekbone_score: safeScore(faceScores.statusScores.jawCheekboneRatio),
    jaw_neck_score: safeScore(faceScores.statusScores.jawNeckSeparation),
    chin_balance_score: safeScore(faceScores.statusScores.chinPhiltrumProportion),
  };

  // ... (rest of logic) ...

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
      // ... (other props) ...
    },
    required: ['eliteReport', 'priorityOrder', 'focusAreas', 'dailyRoutine', 'monthlyGoals', 'motivationalNote']
  };

  // 1. Gender Context
  const gender = userPreferences?.gender?.toLowerCase() || 'neutral';
  const age = userPreferences?.age || '25-34';
  const isMale = gender === 'male';
  const isFemale = gender === 'female';

  // 2. Dynamic Persona Constraints
  let aestheticFocus = "";
  if (isMale) {
    aestheticFocus = `
      - VALID ARCHETYPES: THE WARRIOR, THE MODEL, THE REGAL, PRETTY BOY, THE NOBLE.
      - KEYWORDS: Hunter Eyes, Warrior Skull, Dimorphic, Chiseled, Mog, Dominant, Angularity, Ramus Length, Forward Growth.
      - GOOD: "High T", "Robust", "Predator", "Compact Midface".
      - BAD: "Recessed", "Soft", "Prey Eyes", "Undefined".
    `;
  } else if (isFemale) {
    aestheticFocus = `
      - VALID ARCHETYPES: THE SIREN, THE EMPRESS, THE ANGEL, THE MUSE, THE NATURAL.
      - KEYWORDS: Siren Eyes, Doe Eyes, V-Line, High Trust/Low Trust (contextual), Neotenous vs. Sharp, Elegance, Ethereal.
      - GOOD: "Harmony", "Delicate", "Feline", "Sculpted", "Youthful".
      - BAD: "Heavy", "Square (if excessive)", "Tired", "Imbalanced".
    `;
  } else {
    aestheticFocus = `
      - VALID ARCHETYPES: THE ELITE MODEL, THE BALANCED AESTHETIC.
      - KEYWORDS: Harmony, Balance, Definition, Flow, Angularity.
      - GOOD: "Structured", "Clean", "Proportional".
      - BAD: "Weak", "Undefined", "Asymmetric".
    `;
  }

  // 3. User-Friendly AI Commentary Guide
  const toneInstruction = `
    TONE GUIDE:
    - motivationalNote MUST be a user-friendly, supportive, and professional summary about today's skin results.
    - Treat motivationalNote as a "Daily AI Analysis Result Comment".
    - The rest of the report (eliteReport) should remain technical and high-impact.
    - MIX TECHNICAL + SUPPORTIVE: e.g., "Your skin clarity is up by 12% today, showing great response to the hydration protocol." 
  `;

  return [
    {
      role: "user",
      parts: [
        {
          text: `You are the "Elite Aesthetic Architect". Provide a detailed aesthetic audit and a user-friendly skin analysis summary.

USER PROFILE: ${gender.toUpperCase()} | Age: ${age}
DETECTED ARCHETYPE: "${faceScores.archetype || 'Undetermined'}"

${aestheticFocus}

${toneInstruction}

INPUT METRICS for Skin & Face:
- Skin Integrity (Spectral): ${(spectralScores.overallScore || 0).toFixed(1)}/10 [Pigment: ${spectralScores.statusScores.pigmentUniformity}, Redness: ${spectralScores.statusScores.rednessSignal}, Clarity: ${spectralScores.statusScores.opticalClarity}]
- Front Architecture: ${(faceScores.measurements?.facialThirds?.score || 0).toFixed(1)}/10
- Side Profile: ${(faceScores.measurements?.sideProfile?.overallScore || 0).toFixed(1)}/10
- Jawline Strength: ${(faceScores.measurements?.jawAngularity?.overallScore || 0).toFixed(1)}/10

OUTPUT REQUIREMENTS:

1. **motivationalNote**: A 2-sentence FRIENDLY summary of today's SKIN analysis findings. Talk directly to the user about their skin progress.
2. **eliteReport**:
   - **featureBreakdown**: 5 modules ("Front Architecture", "Side Profile", "Jawline Strength", "Harmony & Symmetry", "Spectral Analysis").
   - **structuralVerdict**: One brutal, all-encompassing sentence on global tier.
   - **technicalAssets**: Top 3 features.
   - **technicalDeficits**: Bottom 2 features.
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
  userPreferences?: UserPreferences
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
    required: ['priorityOrder', 'focusAreas', 'dailyRoutine', 'monthlyGoals', 'motivationalNote']
  };

  const prompt = buildPrompt(analysisResults, scoringResults, userPreferences);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        schema
      })
    });

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
