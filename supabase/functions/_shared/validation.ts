// Shared Zod validation schemas for edge functions
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// UUID validation
export const uuidSchema = z.string().uuid({ message: "Invalid UUID format" });

// Common schemas
export const classroomIdSchema = z.object({
  classroom_id: uuidSchema,
});

export const studentIdSchema = z.object({
  studentId: uuidSchema,
});

export const questionGroupSchema = z.object({
  question_group_id: uuidSchema,
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
});

export const generateExercisesSchema = z.object({
  studentId: uuidSchema,
  phonemeGaps: z.array(z.string().min(1).max(10)).min(1).max(20),
  grade: z.number().int().min(1).max(12).optional(),
});

export const exerciseEffectivenessSchema = z.object({
  exerciseId: uuidSchema,
  studentId: uuidSchema,
});

export const tournamentSchema = z.object({
  tournament_id: uuidSchema,
  round_number: z.number().int().min(0).max(20),
});

export const matchSchema = z.object({
  match_id: uuidSchema,
  seq: z.number().int().min(0).max(1000),
  tournament_player_id: uuidSchema,
});

export const submitAnswerSchema = z.object({
  match_id: uuidSchema,
  seq: z.number().int().min(0).max(1000),
  tournament_player_id: uuidSchema,
  answer_text: z.string().min(1).max(500),
});

export const buzzInSchema = z.object({
  match_id: uuidSchema,
  seq: z.number().int().min(0).max(1000),
  tournament_player_id: uuidSchema,
});

export const startTournamentSchema = z.object({
  tournament_id: uuidSchema,
});

export const seedMatchesSchema = z.object({
  tournament_id: uuidSchema,
  round_number: z.number().int().min(0).max(20),
});

export const startRoundSchema = z.object({
  tournament_id: uuidSchema,
  round_number: z.number().int().min(0).max(20),
});

export const showNextQuestionSchema = z.object({
  match_id: uuidSchema,
});

export const endRoundSchema = z.object({
  tournament_id: uuidSchema,
  round_number: z.number().int().min(0).max(20),
});

export const transcribeAudioSchema = z.object({
  audio: z.string().min(100).max(10000000), // base64 string, reasonable size limits
});

export const extractTextSchema = z.object({
  image: z.string().min(100).max(10000000), // base64 or URL
});

export const trainMLSchema = z.object({
  force: z.boolean().optional(),
});

export const generateQuestionSchema = z.object({
  classroom_id: uuidSchema,
  group_id: uuidSchema.optional(),
  lesson_context: z.string().min(10).max(5000),
  subject: z.string().min(1).max(100),
  grade: z.number().int().min(1).max(12),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().int().min(1).max(10).optional(),
});

export const updateQLearningSchema = z.object({
  exerciseId: uuidSchema,
  studentId: uuidSchema,
  performance: z.object({
    success_rate: z.number().min(0).max(1),
    completed_phonemes: z.array(z.string().min(1).max(10)).min(0).max(50),
  }),
});

// Validation helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { 
        success: false, 
        error: `${firstError.path.join('.')}: ${firstError.message}` 
      };
    }
    return { success: false, error: 'Invalid input' };
  }
}
