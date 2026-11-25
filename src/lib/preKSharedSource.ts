// Rules for clips that share one long source video.
// Several clip slots can point at the same video file and show different
// parts of it via trim in/out. Generated audio must follow each clip's own
// window, and the windows must not overlap.

export interface SceneWindow {
  sceneKey: string;
  fileId: string; // same value = same underlying video file
  trimIn: number;
  trimOut: number | null;
  raw: number | null;
}

export interface SharedSourceIssue {
  code: "shared-source-overlap" | "shared-source-open-end";
  message: string;
}

/** Overlapping windows inside the same file, and open-ended windows in a shared file. */
export function findSharedSourceIssues(scenes: SceneWindow[]): SharedSourceIssue[] {
  const issues: SharedSourceIssue[] = [];
  const groups = new Map<string, SceneWindow[]>();
  scenes.forEach((s) => groups.set(s.fileId, [...(groups.get(s.fileId) ?? []), s]));
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.forEach((s) => {
      if (s.trimOut == null) {
        issues.push({ code: "shared-source-open-end", message: `${s.sceneKey} shares its video with other clips but has no end point, so it runs to the end of the video.` });
      }
    });
    const end = (s: SceneWindow) => s.trimOut ?? s.raw ?? Number.POSITIVE_INFINITY;
    const sorted = [...group].sort((a, b) => a.trimIn - b.trimIn);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        const overlap = Math.min(end(a), end(b)) - Math.max(a.trimIn, b.trimIn);
        if (overlap > 0.1) {
          issues.push({ code: "shared-source-overlap", message: `${a.sceneKey} and ${b.sceneKey} overlap by ${overlap.toFixed(1)}s in the same video, so their audio will repeat.` });
        }
      }
    }
  }
  return issues;
}

/** A generated clip that was cut to its own window (so its trim-in is 0, not the video's trim-in). */
export function isPreCutAudioClip(clipDurationSeconds: number | null | undefined, sceneRawSeconds: number | null | undefined): boolean {
  if (clipDurationSeconds == null || !(clipDurationSeconds > 0)) return false;
  if (sceneRawSeconds == null || !(sceneRawSeconds > 0)) return false;
  return clipDurationSeconds < sceneRawSeconds - 0.05;
}
