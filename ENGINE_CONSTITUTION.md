# ENGINE CONSTITUTION

This document defines the immutable rules that govern the Face Scan Engine architecture.

## Rule #0: Single Truth Source

**FACE_STATE is the ONLY truth source for analysis.**

- ❌ Frame ≠ analysis input
- ❌ Landmark ≠ analysis input
- ❌ Video ≠ analysis input
- ✅ FACE_STATE = stabilized, summarized, analysis-ready object

**Gemini ONLY reads FACE_STATE. Nothing else.**

## Rule #1: Camera Level (ISP & Hardware)

### 1.1 Frame Rate: 30 FPS
- ✅ 30 FPS: ISP native, less heat, less exposure jitter
- ❌ 60 FPS: unnecessary, more noise, more drops

### 1.2 Exposure & White Balance Lock
- Scan must start with AE + AWB locked
- If lock fails: reduce qualityScore and captureConfidence

### 1.3 Frame Format
- Android: YUV_420_888
- iOS: NV12
- Convert to RGB ONLY for anchor frame

## Rule #2: Tracker Level (FaceMesh)

### 2.1 FaceMesh is Sufficient
- 468 landmarks: enough for structural analysis
- GPU/NN optimized, deterministic
- ❌ Never ask Gemini to extract landmarks

### 2.2 Pose Calculation (yaw/pitch/roll)
- Landmark → PnP: microsecond-level computation
- Every frame, cheap and fast
- Pose = bucket selection key

## Rule #3: FramePacket is Immutable

```
CameraFrame → TrackerOutput → FramePacket
```

**Why immutable:**
- Easy debugging
- Thread-safe
- Prevents accidental re-analysis

## Rule #4: Cheap Metrics Only

**All per-frame metrics MUST be O(pixels) or cheaper.**

### Forbidden (Expensive):
- ❌ FFT
- ❌ Laplacian blur (full convolution)
- ❌ Color constancy models

### Allowed (Cheap):
- ✅ Jitter: landmark delta (free)
- ✅ Lighting: mean + variance
- ✅ Blur proxy: motion + jitter together

**Goal:** "Is this frame reliable?" NOT "Is this photo beautiful?"

## Rule #5: Angle Bucketing is Mandatory

Single frame → perspective distortion → wrong asymmetry measurements

**Bucket strategy:**
- FRONT → anchor
- LEFT / RIGHT → symmetry & depth validation

Multi-angle merge → stabilized geometry

## Rule #6: Streaming Top-K Heap

❌ "Collect all frames then sort" → RAM explosion, GC triggers

✅ Streaming heap:
- RAM constant
- Duration constant
- Worst-case predictable

**This is mobile production standard.**

## Rule #7: Scan Duration: 2–3 Seconds

- < 2s: insufficient angle diversity
- 3s: user impatient, thermal risk
- 2.5s optimal: ~75 frames captured, ~40-50 processed

## Rule #8: Merge Strategy

### 8.1 Landmark Merge: MEDIAN (Not Mean)
- Mean: outlier ruins result
- Median: stable, cheap, deterministic
- **Single bad frame CANNOT corrupt FACE_STATE**

### 8.2 Single Anchor Image
- Skin & spectral need spatial (not temporal) analysis
- Multi-image fusion: heavy, mobile overkill
- Quality = correct image selection, not image count

## Rule #9: FACE_STATE is the Analysis Gateway

**FACE_STATE is sacred:**
- Single input
- Single analysis
- Single result

**Why summary, not raw?**
Gemini drowns in raw data. Give it:
- ❌ "Here are 468 points"
- ✅ "Here's the symmetry metric"

## Rule #10: Gemini's Role (Crystal Clear)

### Gemini DOES NOT:
- ❌ Measure
- ❌ Compute
- ❌ Stabilize

### Gemini DOES:
- ✅ Interpret
- ✅ Score
- ✅ Derive meaning

**If this separation breaks:**
- Latency increases
- Results become inconsistent
- "AI screwed up" happens

## Rule #11: Deterministic Scoring

**AI-assisted ≠ random**

Correct approach:
- Feature extraction = deterministic
- Base scoring = deterministic
- Gemini: interprets scores, explains contradictions

**Result:** Same face → similar score. AI is only the explanation layer.

## Rule #12: On-Device Gemini Advantage

Benefits:
- No server latency
- Strong privacy
- Offline potential
- Instant UX

**But:** If input isn't kept small → RAM/CPU explosion

**FACE_STATE exists for this reason.**

## Rule #13: Forbidden Bugs

❌ Calling Gemini during scan loop
❌ Asking Gemini to "interpret" landmarks
❌ Sending 30 frames as images to Gemini
❌ Each module extracts its own ROI
❌ Making FACE_STATE mutable

## Rule #14: Final Flow (One Line)

```
Camera → Tracker → Cheap Metrics → Bucket+Heap
  → Landmark Merge + Anchor Select
  → FACE_STATE
  → Gemini Analyze (ONCE)
  → Scores + Commentary
```

## Rule #15: Architectural Inspiration

This architecture mirrors:
- Apple FaceID
- Bank KYC systems
- Medical imaging (lightweight)

**Difference:** We use Gemini for the interpretation layer.

**This is correct.**

---

## Implementation Checklist

- [x] FACE_STATE is readonly/immutable
- [x] Landmark merge uses median (not mean)
- [x] All metrics are O(pixels) or cheaper
- [x] Camera has 30 FPS + AE/AWB locks
- [x] Constitution assertions in critical paths
- [x] Gemini NEVER called during scan
- [x] Constitution markers in code comments
- [x] Runtime validation in development mode

---

## Violation Detection

All constitution violations throw errors prefixed with:
```
[CONSTITUTION VIOLATION] <reason>
```

In development mode, FACE_STATE is frozen to enforce immutability.

---

**This constitution is immutable. Do not compromise these rules.**



