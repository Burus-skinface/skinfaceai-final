import type { ComprehensiveFaceState } from '../faceScan/faceState';
import type { FaceStructureDetectionResult } from './types';

/**
 * STAGE 2: Face Structure Detection Module
 * 
 * Re-implemented to map strictly from Engine V2 metrics.
 */
export async function detectFaceStructure(
  faceState: ComprehensiveFaceState
): Promise<FaceStructureDetectionResult> {
  const geo = faceState.geometry;

  // 1. Jawline Definition
  let jawSharpness: 'sharp' | 'moderate' | 'soft' = 'moderate';
  if (geo.jawlineSharpness > 0.7) jawSharpness = 'sharp';
  else if (geo.jawlineSharpness < 0.4) jawSharpness = 'soft';

  // 2. Face Length/Width
  // standard: 1.25 - 1.40
  let flwBalance: 'well_balanced' | 'slightly_long' | 'slightly_wide' | 'long' | 'wide' = 'well_balanced';
  const flw = geo.faceLengthWidthRatio;
  if (flw > 1.45) flwBalance = 'long';
  else if (flw > 1.38) flwBalance = 'slightly_long';
  else if (flw < 1.20) flwBalance = 'wide';
  else if (flw < 1.25) flwBalance = 'slightly_wide';

  // 3. Eye Tilt
  let eyeTiltStatus: 'hunter_eye' | 'neutral' | 'negative' = 'neutral';
  if (geo.eyeTilt > 3.0) eyeTiltStatus = 'hunter_eye';
  else if (geo.eyeTilt < -1.0) eyeTiltStatus = 'negative';

  // 4. Jaw/Neck
  let jawNeckDef: 'strong' | 'moderate' | 'weak' = 'moderate';
  if (geo.jawNeckDefinition > 0.7) jawNeckDef = 'strong';
  else if (geo.jawNeckDefinition < 0.3) jawNeckDef = 'weak';

  // 5. Chin
  let chinBal: 'well_balanced' | 'chin_dominant' | 'philtrum_dominant' = 'well_balanced';
  if (geo.chinBalance > 2.2) chinBal = 'chin_dominant';
  else if (geo.chinBalance < 1.8) chinBal = 'philtrum_dominant';

  // 6. Facial Thirds Balance (from geometry)
  const thirds = [geo.upperThirdRatio, geo.middleThirdRatio, geo.lowerThirdRatio];
  const thirdsDeviation = Math.max(...thirds) - Math.min(...thirds);
  let thirdsBalance: 'balanced' | 'unbalanced' = 'balanced';
  if (thirdsDeviation > 0.06) thirdsBalance = 'unbalanced';

  // 7. Symmetry (from geometry)
  const symAvg = geo.symmetryAvg;
  let symmetryLevel: 'symmetric' | 'slightly_asymmetric' | 'asymmetric' = 'symmetric';
  let primaryDeviation = "None";
  if (symAvg < 0.7) {
    symmetryLevel = 'asymmetric';
    const symComponents = { eye: geo.symmetryEye, cheek: geo.symmetryCheek, jaw: geo.symmetryJaw, nose: geo.symmetryNose };
    const weakest = Object.entries(symComponents).sort((a, b) => a[1] - b[1])[0];
    primaryDeviation = weakest[0];
  } else if (symAvg < 0.85) {
    symmetryLevel = 'slightly_asymmetric';
    const symComponents = { eye: geo.symmetryEye, cheek: geo.symmetryCheek, jaw: geo.symmetryJaw, nose: geo.symmetryNose };
    const weakest = Object.entries(symComponents).sort((a, b) => a[1] - b[1])[0];
    primaryDeviation = weakest[0];
  }

  // 8. Brow Tilt (from geometry)
  let browTiltStatus: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (geo.browTilt > 2) browTiltStatus = 'positive';
  else if (geo.browTilt < -2) browTiltStatus = 'negative';

  // 9. Chin Projection
  let chinProj: 'balanced' | 'recessed' | 'prominent' = 'balanced';
  if (geo.chinProjectionRatio > 0.25) chinProj = 'prominent';
  else if (geo.chinProjectionRatio < 0.08) chinProj = 'recessed';

  // 10. Face Shape Classification (from ratios)
  let faceShape = 'Oval';
  const jcr = geo.jawCheekboneRatio;
  if (flw > 1.40 && jcr < 0.85) faceShape = 'Oblong';
  else if (flw < 1.22 && jcr > 0.92) faceShape = 'Round';
  else if (jcr < 0.80) faceShape = 'Heart';
  else if (jcr > 0.95 && geo.jawlineSharpness > 0.6) faceShape = 'Square';
  else if (geo.cheekboneWidthRatio > 1.08 && jcr < 0.88) faceShape = 'Diamond';
  else faceShape = 'Oval';

  // 11. Eye Shape (from tilt)
  let eyeShape = 'Almond';
  if (geo.eyeTilt > 4) eyeShape = 'Upturned';
  else if (geo.eyeTilt < -2) eyeShape = 'Downturned';
  else if (geo.eyeTilt > 1.5) eyeShape = 'Almond';
  else eyeShape = 'Round';

  // Construct the result object
  const result: FaceStructureDetectionResult = {
    jawlineDefinition: {
      sharpness: jawSharpness,
      regions: ["jawline"],
      description: `Jawline definition is ${jawSharpness}.`
    },
    facialProportions: {
      thirdsBalance,
      fifthsBalance: 'balanced',
      description: thirdsBalance === 'balanced'
        ? "Facial thirds appear balanced."
        : `Facial thirds are ${thirdsBalance.replace('_', ' ')} (deviation: ${(thirdsDeviation * 100).toFixed(0)}%).`
    },
    cheekboneProminence: {
      level: geo.cheekboneWidthRatio > 1.05 ? 'high' : 'moderate',
      description: `Cheekbones have ${geo.cheekboneWidthRatio > 1.05 ? 'high' : 'moderate'} prominence.`
    },
    symmetry: {
      overall: symmetryLevel,
      primaryDeviation,
      description: symmetryLevel === 'symmetric'
        ? "Face appears symmetric."
        : `Face shows ${symmetryLevel.replace('_', ' ')} (${primaryDeviation} area).`
    },
    profileBalance: {
      chinProjection: chinProj,
      noseProfile: 'straight',
      description: `Profile balance: chin is ${chinProj}.`
    },
    faceLengthWidthBalance: {
      balance: flwBalance,
      ratio: geo.faceLengthWidthRatio,
      description: `Face ratio is ${geo.faceLengthWidthRatio.toFixed(2)} (${flwBalance.replace('_', ' ')}).`
    },
    browTilt: {
      tilt: browTiltStatus,
      value: geo.browTilt,
      description: `Brow tilt is ${browTiltStatus} (${geo.browTilt.toFixed(1)}°).`
    },
    eyeTilt: {
      tilt: eyeTiltStatus,
      value: geo.eyeTilt,
      description: `Eye tilt is ${geo.eyeTilt.toFixed(1)} degrees.`
    },
    jawCheekboneRatio: {
      ratio: geo.jawCheekboneRatio,
      description: `Jaw to cheekbone ratio is ${geo.jawCheekboneRatio.toFixed(2)}.`
    },
    jawNeckDefinition: {
      definition: jawNeckDef,
      value: geo.jawNeckDefinition,
      description: `Jaw/Neck definition is ${jawNeckDef}.`
    },
    chinBalance: {
      balance: chinBal,
      ratio: geo.chinBalance,
      description: `Chin balance is ${chinBal.replace('_', ' ')}.`
    },
    profile: {
      faceShape,
      eyeShape
    }
  };

  return result;
}
