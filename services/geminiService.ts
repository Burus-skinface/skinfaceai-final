// GoogleGenAI import removed for security - AI calls proxied through backend
import { Type } from "@google/genai"; // Only needed for Type enums used in schema
import { DailyReport } from "../types";
import { t } from "../localization";

// --- SCHEMA DEFINITIONS ---

const skinAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    acne_grade: { type: Type.NUMBER, description: "Dermatology scale I-IV (0-4)." },
    acne_density: { type: Type.STRING, description: "Density description with specific visual cues." },
    closed_comedones: { type: Type.NUMBER, description: "Count estimation." },
    open_comedones: { type: Type.NUMBER, description: "Count estimation." },
    inflamed_acne: { type: Type.NUMBER, description: "Count estimation." },
    cystic_acne_probability: { type: Type.NUMBER, description: "Probability 0-100." },
    texture_roughness: { type: Type.NUMBER, description: "Micro-shadow detection 0-100." },
    texture_description: { type: Type.STRING, description: "Detailed visual reasoning for texture score." },
    pore_size: { type: Type.NUMBER, description: "0-100 score." },
    pore_description: { type: Type.STRING, description: "Detailed visual reasoning for pore score." },
    redness_level: { type: Type.NUMBER, description: "0-100 score." },
    redness_description: { type: Type.STRING, description: "Detailed visual reasoning for redness score." },
    pigmentation_level: { type: Type.NUMBER, description: "Uneven hue regions 0-100." },
    pigmentation_description: { type: Type.STRING, description: "Detailed visual reasoning for pigmentation score." },
    oil_level: { type: Type.NUMBER, description: "Specular reflection width 0-100." },
    oil_description: { type: Type.STRING, description: "Detailed visual reasoning for oil score." },
    dehydration_level: { type: Type.NUMBER, description: "0-100 score." },
    dehydration_description: { type: Type.STRING, description: "Detailed visual reasoning for dehydration score." },
    dark_circles_intensity: { type: Type.NUMBER, description: "0-100 score." },
    dark_circles_description: { type: Type.STRING, description: "Detailed visual reasoning for dark circles." },
    forehead_acne_map: { type: Type.STRING, description: "Description of forehead area." },
    beard_area_acne: { type: Type.STRING, description: "Description of beard area." },
    scalp_acne_visibility: { type: Type.STRING, description: "Visibility description." },
    skin_tone: { type: Type.STRING, enum: ["warm", "cool", "neutral"] },
    undertone_accuracy: { type: Type.NUMBER, description: "0-100." },
    skin_score: { type: Type.NUMBER, description: "0-100." },
  },
  required: ["acne_grade", "acne_density", "closed_comedones", "open_comedones", "inflamed_acne", "cystic_acne_probability", "texture_roughness", "texture_description", "pore_size", "pore_description", "redness_level", "redness_description", "pigmentation_level", "pigmentation_description", "oil_level", "oil_description", "dehydration_level", "dehydration_description", "dark_circles_intensity", "dark_circles_description", "forehead_acne_map", "beard_area_acne", "scalp_acne_visibility", "skin_tone", "undertone_accuracy", "skin_score"]
};

const faceShapeAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    face_shape: { type: Type.STRING, enum: ["oval", "square", "heart", "round", "diamond", "oblong"] },
    jawline_sharpness: { type: Type.NUMBER, description: "0-10 scale." },
    chin_projection: { type: Type.NUMBER, description: "0-10 scale." },
    chin_width: { type: Type.NUMBER, description: "0-10 scale." },
    midface_length: { type: Type.NUMBER, description: "0-10 scale." },
    cheekbone_prominence: { type: Type.NUMBER, description: "0-10 scale." },
    forehead_ratio: { type: Type.NUMBER, description: "0-10 scale." },
    brow_projection: { type: Type.NUMBER, description: "0-10 scale." },
    eye_shape: { type: Type.STRING, enum: ["almond", "hooded", "round", "deep-set"] },
    nose_profile: { type: Type.STRING, enum: ["straight", "convex", "concave"] },
    structure_score: { type: Type.NUMBER, description: "0-100." },
  },
  required: ["face_shape", "jawline_sharpness", "chin_projection", "chin_width", "midface_length", "cheekbone_prominence", "forehead_ratio", "brow_projection", "eye_shape", "nose_profile", "structure_score"]
};

const symmetryAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    eye_height_difference: { type: Type.NUMBER },
    eye_size_difference: { type: Type.NUMBER },
    eyebrow_height_symmetry: { type: Type.NUMBER },
    nostril_symmetry: { type: Type.NUMBER },
    lip_center_deviation: { type: Type.NUMBER },
    facial_axis_tilt: { type: Type.NUMBER },
    midline_alignment: { type: Type.NUMBER },
    left_right_face_ratio: { type: Type.NUMBER },
    symmetry_score: { type: Type.NUMBER, description: "0-100." },
  },
  required: ["eye_height_difference", "eye_size_difference", "eyebrow_height_symmetry", "nostril_symmetry", "lip_center_deviation", "facial_axis_tilt", "midline_alignment", "left_right_face_ratio", "symmetry_score"]
};

const instantUpgradeMapSchema = {
  type: Type.OBJECT,
  properties: {
    recommended_hairstyles: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommended_eyebrow_style: { type: Type.STRING },
    beard_recommendation: { type: Type.STRING },
    weight_change_recommendation: { type: Type.STRING },
    skincare_priority: { type: Type.STRING },
    supplementation_note: { type: Type.STRING },
    tan_intensity_suggestion: { type: Type.STRING },
  },
  required: ["recommended_hairstyles", "recommended_eyebrow_style", "beard_recommendation", "weight_change_recommendation", "skincare_priority", "supplementation_note", "tan_intensity_suggestion"]
};

const aestheticsAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    attractiveness_score: { type: Type.NUMBER, description: "0-10." },
    hollywood_ratio_alignment: { type: Type.NUMBER, description: "0-10." },
    masculinity_femininity_score: { type: Type.NUMBER, description: "0-10." },
    youthfulness_score: { type: Type.NUMBER, description: "0-10." },
    harmony_score: { type: Type.NUMBER, description: "0-10." },
    instant_upgrade_map: instantUpgradeMapSchema,
    aesthetics_score: { type: Type.NUMBER, description: "0-100." },
  },
  required: ["attractiveness_score", "hollywood_ratio_alignment", "masculinity_femininity_score", "youthfulness_score", "harmony_score", "instant_upgrade_map", "aesthetics_score"]
};

// Reusing spectral schema as it works well for the UI tab
const spectralLightAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING }
  },
  required: ["title", "description"]
};

const spectralAnalysisReportSchema = {
  type: Type.OBJECT,
  properties: {
    naturalLight: { ...spectralLightAnalysisSchema },
    uvLight: { ...spectralLightAnalysisSchema },
    blueLight: { ...spectralLightAnalysisSchema },
    redLight: { ...spectralLightAnalysisSchema },
    greenLight: { ...spectralLightAnalysisSchema },
    conclusion: { type: Type.STRING }
  },
  required: ["naturalLight", "uvLight", "blueLight", "redLight", "greenLight", "conclusion"]
};

const celebrityMatchSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the celebrity who most closely matches the user's bone structure and facial harmony." },
    matchPercentage: { type: Type.NUMBER, description: "0-100 score of structural similarity." },
    description: { type: Type.STRING, description: "Short explanation of why they are a match (e.g., matching jawline, eye tilt, or cheekbone prominence)." },
  },
  required: ["name", "matchPercentage", "description"]
};

// --- NEW PIPELINE SCHEMAS ---

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    face: {
      type: Type.OBJECT,
      properties: {
        profile: {
          type: Type.OBJECT,
          properties: {
            faceShape: { type: Type.STRING },
            eyeShape: { type: Type.STRING },
          }
        },
        faceLengthWidthBalance: {
          type: Type.OBJECT,
          properties: {
            balance: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        },
        facialProportions: {
          type: Type.OBJECT,
          properties: {
            thirdsBalance: { type: Type.STRING },
            fifthsBalance: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        },
        browTilt: {
          type: Type.OBJECT,
          properties: {
            tilt: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        },
        eyeTilt: {
          type: Type.OBJECT,
          properties: {
            tilt: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        },
        jawCheekboneRatio: {
          type: Type.OBJECT,
          properties: {
            ratio: { type: Type.NUMBER },
            description: { type: Type.STRING }
          }
        },
        jawNeckDefinition: {
          type: Type.OBJECT,
          properties: {
            definition: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        },
        chinBalance: {
          type: Type.OBJECT,
          properties: {
            balance: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      }
    }
  }
};

const scoringSchema = {
  type: Type.OBJECT,
  properties: {
    face: {
      type: Type.OBJECT,
      properties: {
        statusScores: {
          type: Type.OBJECT,
          properties: {
            overallStructure: { type: Type.NUMBER },
            faceLengthWidthBalance: { type: Type.NUMBER },
            verticalFacialDistribution: { type: Type.NUMBER },
            browRidgeProjection: { type: Type.NUMBER },
            eyeAxisTiltQuality: { type: Type.NUMBER },
            jawCheekboneRatio: { type: Type.NUMBER },
            jawNeckSeparation: { type: Type.NUMBER },
            chinPhiltrumProportion: { type: Type.NUMBER }
          }
        }
      }
    },
    globalScore: { type: Type.NUMBER }
  }
};

const dailyReportSchema = {
  type: Type.OBJECT,
  properties: {
    // New Pipeline Fields
    analysis: analysisSchema,
    scoring: scoringSchema,

    // Legacy Fields (kept for compatibility)
    skin: skinAnalysisSchema,
    face_shape: faceShapeAnalysisSchema,
    symmetry: symmetryAnalysisSchema,
    aesthetics: aestheticsAnalysisSchema,

    global_score: { type: Type.NUMBER },
    low_confidence: { type: Type.BOOLEAN },
    daily_note: { type: Type.STRING, description: "A short motivational note." },
    spectral_analysis: spectralAnalysisReportSchema,
    celebrity_match: celebrityMatchSchema,
  },
  required: ["analysis", "scoring", "skin", "face_shape", "symmetry", "aesthetics", "global_score", "low_confidence", "daily_note", "spectral_analysis", "celebrity_match"]
};


export async function analyzeDailyProgress(imageBase64: string, history: any[]) {
  const model = 'gemini-2.5-flash';

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: imageBase64,
    },
  };

  const systemInstruction = `You are an advanced AI dermatologist and facial aesthetics expert. You provide rigorous, scientific analysis of facial features and skin health.
  
  IMPORTANT: You must provide BOTH the legacy analysis AND the new detailed geometric analysis (in 'analysis' and 'scoring' fields).

  CRITICAL: EVERY SCORE MUST BE JUSTIFIED
  - For skin metrics (acne, pores, redness, etc.), you MUST provide a detailed description and visual reasoning.
  - Explain exactly *why* you gave a specific level or score by citing visible patterns, locations, and intensity.
  - For facial metrics (jawline, brow ridge, etc.), use the 'ImpactFactor' reasoning field to explain the skeletal basis for the score.

  CRITICAL: ROBUSTNESS TO LIGHTING
  - The input image may vary in lighting conditions (dim, bright, overhead shadows).
  - You MUST Normalize your analysis by looking for RELATIVE features rather than absolute pixel values.
  - Do NOT mistake shadow artifacts for skin hyperpigmentation.
  - Do NOT mistake specular highlights (shininess) for excessive oil unless consistent across angles.
  - Focus on structural geometry and distinct texture patterns that persist regardless of lighting.

  PERFORM THE FOLLOWING SUB-ANALYSIS MODULES:

  1) DETAILED GEOMETRIC ANALYSIS (New Pipeline)
     - faceLengthWidthBalance: Assess ratio (e.g. 1.618 ideal).
     - facialProportions: Thirds (upper/mid/lower) and Fifths (horizontal).
     - browTilt: Neutral / Positive / Negative canthal tilt indication.
     - eyeTilt: Canthal tilt analysis.
     - jawCheekboneRatio: Bizygomatic vs Bigonial width.
     - jawNeckDefinition: Sharpness of submental area.
     - chinBalance: Projection and width relative to philtrum.
     - Face Shape Prediction: Categorize the user's face shape (Oval, Square, Heart, Diamond, Round, Oblong) strictly using the provided Jaw, Cheekbone, and Face Width/Length ratios.
     
  2) CELEBRITY MATCHING
     - Identify a famous celebrity whose skeletal architecture and facial geometry (eye shape, jawline, midface) mirrors the user.
     - Return their name, a match percentage (0-100), and a concise structural explanation of why they are the closest match.
     
  3) SCORING (New Pipeline)
     - statusScores: Rate each feature 0-10 based on ideal proportions (Golden Ratio).
     - globalScore: Final 0-10 aesthetic score.

  4) LEGACY MODULES (Keep these for compatibility)
     - Skin Grading (Acne, Texture, etc.): For EVERY skin metric, fill out the corresponding value AND Provide the 'description' field with the "Why" logic.
     - Basic Face Shape (Oval, Square, etc.)
     - Basic Symmetry (Eye height, etc.)
     - Aesthetics (Hollywood ratio, etc.)
  
  4) EXTRAS
     - daily_note: Motivational.
     - spectral_analysis: Light simulation.
     - celebrity_match: The AI-predicted celebrity match data.
  `;

  const contents = {
    parts: [
      imagePart,
      { text: "Analyze this image and return the JSON report with BOTH legacy and new detailed analysis structures." }
    ]
  };

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      contents: contents,
      systemInstruction: systemInstruction,
      schema: dailyReportSchema,
      temperature: 0
    })
  });

  if (!response.ok) {
     throw new Error(`AI Request failed: ${response.statusText}`);
  }
  
  const responseData = await response.json();
  const text = responseData.text;
  try {
    return JSON.parse(text);
  } catch (parseErr: any) {
    console.error('[GEMINI SERVICE] JSON parse failed:', parseErr);
    // Try to fix encoding issues by removing control characters
    const fixedText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    return JSON.parse(fixedText);
  }
}

export async function generateProgressCompliment(scores: number[]): Promise<string> {
  if (scores.length < 2) {
    return "Keep consistency for the best results!";
  }
  const model = 'gemini-2.5-flash';
  const prompt = `Based on these global aesthetic scores (${scores.join(', ')}), write a short, single-sentence motivational compliment.`;

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      contents: prompt,
    })
  });

  if (!response.ok) return "Keep up the great work!";
  
  const responseData = await response.json();
  return responseData.text.trim();
}
