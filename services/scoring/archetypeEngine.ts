/** Rule-based face archetype from structure scores (0–100 scale inputs). */
export function computeArchetype(harmonyScore: number, jawScore: number, frontScore: number): string {
  const avg = (harmonyScore + jawScore + frontScore) / 3;
  if (avg >= 85) return 'Balanced Classic';
  if (jawScore >= 85) return 'Defined Angular';
  if (harmonyScore >= 80) return 'Soft Harmony';
  if (frontScore >= 80) return 'Frontal Focus';
  if (avg >= 70) return 'Natural Balance';
  return 'Emerging Structure';
}
