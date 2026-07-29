import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const infoPlistPath = path.resolve(__dirname, '..', 'ios', 'App', 'App', 'Info.plist');

const requiredEntries = {
  NSMicrophoneUsageDescription:
    'YubiLearn uses the microphone to listen to your child read aloud and provide feedback.',
  NSSpeechRecognitionUsageDescription:
    'YubiLearn uses speech recognition to check pronunciation and guide reading practice.',
  NSCameraUsageDescription:
    'YubiLearn uses the camera to capture worksheet photos for teacher assignments.',
  LSApplicationCategoryType: 'public.app-category.education',
  ITSAppUsesNonExemptEncryption: false,
};

function patchPlist() {
  if (!fs.existsSync(infoPlistPath)) {
    console.warn('[patch-ios-plist] Info.plist not found, skipping.');
    process.exit(0);
  }

  let content = fs.readFileSync(infoPlistPath, 'utf8');
  const insertBefore = '</dict>';

  for (const [key, value] of Object.entries(requiredEntries)) {
    const keyRegex = new RegExp(`<key>${key}</key>`);
    if (keyRegex.test(content)) {
      console.log(`[patch-ios-plist] ${key} already present.`);
      continue;
    }

    let valueXml;
    if (typeof value === 'boolean') {
      valueXml = value ? '<true/>' : '<false/>';
    } else {
      valueXml = `<string>${escapeXml(value)}</string>`;
    }

    const entry = `\t<key>${key}</key>\n\t${valueXml}\n`;
    content = content.replace(insertBefore, entry + insertBefore);
    console.log(`[patch-ios-plist] Added ${key}.`);
  }

  fs.writeFileSync(infoPlistPath, content, 'utf8');
  console.log('[patch-ios-plist] Info.plist patched successfully.');
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

patchPlist();
