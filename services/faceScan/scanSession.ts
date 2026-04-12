import type { AngleBucket, SelectedFrame, FrameMetrics } from "./types";

/**
 * PRODUCTION RUNTIME ARCHITECTURE
 * 
 * ScanSession: State Machine + Bucket Management
 * 
 * State flow: READY → SCAN_ACTIVE → SCAN_COMPLETE → PROCESSING
 * 
 * Progress is BUCKET-BASED, not time-based.
 * Ring fills only when frames are accepted into buckets.
 */

export type ScanState = 'READY' | 'SCAN_ACTIVE' | 'SCAN_COMPLETE' | 'PROCESSING';

export interface BucketStatus {
  target: number;           // Target frame count (e.g., 10)
  accepted: number;         // Current accepted count
  heap: SelectedFrame[];    // Top-K frames (best quality)
  maxHeapSize: number;      // K value (e.g., 15)
}

export interface ScanSessionConfig {
  bucketTargets: Record<AngleBucket, number>;
  maxHeapSize: number;
  minQualityScore: number;
  cooldownMs: number;       // Min time between frame accepts (50-100ms)
  scanDurationMs: number;   // Max scan duration (2500ms)
  minPerBucketToFinish: number; // Fallback if timeout
}

export const DEFAULT_SCAN_CONFIG: ScanSessionConfig = {
  bucketTargets: {
    front: 10,  // Total: 30 frames = 100% progress
    left: 10,
    right: 10,
  },
  maxHeapSize: 15,
  minQualityScore: 0.55,
  cooldownMs: 80,           // 50-100ms recommended
  scanDurationMs: 2500,     // 2.5 seconds
  minPerBucketToFinish: 8,
};

export class ScanSession {
  private state: ScanState = 'READY';
  private config: ScanSessionConfig;
  private buckets: Record<AngleBucket, BucketStatus>;
  private lastAcceptedTs: number = 0;
  private startTs: number = 0;
  
  constructor(config: Partial<ScanSessionConfig> = {}) {
    this.config = { ...DEFAULT_SCAN_CONFIG, ...config };
    this.buckets = this.initializeBuckets();
  }
  
  private initializeBuckets(): Record<AngleBucket, BucketStatus> {
    return {
      front: {
        target: this.config.bucketTargets.front,
        accepted: 0,
        heap: [],
        maxHeapSize: this.config.maxHeapSize,
      },
      left: {
        target: this.config.bucketTargets.left,
        accepted: 0,
        heap: [],
        maxHeapSize: this.config.maxHeapSize,
      },
      right: {
        target: this.config.bucketTargets.right,
        accepted: 0,
        heap: [],
        maxHeapSize: this.config.maxHeapSize,
      },
    };
  }
  
  /**
   * Start scan session
   * Resets all buckets and state
   */
  start(): void {
    console.log('[SCAN SESSION] Starting scan...');
    this.state = 'SCAN_ACTIVE';
    this.buckets = this.initializeBuckets();
    this.lastAcceptedTs = 0;
    this.startTs = Date.now();
  }
  
  /**
   * Check if frame can be accepted
   * 
   * Gates:
   * 1. Session must be active
   * 2. Cooldown period (50-100ms)
   * 3. Quality threshold
   * 4. Bucket not already full
   */
  canAcceptFrame(
    bucket: AngleBucket,
    qualityScore: number,
    currentTs: number
  ): boolean {
    // Gate 1: Session active
    if (this.state !== 'SCAN_ACTIVE') {
      return false;
    }
    
    // Gate 2: Cooldown (prevent spam from same pose)
    const timeSinceLastAccept = currentTs - this.lastAcceptedTs;
    if (this.lastAcceptedTs > 0 && timeSinceLastAccept < this.config.cooldownMs) {
      return false;
    }
    
    // Gate 3: Quality threshold
    if (qualityScore < this.config.minQualityScore) {
      return false;
    }
    
    // Gate 4: Bucket not full (allow overflow to heap for quality)
    const bucketStatus = this.buckets[bucket];
    if (bucketStatus.accepted >= bucketStatus.target && 
        bucketStatus.heap.length >= bucketStatus.maxHeapSize) {
      // Bucket full and heap full
      // Only accept if quality is better than worst in heap
      const worstQuality = bucketStatus.heap[bucketStatus.heap.length - 1]?.metrics.qualityScore ?? 0;
      if (qualityScore <= worstQuality) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Accept frame into bucket heap
   * Updates accepted count and progress
   */
  acceptFrame(bucket: AngleBucket, frame: SelectedFrame, currentTs: number): void {
    const bucketStatus = this.buckets[bucket];
    
    // Insert into heap in sorted order (highest quality first)
    const insertIndex = bucketStatus.heap.findIndex(
      f => f.metrics.qualityScore < frame.metrics.qualityScore
    );
    
    if (insertIndex === -1) {
      bucketStatus.heap.push(frame);
    } else {
      bucketStatus.heap.splice(insertIndex, 0, frame);
    }
    
    // Trim heap to max size
    if (bucketStatus.heap.length > bucketStatus.maxHeapSize) {
      bucketStatus.heap.length = bucketStatus.maxHeapSize;
    }
    
    // Increment accepted count (up to target)
    if (bucketStatus.accepted < bucketStatus.target) {
      bucketStatus.accepted++;
    }
    
    this.lastAcceptedTs = currentTs;
    
    console.log(`[SCAN SESSION] Frame accepted: ${bucket} (${bucketStatus.accepted}/${bucketStatus.target})`);
  }
  
  /**
   * Get progress as 0-1
   * Progress = (total accepted) / (total target)
   * 
   * BUCKET-BASED, not time-based
   */
  getProgress(): number {
    const totalAccepted = 
      this.buckets.front.accepted +
      this.buckets.left.accepted +
      this.buckets.right.accepted;
    
    const totalTarget = 
      this.config.bucketTargets.front +
      this.config.bucketTargets.left +
      this.config.bucketTargets.right;
    
    return Math.min(1, totalAccepted / totalTarget);
  }
  
  /**
   * Get filled ring segments (120 total)
   */
  getFilledSegments(): number {
    return Math.round(this.getProgress() * 120);
  }
  
  /**
   * Check if scan is complete
   * 
   * Complete when:
   * - All buckets reached target, OR
   * - Timeout + minimum per bucket met
   */
  isComplete(): boolean {
    const allBucketsFilled = 
      this.buckets.front.accepted >= this.config.bucketTargets.front &&
      this.buckets.left.accepted >= this.config.bucketTargets.left &&
      this.buckets.right.accepted >= this.config.bucketTargets.right;
    
    if (allBucketsFilled) {
      return true;
    }
    
    // Fallback: timeout + minimum frames per bucket
    const elapsed = Date.now() - this.startTs;
    if (elapsed >= this.config.scanDurationMs) {
      const minMet = 
        this.buckets.front.accepted >= this.config.minPerBucketToFinish &&
        this.buckets.left.accepted >= this.config.minPerBucketToFinish &&
        this.buckets.right.accepted >= this.config.minPerBucketToFinish;
      
      if (minMet) {
        console.log('[SCAN SESSION] Timeout reached with minimum frames met');
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Mark scan as complete
   */
  complete(): void {
    if (this.state === 'SCAN_ACTIVE') {
      this.state = 'SCAN_COMPLETE';
      console.log('[SCAN SESSION] Scan complete');
      console.log(`  Front: ${this.buckets.front.accepted}/${this.config.bucketTargets.front}`);
      console.log(`  Left: ${this.buckets.left.accepted}/${this.config.bucketTargets.left}`);
      console.log(`  Right: ${this.buckets.right.accepted}/${this.config.bucketTargets.right}`);
    }
  }
  
  /**
   * Transition to processing state
   */
  startProcessing(): void {
    this.state = 'PROCESSING';
    console.log('[SCAN SESSION] Processing FACE_STATE...');
  }
  
  /**
   * Get current state
   */
  getState(): ScanState {
    return this.state;
  }
  
  /**
   * Get bucket status (for debugging/UI)
   */
  getBucketStatus(bucket: AngleBucket): BucketStatus {
    return this.buckets[bucket];
  }
  
  /**
   * Get all frames from all buckets
   */
  getAllFrames(): SelectedFrame[] {
    return [
      ...this.buckets.front.heap,
      ...this.buckets.left.heap,
      ...this.buckets.right.heap,
    ];
  }
  
  /**
   * Get frames by bucket
   */
  getFramesByBucket(): Record<AngleBucket, SelectedFrame[]> {
    return {
      front: this.buckets.front.heap,
      left: this.buckets.left.heap,
      right: this.buckets.right.heap,
    };
  }
  
  /**
   * Reset session to READY state
   */
  reset(): void {
    this.state = 'READY';
    this.buckets = this.initializeBuckets();
    this.lastAcceptedTs = 0;
    this.startTs = 0;
    console.log('[SCAN SESSION] Reset to READY');
  }
}




