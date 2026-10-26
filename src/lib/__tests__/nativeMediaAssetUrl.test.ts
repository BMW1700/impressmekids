import { describe, expect, test } from 'bun:test';
import { resolveMediaAssetUrl } from '../native/mediaAssetUrl';

describe('bundled phone media', () => {
  test('Benny video streams from the public website on native', () => {
    const path = '/__l5e/assets-v1/79bd2477-5999-456a-b286-5435805f6bbd/yubi-hero.mp4';
    expect(resolveMediaAssetUrl(path, true)).toBe(`https://yubilearn.com${path}`);
  });
  test('website asset paths stay same-origin', () => {
    expect(resolveMediaAssetUrl('/__l5e/assets-v1/example/poster.jpg', false))
      .toBe('/__l5e/assets-v1/example/poster.jpg');
  });
  test('signed private media URLs retain their signature and host', () => {
    const signed = 'https://media.example/storage/v1/object/sign/private/clip.mp4?token=example';
    expect(resolveMediaAssetUrl(signed, true)).toBe(signed);
  });
  test('bundled files and untrusted lookalike paths are not rewritten', () => {
    for (const url of ['/assets/logo.png', '//example.com/video.mp4', '/__l5e/assets-v1-other/clip.mp4']) {
      expect(resolveMediaAssetUrl(url, true)).toBe(url);
    }
  });
});