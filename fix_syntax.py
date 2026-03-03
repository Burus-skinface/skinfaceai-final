#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re

# Read the file
with open(r'c:\Users\emreb\OneDrive\Masaüstü\mis602\cdz\services\analysis\skinDetection.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken template literals
content = content.replace(
    'const textureVariance = Object.entries(faceState.texture.regionVariance).map(([region, value]) => `${ region }: ${ value.toFixed(3)\n} `).join(\', \');',
    'const textureVariance = Object.entries(faceState.texture.regionVariance).map(([region, value]) => `${region}: ${value.toFixed(3)}`).join(\', \');'
)

content = content.replace(
    'const poreVisibility = Object.entries(faceState.texture.poreVisibilityScore).map(([region, value]) => `${ region }: ${ value.toFixed(3) } `).join(\', \');',
    'const poreVisibility = Object.entries(faceState.texture.poreVisibilityScore).map(([region, value]) => `${region}: ${value.toFixed(3)}`).join(\', \');'
)

content = content.replace(
    'const toneEvenness = Object.entries(faceState.tone.regionEvenness).map(([region, value]) => `${ region }: ${ value.toFixed(3) } `).join(\', \');',
    'const toneEvenness = Object.entries(faceState.tone.regionEvenness).map(([region, value]) => `${region}: ${value.toFixed(3)}`).join(\', \');'
)

content = content.replace(
    'const redness = Object.entries(faceState.tone.regionRedness).map(([region, value]) => `${ region }: ${ value.toFixed(3) } `).join(\', \');',
    'const redness = Object.entries(faceState.tone.regionRedness).map(([region, value]) => `${region}: ${value.toFixed(3)}`).join(\', \');'
)

content = content.replace(
    'const regionRGB = Object.entries(faceState.tone.regionRGB).map(([region, rgb]) => `${ region }: [${ rgb[0].toFixed(0) }, ${ rgb[1].toFixed(0) }, ${ rgb[2].toFixed(0) }]`).join(\', \');',
    'const regionRGB = Object.entries(faceState.tone.regionRGB).map(([region, rgb]) => `${region}: [${rgb[0].toFixed(0)}, ${rgb[1].toFixed(0)}, ${rgb[2].toFixed(0)}]`).join(\', \');'
)

content = content.replace(
    'const shadowDensity = Object.entries(faceState.spectral.shadowDensity).map(([region, value]) => `${ region }: ${ value.toFixed(3) } `).join(\', \');',
    'const shadowDensity = Object.entries(faceState.spectral.shadowDensity).map(([region, value]) => `${region}: ${value.toFixed(3)}`).join(\', \');'
)

content = content.replace(
    'const contrastMap = Object.entries(faceState.spectral.contrastMap).map(([region, value]) => `${ region }: ${ value.toFixed(3) } `).join(\', \');',
    'const contrastMap = Object.entries(faceState.spectral.contrastMap).map(([region, value]) => `${region}: ${value.toFixed(3)}`).join(\', \');'
)

# Write back
with open(r'c:\Users\emreb\OneDrive\Masaüstü\mis602\cdz\services\analysis\skinDetection.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
