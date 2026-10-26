import { describe, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { resolveMediaAssetUrl } from '../native/mediaAssetUrl';

describe('bundled phone media', () => {
  test('Benny video streams from the public website on native', () => {
    const path = '/__l5e/assets-v1/79bd2477-5999-456a-b286-5435805f6bbd/yubi-hero.mp4';
    assert.equal(resolveMediaAssetUrl(path, true), `https://yubilearn.com${path}`);
  });
  test('website asset paths stay same-origin', () => {
    assert.equal(resolveMediaAssetUrl('/__l5e/assets-v1/example/poster.jpg', false),
      '/__l5e/assets-v1/example/poster.jpg');
  });
  test('signed private media URLs retain their signature and host', () => {
    const signed = 'https://media.example/storage/v1/object/sign/private/clip.mp4?token=example';
    assert.equal(resolveMediaAssetUrl(signed, true), signed);
  });
  test('bundled files and untrusted lookalike paths are not rewritten', () => {
    for (const url of ['/assets/logo.png', '//example.com/video.mp4', '/__l5e/assets-v1-other/clip.mp4']) {
      assert.equal(resolveMediaAssetUrl(url, true), url);
    }
  });
});