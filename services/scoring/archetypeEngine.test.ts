import { describe, it, expect } from 'vitest';
import { computeArchetype } from './archetypeEngine';
import { createSpectralFallback } from '../analysis/spectralDetection';

describe('archetypeEngine', () => {
  it('returns Balanced Classic for high average scores', () => {
    expect(computeArchetype(90, 88, 87)).toBe('Balanced Classic');
  });

  it('returns Emerging Structure for low scores', () => {
    expect(computeArchetype(55, 50, 52)).toBe('Emerging Structure');
  });
});

describe('spectral fallback', () => {
  it('provides valid fallback structure', () => {
    const fb = createSpectralFallback();
    expect(fb.overallScore).toBeGreaterThan(0);
    expect(fb.pigmentUniformity.uniformityIndex).toBeGreaterThan(0);
  });
});
