/** Bundled native apps cannot serve Lovable's hosted asset proxy locally. */
export function resolveMediaAssetUrl(url: string, native: boolean): string {
  return native && url.startsWith('/__l5e/assets-v1/')
    ? `https://yubilearn.com${url}`
    : url;
}