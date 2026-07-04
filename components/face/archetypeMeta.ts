export interface ArchetypeMeta {
  id: string;
  label: string;
  subtitle: string;
  wireframeSrc: string;
}

export const ARCHETYPE_CATALOG: Record<string, ArchetypeMeta> = {
  'Balanced Classic': {
    id: 'balanced-classic',
    label: 'Balanced Classic',
    subtitle: 'Even proportions with harmonious facial thirds',
    wireframeSrc: '/images/hero-scan-default.png',
  },
  'Defined Angular': {
    id: 'defined-angular',
    label: 'Defined Angular',
    subtitle: 'Strong jawline and crisp lower-face definition',
    wireframeSrc: '/images/hero-scan-default.png',
  },
  'Soft Harmony': {
    id: 'soft-harmony',
    label: 'Soft Harmony',
    subtitle: 'Gentle contours with cohesive symmetry',
    wireframeSrc: '/images/hero-scan-default.png',
  },
  'Frontal Focus': {
    id: 'frontal-focus',
    label: 'Frontal Focus',
    subtitle: 'Front-view balance drives your overall read',
    wireframeSrc: '/images/hero-scan-default.png',
  },
  'Natural Balance': {
    id: 'natural-balance',
    label: 'Natural Balance',
    subtitle: 'Solid fundamentals with room to refine',
    wireframeSrc: '/images/hero-scan-default.png',
  },
  'Emerging Structure': {
    id: 'emerging-structure',
    label: 'Emerging Structure',
    subtitle: 'Developing definition across key landmarks',
    wireframeSrc: '/images/hero-scan-default.png',
  },
};

export function getArchetypeMeta(name: string | undefined): ArchetypeMeta {
  if (name && ARCHETYPE_CATALOG[name]) return ARCHETYPE_CATALOG[name];
  return ARCHETYPE_CATALOG['Natural Balance'];
}
