import type { PipelineResult } from './analysisPipeline';

/**
 * STAGE 5: Cache Manager
 * 
 * Stores pipeline results in memory for instant retrieval.
 * Results are cached after analysis completes, so tab switches are instant.
 * 
 * Future enhancement: Use IndexedDB for persistence across sessions.
 */

// In-memory cache
const resultsCache = new Map<string, PipelineResult>();

/**
 * Cache a pipeline result
 */
export function cacheResult(scanId: string, result: PipelineResult): void {
  resultsCache.set(scanId, result);
  console.log(`[CACHE] Stored result for scan: ${scanId}`);
}

/**
 * Retrieve a cached result
 */
export function getCachedResult(scanId: string): PipelineResult | null {
  const result = resultsCache.get(scanId) || null;
  
  if (result) {
    console.log(`[CACHE] Retrieved result for scan: ${scanId}`);
  } else {
    console.log(`[CACHE] No result found for scan: ${scanId}`);
  }
  
  return result;
}

/**
 * Check if a result is cached
 */
export function hasCachedResult(scanId: string): boolean {
  return resultsCache.has(scanId);
}

/**
 * Clear all cached results
 */
export function clearCache(): void {
  resultsCache.clear();
  console.log('[CACHE] All results cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  count: number;
  scanIds: string[];
} {
  return {
    count: resultsCache.size,
    scanIds: Array.from(resultsCache.keys()),
  };
}




