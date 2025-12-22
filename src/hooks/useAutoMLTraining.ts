/**
 * Hook to automatically trigger ML training when sufficient data exists
 * Checks data thresholds and triggers training in the background
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MIN_AURA_RECORDS = 10;
const MIN_SUBMISSIONS = 10;
const TRAINING_COOLDOWN_MS = 1000 * 60 * 60; // 1 hour

export const useAutoMLTraining = (enabled = true) => {
  const { toast } = useToast();
  const lastTrainingRef = useRef<number>(0);
  const isTrainingRef = useRef(false);

  const checkAndTriggerTraining = useCallback(async () => {
    if (!enabled || isTrainingRef.current) return;

    // Check cooldown
    const now = Date.now();
    if (now - lastTrainingRef.current < TRAINING_COOLDOWN_MS) {
      return;
    }

    try {
      // Check if we have sufficient data
      const [auraResult, submissionsResult, lastJobResult] = await Promise.all([
        supabase.from('aura_records').select('id', { count: 'exact', head: true }),
        supabase.from('assignment_submissions').select('id', { count: 'exact', head: true }).eq('status', 'graded'),
        supabase.from('ml_training_jobs').select('*').eq('status', 'completed').order('completed_at', { ascending: false }).limit(1),
      ]);

      const auraCount = auraResult.count || 0;
      const submissionsCount = submissionsResult.count || 0;
      const lastJob = lastJobResult.data?.[0];

      // Check if we have enough data and if there's new data since last training
      const hasEnoughData = auraCount >= MIN_AURA_RECORDS || submissionsCount >= MIN_SUBMISSIONS;
      
      if (!hasEnoughData) {
        console.log('[AutoML] Not enough data for training:', { auraCount, submissionsCount });
        return;
      }

      // Check if there's new data since last training
      if (lastJob) {
        const lastTrainingCount = lastJob.training_data_count || 0;
        const currentDataCount = auraCount + submissionsCount;
        
        // Only retrain if we have at least 10% more data
        if (currentDataCount < lastTrainingCount * 1.1) {
          console.log('[AutoML] Not enough new data since last training');
          return;
        }
      }

      console.log('[AutoML] Triggering background training...');
      isTrainingRef.current = true;
      lastTrainingRef.current = now;

      const { data, error } = await supabase.functions.invoke('train-ml-models', {
        body: {},
      });

      if (error) throw error;

      console.log('[AutoML] Training completed:', data);

      toast({
        title: "ML Models Updated",
        description: `Models trained with ${auraCount + submissionsCount} data points`,
      });

    } catch (error) {
      console.error('[AutoML] Training failed:', error);
    } finally {
      isTrainingRef.current = false;
    }
  }, [enabled, toast]);

  // Check for training on mount and periodically
  useEffect(() => {
    if (!enabled) return;

    // Initial check after 5 seconds
    const initialTimer = setTimeout(checkAndTriggerTraining, 5000);

    // Periodic check every 30 minutes
    const intervalTimer = setInterval(checkAndTriggerTraining, 1000 * 60 * 30);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [enabled, checkAndTriggerTraining]);

  return {
    triggerTraining: checkAndTriggerTraining,
    isTraining: isTrainingRef.current,
  };
};
