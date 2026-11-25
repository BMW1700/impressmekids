# Security audit vs. the Reddit post, and cutting the Google AI connection

## The honest audit: are we exposed like that person was?

I checked the same three things that post describes.

1. **Private keys in the files visitors download: No.** The only values the website ships to browsers are the public sign-in address, the publishable key (designed to be public), the Clever ID (public) and the error-tracking address (public). I searched the code for OpenAI, Stripe, Resend, ElevenLabs and Google key patterns. None of them are there. Every private key is stored only on the server.
2. **Bots finding a `/.env` file: No.** Only the built website is put online, and it holds no secret keys.
3. **No spending cap on AI keys: partly yes.** These are the outside paid services we can't cap from here:
   - Google AI (Gemini): used by teacher flashcards, tournament question generator, practice exercises, teacher weekly summaries, photo-to-text in assignments, and the written AI feedback on AURA reading grades.
   - ElevenLabs (Benny redub voice + Pre-K word audio) and LALAL (music split): super-admin only.
   - Resend (email), cold-storage backups, R2 video storage: not AI, but still paid.
   - Two unused keys are saved: an old OpenAI key and Google sign-in client details that aren't used by the app's code.

Only signed-in users can reach the server code that uses these keys, so a random bot can't run up a bill. Your risk is lower than that person's. It still makes sense to cut what you don't use.

## What I will do (once you approve)

1. **Turn off every Google AI feature.**
   - Teacher "Generate flashcards", "Generate questions" (tournaments), "Generate practice exercises", the teacher weekly summary and "extract text from photo" buttons will be hidden or show "not available".
   - AURA reading grades keep their scores (worked out on the device, no AI). Only the extra AI-written comment is dropped.
   - Delete those server functions and the shared Google AI helper.
2. **Delete unused keys:** the Google AI key, the old OpenAI key and the Google Cloud project ID.
3. **Keep** ElevenLabs and LALAL (the Benny redub tool needs them), email, and the built-in background-art helper (admin only, billed to your Lovable credits, which already caps it).
4. Re-run the security scan and confirm nothing is still pointing at the deleted functions.

## What only you can do (5 minutes)

- **Google Cloud console:** delete or disable the service account key behind the Google AI key and turn off billing for the Vertex AI project. Deleting it from our app doesn't cancel it at Google.
- **OpenAI dashboard:** revoke the old key, even though it's unused.
- **ElevenLabs and LALAL:** set a monthly usage limit in each dashboard.
- **Resend:** keep it. It has no per-use bill surprise beyond your plan.

## Technical details
- Remove functions: generate-flashcards, generate-question-ai, generate-practice-exercises, generate-teacher-summary, extract-text-from-image; strip the Vertex block from analyze-aura and process-ai-jobs paths (keep heuristic scoring); delete `_shared/vertexAuth.ts`; delete edge deployments.
- UI: GenerateFlashcardsModal, GenerateQuestionsModal, GeneratedExercises, useTeacherSummary, CreateAssignmentModal / ReadingComprehensionForm photo import.
- Delete secrets GOOGLE_VERTEX_AI_KEY, OPENAI_WHISPER_KEY, GOOGLE_CLOUD_PROJECT_ID. Update policy pages that mention Vertex.
