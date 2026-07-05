// Fire-and-forget AURA submission for the Pre-K video adventure.
//
// The kid's gameplay is driven by Web Speech (instant). The captured
// MediaRecorder blob + transcript is uploaded to the existing aura-audio
// bucket and pushed through the existing `analyze-aura` edge function so
// every Pre-K word read flows into the same data spine (and the same 4 ML
// models — phoneme transfer, risk scoring, next-best-action, Bloom's) as
// every other mode in the platform.
//
// Failures are swallowed — the game never waits or fails because of this.

import { supabase } from "@/integrations/supabase/client";
import { mirrorToR2Async } from "./r2Mirror";

export interface PreKAuraContext {
  level_id: string;
  step_index: number;
  expected_word: string;
  attempts: number;
  auto_passed: boolean;
}

export async function submitPreKAuraReading(opts: {
  studentId: string;
  audioBlob: Blob | null;
  transcript: string;
  durationSeconds: number;
  matched: boolean;
  context: PreKAuraContext;
}): Promise<void> {
  const { studentId, audioBlob, transcript, durationSeconds, matched, context } = opts;
  try {
    let audioUrl: string | undefined;

    if (audioBlob && audioBlob.size > 1000) {
      const timestamp = Date.now();
      const audioPath = `${studentId}/${timestamp}-prek.webm`;
      const { data, error } = await supabase.storage
        .from("aura-audio")
        .upload(audioPath, audioBlob, {
          contentType: audioBlob.type || "audio/webm",
          upsert: false,
        });
      if (!error && data) {
        audioUrl = audioPath;
        mirrorToR2Async("aura-audio", audioPath, audioBlob.type || "audio/webm", audioBlob.size);
      } else if (error) {
        console.warn("[PreKAura] audio upload failed:", error.message);
      }
    }

    const { error: fnError } = await supabase.functions.invoke("analyze-aura", {
      body: {
        transcript: transcript || context.expected_word,
        durationSeconds: Math.max(0.1, durationSeconds),
        audioUrl,
        freeMode: true,
        context: {
          mode: "prek_video",
          level_id: context.level_id,
          step_index: context.step_index,
          expected_word: context.expected_word,
          matched,
          attempts: context.attempts,
          auto_passed: context.auto_passed,
        },
      },
    });
    if (fnError) {
      console.warn("[PreKAura] analyze-aura failed:", fnError.message);
    }
  } catch (err) {
    console.warn("[PreKAura] submission swallowed error:", err);
  }
}
