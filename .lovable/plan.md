
# YubiLearn Trademark Filing Recommendations PDF

Generate a branded, professional PDF artifact (saved to `/mnt/documents/`) containing the final USPTO trademark filing recommendations for YubiLearn — **Class 9 and Class 41 only**, both filed as **1(b) Intent-to-Use**. Class 42 explicitly deferred.

## Deliverable

A single one-to-two page PDF: `YubiLearn-Trademark-Filing-Recommendations.pdf`

## Contents

**Header**
- YubiLearn brand block (matches the indigo/gold palette used in existing PDFs — `phonicsCertificatePdf.ts`, `scopeSequencePdf.ts`)
- Title: "USPTO Trademark Filing Recommendations"
- Subtitle: "Word Mark: YUBILEARN · Filing Basis: 1(b) Intent-to-Use · Classes 9 and 41"
- Date generated

**Filing Summary Table**
| Class | # of Term IDs | Filing Basis | USPTO Fee |
|---|---|---|---|
| 9 | 2 | 1(b) ITU | $350 |
| 41 | 2 | 1(b) ITU | $350 |
| **Total** | **4 entries** | | **$700** |

Note: All pre-approved USPTO ID Manual entries — **no $100/class free-form surcharge**.

**Class 9 — Downloadable Software** ($350, 1(b) ITU)
- **009-5120**: *Downloadable computer programs for use in teaching children to read*
  - Covers: iPad student app (LexiQuest, Castle Swarm, Pre-K reading levels, phonics foundations)
- **009-5474**: *Downloadable educational software featuring instruction in phonics, reading fluency, and early literacy*
  - Covers: React Native parent companion app
- Why 1(b): apps are not yet live in App Store / Play Store

**Class 41 — Education & Entertainment Services** ($350, 1(b) ITU)
- **041-1439**: *Providing on-line non-downloadable educational software for use in teaching phonics, reading fluency, and early literacy to children in kindergarten through grade 12*
  - Covers: browser-based YubiLearn student platform (yubilearn.com), phonics scope & sequence, adaptive reading assessment
- **041-1209**: *Entertainment services, namely, providing temporary use of non-downloadable computer learning games*
  - Covers: LexiQuest RPG, Castle Swarm Defense, Word Ninja, Tug-of-War, Pre-K adventures
- Why 1(b) (not 1(a)): filing everything under one basis simplifies prosecution and locks in filing date; converts to Statement of Use once a specimen (screenshot of the live platform) is submitted

**Class 42 — Deferred**
Short paragraph explaining why it is being held back (teacher/admin/gradebook surfaces hidden from live view; refile when SaaS-for-educators platform launches publicly). Prevents fraudulent-specimen risk (Medinol v. Neuro Vasx).

**Terms explicitly rejected and why** (compact table)
- 009-5419 (Downloadable children's software) — too broad, invites §2(e)(1) descriptiveness refusal
- 041-1136 / 041-1131 / 041-1134 — generic overclaiming
- 042-2681 / 042-3539 — cannot produce specimen with teacher/admin surfaces hidden

**Next steps checklist**
1. File TEAS Plus application (requires all pre-approved IDs — we've complied)
2. Select 1(b) Intent-to-Use for both classes
3. Pay $700 in USPTO fees
4. On Notice of Allowance, submit Statement of Use with:
   - Class 9 specimen: App Store listing screenshot showing YUBILEARN mark
   - Class 41 specimen: yubilearn.com screenshot showing mark used in connection with the online reading platform
5. Revisit Class 42 filing once teacher analytics/gradebook platform is publicly launched

**Footer**
- "This document is a filing recommendation, not legal advice. Confirm with a trademark attorney before submitting."
- yubilearn.com

## Technical Implementation

- Use `jsPDF` (already a project dependency — see `src/lib/phonicsCertificatePdf.ts`)
- Write a small standalone Node script at `/tmp/generate-tm-pdf.mjs` that imports jsPDF and writes to `/mnt/documents/YubiLearn-Trademark-Filing-Recommendations.pdf`
- Match brand palette from existing PDFs: primary indigo `[99,102,241]`, gold `[202,138,4]`, dark `[17,24,39]`, muted `[107,114,128]`
- Letter size, portrait
- QA pass: convert PDF pages to images with `pdftoppm`, view each, fix any layout issues before delivering
- Emit `<presentation-artifact>` tag so the user can download

**No changes to the app codebase.** This is a one-off artifact.
