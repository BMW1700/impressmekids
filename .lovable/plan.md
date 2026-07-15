
# Benny the Dog Videos — Factual IP Risk Brief

Not legal advice. This is a fact-gathering brief compiled from the YubiLearn codebase, edge functions, asset manifests, and prior chat context. Items I can't verify from the project are flagged **UNKNOWN — needs input**.

---

## 1. How the videos are actually made (what the project reveals)

Verified from repo:

- **Voice / audio pipeline**
  - `supabase/functions/prek-word-tts/index.ts` — **ElevenLabs Text-to-Speech**, default voice `IKne3meq5aSn9XLyUdCD` (ElevenLabs stock voice "Charlie"), model tuned per-kind, optionally passed through **ElevenLabs Voice Isolator** (`/v1/audio-isolation`).
  - `supabase/functions/prek-clip-redub/index.ts` — **ElevenLabs Speech-to-Speech** (`eleven_multilingual_sts_v2`) + Voice Isolator. Redub track (Track 90).
  - `supabase/functions/prek-clip-music-extract/index.ts` — **LALAL.AI stem separation** (Pro tier). Music track (Track 89).
  - `src/lib/bennyVoice.ts` — cached ElevenLabs playback client-side.

- **Benny character art**: static PNG/WebP sprites shipped as CDN assets (`src/assets/benny-idle.*`, `benny-sad`, `benny-celebrate`, `benny-walk-sprite`, `benny-standing`, `benny-idle-blink`, `benny-idle-sprite`, `benny-idle-poster`). Nothing in the repo records the tool that produced these images. **UNKNOWN — needs input** (Midjourney? DALL·E? Leonardo? hand-drawn? traced from a reference?).

- **Source video clips**: repo references "Veo3-length exports" and "AI-video-clip artifacts (word cards, awkward Veo3/Sora dialogue)" (`docs/product-research/dub-pipeline-market.md`). Strongly implies **Google Veo 3** is the primary video generator, but no code path names the generator. **UNKNOWN — needs input** (Veo 3 vs. Sora vs. Runway vs. Kling vs. Pika; and whether generation prompt/seed history is retained anywhere outside the tool's own dashboard).

- **Human-work layer that IS in the repo**: scene indexing, Track 89/90 placement, word-card pause logic, trims (`sourceTrimInSeconds`), redub cropping (`fixed` clips), and the bulk-drop splitter (`src/lib/preKBulkAudioSplit.ts`, `BulkAudioDropzone.tsx`) — all timeline orchestration, not pixel/audio-sample authorship.

### Commercial-use terms per tool (as generally published; verify current ToS before relying)

| Tool | User owns output? | Vendor license-back? | Commercial use OK? | IP indemnity? |
|---|---|---|---|---|
| **ElevenLabs** (TTS, STS, Isolator) | User owns generated audio on paid plans; free tier has attribution/commercial restrictions | Non-exclusive license to improve service on some tiers | Yes on paid tiers | Enterprise plans include indemnity; standard paid plans generally do not — **verify our tier** |
| **LALAL.AI** (Pro API) | User keeps rights to their input; output derived from user's uploaded audio | None claimed on output | Yes on paid tier | No standard indemnity |
| **Veo 3 / Google** (if used) | Google grants user rights to outputs; some Gemini/Flow tiers restrict commercial use | Google retains rights to train/improve on some SKUs | **Depends on SKU** — Veo via paid Google AI Studio/Vertex AI is generally commercial-OK; consumer Gemini has stricter terms | No indemnity for consumer; Vertex AI has limited generative-AI indemnity for specified models |
| **Sora / OpenAI** (if used) | User owns outputs per OpenAI ToS | OpenAI does not claim ownership | Yes | OpenAI Copyright Shield covers ChatGPT Enterprise/API, not consumer Sora |
| **Runway / Pika / Kling** (if used) | User generally owns; details vary by plan | Some vendors reserve training rights on free tiers | Paid tiers commercial-OK | Generally no indemnity below enterprise |
| **Midjourney / DALL·E / Leonardo** (if used for Benny art) | Varies — Midjourney free tier does NOT grant commercial rights; paid does | Midjourney reserves broad license on all tiers | Paid only for Midjourney | None below enterprise |

**Open items to close (needed for the tool row above to be accurate for us):**
- Which video generator produced the Benny clips, on which subscription/API tier?
- Which tool produced the Benny character art, on which tier?
- Our current ElevenLabs plan (Creator/Pro/Scale/Business) — determines commercial rights and whether the Zero Retention / IP indemnity add-ons apply.
- Whether we retained prompts, seeds, and drafts anywhere outside the vendor's own dashboard.

### Human-work inventory (how much sits on top of raw AI output)

| Layer | What's in the repo | Human work above raw AI |
|---|---|---|
| Benny character design / model sheet | Static sprite PNGs only | **UNKNOWN — needs input.** No model sheet, style guide, or PSD source found in repo. If the sprites are prompted-and-accepted with no redraw, human authorship is thin. |
| Video footage | Not in repo (streamed / hosted externally) | **UNKNOWN — needs input.** No frame-by-frame edit artifacts (After Effects / Premiere project files) are checked in. |
| Voice / audio | Programmatic ElevenLabs TTS/STS + Isolator, plus LALAL.AI stems | Substantial *pipeline* work (scene anchoring, word-card auto-pause, trim/crop); little sample-level hand editing. Selection + arrangement is human. |
| Final edited cut | Timeline metadata in DB (Tracks 89/90, `fixed` clips, trims, scene-locked one-shots) | Meaningful human selection + arrangement of clips per scene; word-card pause behavior is human-designed. |

---

## 2. Copyright ownership exposure

Applying the current US Copyright Office guidance (March 2023 policy statement + Jan 2025 Part 2 report): **AI-only output is not copyrightable; human "selection, coordination, and arrangement" of AI elements can be; substantially modified AI output can be to the extent of the human contribution.**

| Element | Likely protectable as-is? | Why |
|---|---|---|
| Raw Benny video clip (prompt → accept) | **No** (as delivered by the generator) | No human authorship of pixels |
| The compiled Pre-K lesson as a *compilation/audiovisual work* (scene sequencing, word-card timing, Track 89/90 mix, pedagogical flow) | **Likely yes**, but only to the extent of the human selection/arrangement — the underlying AI clips remain unprotected | Compilation copyright is thin but real |
| Benny character sprites (if prompted-and-accepted) | **No** | Same reason |
| Benny character *as-a-character* (name, personality traits, storylines written by a human) | **Possibly yes** as a literary character — separate from image copyright | Requires distinctive, delineated character; needs human-authored bible |
| ElevenLabs TTS narration | **No copyright in the audio itself** | Machine-generated performance; the underlying script *is* copyrightable if human-written |
| Human-written scripts / word-card copy / lesson plans | **Yes** | Straight human authorship |
| LALAL.AI music stems | Not ours — derivative of whatever the source track was | Do NOT assume ownership; see §3 |

**What would strengthen protection:**
- A human-drawn or heavily-hand-retouched "canonical Benny" model sheet, treated as the reference for all future art (this becomes the anchor human-authored work).
- A written story bible for Benny (personality, catchphrases, backstory) — this can carry character copyright even when individual images cannot.
- Retention of prompts, seed values, iteration history, and edit-layer PSDs/After-Effects projects. The Copyright Office in the *Zarya of the Dawn* decision and subsequent guidance has asked applicants to disclose and evidence the human contribution.

**UNKNOWN — needs input:** Do we retain prompts, seeds, iteration history, edit projects, and dated drafts anywhere? Nothing in the repo is doing that automatically.

---

## 3. Third-party infringement exposure (someone else's IP inside our videos)

- **Substantial-similarity / trade-dress risk from Benny's visual design.** I can't render the sprites from here to eyeball them, but the prompt to be careful with: a friendly cartoon dog in a kids-education context sits in a crowded design space — e.g., **Blue's Clues** (Blue, Nick Jr.), **Bluey** (Ludo/BBC), **Martha Speaks** (WGBH), **Clifford** (Scholastic), **Spot** (Penguin), **Go Dog Go**'s Tag (Netflix), **PAW Patrol** (Spin Master). Substantial-similarity and trade-dress claims are independent of trademark and independent of who "owns" our copyright. Do a side-by-side design audit of Benny vs. those characters before wide launch — particularly ear shape, muzzle, color palette, collar/accessory, and pose vocabulary.
- **AI-generated backgrounds / props.** Any Veo-3/Sora/etc. clip can hallucinate recognizable copyrighted material from training data (logos, character cameos, book covers, plush toys with distinctive designs). This risk is diffuse but real; recommend a human review pass on every shipped clip flagging any recognizable third-party mark or character.
- **LALAL.AI music track.** LALAL.AI separates stems from whatever audio you feed it. If the source video's background music was itself copyrighted (very likely for anything Veo generated that "sounds like" real music), separating it doesn't cleanse it. **The safest posture is to treat Track 89 output as unlicensed until proven otherwise** and either (a) replace with licensed/PD music or (b) confirm the source clip's music was original AI generation with clean rights.
- **ElevenLabs voice.** Charlie (`IKne3meq5aSn9XLyUdCD`) is a stock ElevenLabs voice — usage rights come from our ElevenLabs plan. This is generally lower risk than the video/music pieces, provided our plan allows commercial + kids-content use.

**UNKNOWN — needs input:** whether any current Benny clip contains identifiable third-party marks/characters/music; requires a manual review of every shipped clip.

---

## 4. Trademark status and interaction with copyright

- **YubiLearn word mark**: **UNKNOWN — needs input.** No USPTO application number, class, or status is stored in the repo. `docs/APP_STORE_LAUNCH_CHECKLIST.md` and `docs/PRE_SUBMISSION_RUNBOOK.md` discuss App Store submission but not USPTO. Need serial number + filing date + class(es) + basis (1(a) use-in-commerce vs. 1(b) intent-to-use) + current status.
- **Benny character/design mark**: **UNKNOWN — needs input.** No indication a filing exists or is planned in the repo.
- **Key legal point (correct as stated in the ask):** trademark protection for Benny as a source-identifier is *entirely separate* from copyright in the underlying art. A design mark can be registered even for AI-generated artwork, because TM is about distinctiveness and use-in-commerce as a brand identifier, not about human authorship. Nothing in our trademark strategy should be relying on copyright ownership we may not actually have.
- **What to file matters strategically, not legally-for-validity:** you can file the AI-original design, a human-redrawn version, or a hybrid — all can register as design marks if distinctive. But: filing a **human-redrawn "canonical Benny"** (or a hybrid where a person meaningfully redrew the sprite) is the smart move because (a) it lets you separately assert *copyright* over that same drawing later, (b) it gives you a stable reference for consistent use across products (which strengthens TM secondary-meaning arguments over time), and (c) it neutralizes the "was this even authored?" question in any future dispute.

---

## 5. Children's content-specific considerations

- **COPPA:** The videos themselves aren't data collection, but YubiLearn absolutely does collect from Pre-K users elsewhere in the app (per project memory: student accounts, speech recognition, analytics, Sentry-with-student-mode-off, phoneme heatmaps, etc.). COPPA obligations arise from that data collection, not from the videos. Our existing memory shows: verifiable parental consent flow (`mem://compliance/coppa-consent-and-account-activation-flow`), parent data-deletion portal (`mem://compliance/parent-data-deletion-portal`), pseudonymization in AI prompts (`_shared/pseudonymize.ts`), Sentry replay off for students. Those are the right controls; confirm the COPPA privacy policy explicitly covers use of AI-generated media directed at children.
- **FTC / AI-content disclosure:** Current FTC guidance (2024–2025 "Operation AI Comply", the endorsement guides, and the FTC's stated concern about undisclosed generative-AI content marketed to children) points toward **disclosing AI involvement** where a reasonable parent would care. For an EdTech product aimed at 2-and-up:
  - Recommend an "About our videos" disclosure line in the parent-facing area (not necessarily in-video) stating that some characters, backgrounds, and voices are AI-generated and reviewed by humans for age-appropriateness.
  - Ensure the App Store metadata answers Apple's "does your app include AI-generated content?" prompt truthfully.
  - Avoid marketing claims that a human artist/animator produced the videos when they didn't.

---

## 6. Summary table

| Element | AI tool used | Human work layered on top | Copyright risk | Trademark relevance | Open questions |
|---|---|---|---|---|---|
| Benny sprite art | UNKNOWN image generator | UNKNOWN — likely thin unless redrawn | **High** (probably not copyright-protectable as-is) | High (this is what a design mark would depict) | Which tool? Redrawn? Model sheet exists? |
| Source video clips | Likely Veo 3 (UNKNOWN — needs input) | Prompt selection only; no frame-level editing in repo | **High** (raw AI = no copyright) | Low direct; indirect via character consistency | Which generator/tier? Prompts retained? |
| ElevenLabs TTS narration | ElevenLabs (voice `IKne3meq5aSn9XLyUdCD`, Charlie) | Human-written scripts (script *is* copyrightable) | Medium — script yes, audio no | Low | Our ElevenLabs plan tier + commercial/kids-content rights? |
| ElevenLabs redub (STS) | ElevenLabs `eleven_multilingual_sts_v2` + Isolator | Scene anchoring, trims, word-card pause | Medium — arrangement yes, audio no | Low | Same plan question |
| LALAL.AI music stems (Track 89) | LALAL.AI Pro | Scene placement + auto-pause | **High** (derivative of possibly-copyrighted source music) | None | Was source music original AI or copyrighted? |
| Compiled lesson (scene sequencing, timeline, word cards, mix) | N/A — orchestration code | Substantial human selection/arrangement | **Low–Medium** (thin compilation copyright likely) | Medium (consistent presentation → brand identity) | None immediate |
| Character "Benny" as a literary character (name, personality, arcs) | N/A | Depends on whether a human wrote a story bible | Low if bible exists; High if not | High (the mark protects the name/brand) | Do we have a written character bible? |
| YubiLearn word mark | N/A | Naming, use in commerce | N/A | **Direct** | USPTO serial #, class, status? |
| Benny design mark | N/A | The version we file matters | N/A | **Direct** | AI-original vs. human-redrawn vs. hybrid? |

---

## Plain-English overall exposure

Our biggest exposure is not that someone will sue us for copying *their* Benny — it's that we probably **don't own** most of what we ship. The Pre-K videos as currently produced are, in significant part, raw AI output with substantial orchestration on top but limited human authorship of the actual expressive pixels/samples. That means (a) if a competitor rips a Benny clip, our copyright case against them is weak until we can point to meaningful human authorship, and (b) the Benny design trademark filing is fine to pursue — TM doesn't care about authorship — but we shouldn't market or assume "our art, our copyright" language until a human-authored canonical Benny exists.

**Top items to close before/alongside filing the Benny design trademark:**
1. Commission a **human-drawn canonical Benny model sheet** (or a substantial hand-redraw of the current sprite) — this becomes the trademark specimen *and* the copyright anchor for downstream art. Retain layered source files.
2. Write a **Benny story bible** (name, traits, catchphrases, world) — cheap, immediately gives character-copyright-adjacent protection.
3. Do a **side-by-side visual clearance** of Benny against Blue, Bluey, Martha, Clifford, Spot, Tag (Go Dog Go), and any PAW Patrol pup — document that the design is distinct on ear shape / muzzle / palette / collar.
4. **Retain prompts, seeds, generator, subscription-tier receipts, and iteration drafts** for every Benny image and video clip going forward — put this in a Drive/Notion "Benny provenance" folder. Backfill for existing assets if possible.
5. **Confirm our ElevenLabs plan tier** and its commercial + kids-content + indemnity language; upgrade if needed.
6. Confirm the **video generator and tier** used for source clips; if consumer Gemini/Sora, migrate to an API/Vertex/Enterprise tier that grants clear commercial rights and (where available) generative-AI indemnity.
7. **Audit LALAL.AI Track 89 output per clip** — if any source video's background music was copyrighted, replace with licensed/PD music before shipping publicly.
8. Add an **AI-content disclosure** on the parent-facing About/Privacy area and answer Apple's AI-content question truthfully in App Store metadata.
9. Pull the **YubiLearn USPTO status** into `docs/` (serial #, class, basis, status) so we stop treating it as tribal knowledge.
10. **Do not amend the trademark strategy to depend on copyright ownership** — file the design mark on the version that will actually be used in commerce (recommend: human-redrawn canonical Benny) and treat any copyright claim as a separate, later question tied to whichever assets have documented human authorship.

**None of this is legal advice.** Have IP counsel review before filing anything or making public claims of ownership.
