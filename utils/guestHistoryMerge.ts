import type { DailyReport } from '../types';
import { supabase } from '../services/supabase';
import { purgeExpiredBiometrics } from './biometricRetention';

/**
 * After guest → auth: upload local history rows missing from cloud scans.
 */
export async function mergeGuestHistoryOnLogin(
  userId: string,
  localHistory: DailyReport[]
): Promise<DailyReport[]> {
  if (!userId || localHistory.length === 0) return localHistory;

  try {
    const { data: cloud } = await supabase
      .from('scans')
      .select('id')
      .eq('user_id', userId);

    const cloudIds = new Set((cloud || []).map((r: { id: string }) => r.id));
    const toUpload = purgeExpiredBiometrics(localHistory).filter((r) => !cloudIds.has(r.id));

    for (const report of toUpload) {
      const { error } = await supabase.from('scans').insert({
        id: report.id,
        user_id: userId,
        image_url: report.imageUrl || null,
        face_state: report.faceState || null,
        analysis_results: report.analysis || null,
        scoring: report.scoring || null,
        recommendations: report.recommendations || null,
        created_at: report.date,
      });
      if (error && error.code !== '23505') {
        console.warn('[GUEST_MERGE] upload failed', report.id, error.message);
      }
    }
  } catch (e) {
    console.warn('[GUEST_MERGE] failed', e);
  }

  return localHistory;
}
