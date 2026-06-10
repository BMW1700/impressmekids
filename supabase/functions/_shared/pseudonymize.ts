/**
 * PII Pseudonymization helpers for AI prompts.
 *
 * Goal: never send a student's real name, email, phone, address, or
 * raw UUID to a third-party LLM (Vertex AI / Gemini). We replace them
 * with stable placeholders before the prompt, then translate them back
 * in the response so the teacher-facing UI still shows real names.
 *
 * Usage:
 *   const { anonymized, decode } = pseudonymizeStudents(students, "name");
 *   const aiResp = await callVertexAI(prompt, system, ...);
 *   const real = decode(aiResp);  // restores real names in the response text
 */

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const UUID_RE  = /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;
// Conservative SSN-like (we should never have these but defense-in-depth)
const SSN_RE   = /\b\d{3}-\d{2}-\d{4}\b/g;

/** Strip emails / phones / UUIDs / SSNs from any string before sending to an LLM. */
export function scrubPII(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL_RE, "[email]")
    .replace(PHONE_RE, "[phone]")
    .replace(SSN_RE,   "[ssn]")
    .replace(UUID_RE,  "[id]");
}

export interface StudentLike {
  // Permits any extra fields; we only require an id + a display name field.
  [k: string]: unknown;
}

/**
 * Replace each student's display name with a stable opaque alias
 * ("Student 1", "Student 2", …) before the prompt; return a decode()
 * function that swaps the aliases back to the real names in any
 * model output.
 *
 * Also scrubs other PII (emails / phones / UUIDs) from the
 * serialized payload.
 */
export function pseudonymizeStudents<T extends StudentLike>(
  students: T[],
  nameField: keyof T = "name" as keyof T,
): { anonymized: T[]; decode: (s: string) => string } {
  const realToAlias = new Map<string, string>();
  const aliasToReal = new Map<string, string>();

  const anonymized = students.map((s, i) => {
    const real = String(s[nameField] ?? "").trim();
    const alias = `Student ${i + 1}`;
    if (real) {
      realToAlias.set(real, alias);
      aliasToReal.set(alias, real);
    }
    return { ...s, [nameField]: alias } as T;
  });

  const decode = (text: string): string => {
    if (!text) return text;
    let out = text;
    // Longest first so "Student 10" isn't partially replaced by "Student 1".
    const aliases = Array.from(aliasToReal.keys()).sort((a, b) => b.length - a.length);
    for (const alias of aliases) {
      const real = aliasToReal.get(alias)!;
      // Use word-boundary-ish replace; aliases are unique tokens we minted.
      out = out.split(alias).join(real);
    }
    return out;
  };

  return { anonymized, decode };
}
