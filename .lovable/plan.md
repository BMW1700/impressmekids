

## Fix the Patent Attorney Email — 3 Corrections

Write `/mnt/documents/patent_attorney_email_v2.txt` with these fixes applied:

1. **Story count**: Change "279 stories (110 for K-5, 169 for 6-12)" → **"280 stories (110 for K-5, 170 for 6-12)"**

2. **Matching layers**: Rewrite the matching description to accurately reflect the code:
   - Layer 1: Exact match
   - Layer 2: Homophone lookup (local dictionary, ~136 word entries)
   - Layer 3: Edit distance (Levenshtein — allows 1-2 character differences)
   - Mention phoneme matching as a **separate fallback** used in word-by-word reading mode, not as a 4th layer in the main matching function

3. **Homophone count**: Change "about 160 word groups" → **"about 136 word entries"**

Everything else in the email is accurate and stays as-is. Output: single corrected plain text file ready to copy-paste.

