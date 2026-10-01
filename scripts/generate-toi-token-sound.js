import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playful Bouncy "Toi! Toi! Toi!" Ludo Token Hop Sound
 * Acoustic Modeling:
 * - "T" snappy tactile consonant at the start (1800Hz micro-tap)
 * - "OI" vocaloid / bouncy rubber-spring formant glide:
 *    F1: 440Hz -> 680Hz (O to I glide)
 *    F2: 880Hz -> 1380Hz (second vowel formant producing authentic "toi" timbre)
 * - Playful spring bounce / juicy bubble pop curve
 * - Duration: 72ms - perfect separation for rhythmic multi-step run ("toi toi toi")
 */

const sampleRate = 44100;
const duration = 0.076; // 76ms
const totalSamples = Math.floor(sampleRate * duration);
const buffer = new Float32Array(totalSamples);

// 1. Initial "T" consonant snap (tactile tap)
{
  const dur = 0.008; // 8ms
  const numSamples = Math.floor(dur * sampleRate);
  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const progress = i / numSamples;
    const freq = 1200 + (2600 - 1200) * Math.exp(-progress * 24);
    phase += (2 * Math.PI * freq) / sampleRate;
    const env = Math.exp(-progress * 16);
    const norm = (phase % (2 * Math.PI)) / (2 * Math.PI);
    const tri = 4 * Math.abs(norm - 0.5) - 1;
    buffer[i] += tri * env * 0.32;
  }
}

// 2. The Iconic "OI" Bouncy Formant Glide (F1 & F2)
{
  const dur = 0.068; // 68ms
  const numSamples = Math.floor(dur * sampleRate);
  let phase1 = 0;
  let phase2 = 0;
  let phase3 = 0;

  for (let i = 0; i < numSamples; i++) {
    const progress = i / numSamples;

    // Upward pitch swoop that creates the classic cartoon "toi!" / "boing-pop"
    // F1 starts at 430Hz and scoops up to 660Hz
    const pitchCurve = Math.sin(progress * Math.PI * 0.85); // smooth rise then slight fall
    const f1 = 440 + 220 * pitchCurve;
    // F2 (second formant creating the "oy/oi" sound)
    const f2 = 880 + 480 * pitchCurve;
    // F3 subtle glassy chime
    const f3 = f1 * 3.0;

    phase1 += (2 * Math.PI * f1) / sampleRate;
    phase2 += (2 * Math.PI * f2) / sampleRate;
    phase3 += (2 * Math.PI * f3) / sampleRate;

    // Fast pleasant attack (1.5ms), bouncy organic decay
    const attack = Math.min(1, i / (0.0018 * sampleRate));
    const env1 = attack * Math.exp(-progress * 10);
    const env2 = attack * Math.exp(-progress * 15);
    const env3 = attack * Math.exp(-progress * 26);

    const s1 = Math.sin(phase1) * env1 * 0.75;
    const s2 = Math.sin(phase2) * env2 * 0.40;
    const s3 = Math.sin(phase3) * env3 * 0.15;

    buffer[i] += (s1 + s2 + s3);
  }
}

// 3. Cheerful Bouncy Bubble Air Pressure Burst (1200Hz warm resonance)
{
  const dur = 0.022;
  const numSamples = Math.floor(dur * sampleRate);
  const centerFreq = 1200;
  const q = 4.0;
  const w0 = (2 * Math.PI * centerFreq) / sampleRate;
  const alpha = Math.sin(w0) / (2 * q);
  const b0 = alpha;
  const b1 = 0;
  const b2 = -alpha;
  const a0 = 1 + alpha;
  const a1 = -2 * Math.cos(w0);
  const a2 = 1 - alpha;

  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < numSamples; i++) {
    const progress = i / numSamples;
    const env = Math.exp(-progress * 18);
    const noise = Math.random() * 2 - 1;
    const y0 = (b0 * noise + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = noise;
    y2 = y1;
    y1 = y0;
    buffer[i] += y0 * env * 0.18;
  }
}

// 4. Soft Saturation for warm, cartoon-style polish
for (let i = 0; i < totalSamples; i++) {
  buffer[i] = Math.tanh(buffer[i] * 1.3);
}

// 5. Volume Normalization (Crisp, clean, friendly level)
let peak = 0;
for (let i = 0; i < totalSamples; i++) {
  const abs = Math.abs(buffer[i]);
  if (abs > peak) peak = abs;
}
if (peak > 0) {
  const mult = 0.85 / peak;
  for (let i = 0; i < totalSamples; i++) {
    buffer[i] *= mult;
  }
}

// Write 16-bit PCM WAV
const numChannels = 1;
const bytesPerSample = 2;
const blockAlign = numChannels * bytesPerSample;
const byteRate = sampleRate * blockAlign;
const dataSize = totalSamples * bytesPerSample;
const headerSize = 44;
const wavBuffer = Buffer.alloc(headerSize + dataSize);

wavBuffer.write('RIFF', 0);
wavBuffer.writeUInt32LE(headerSize + dataSize - 8, 4);
wavBuffer.write('WAVE', 8);
wavBuffer.write('fmt ', 12);
wavBuffer.writeUInt32LE(16, 16);
wavBuffer.writeUInt16LE(1, 20); // PCM
wavBuffer.writeUInt16LE(numChannels, 22);
wavBuffer.writeUInt32LE(sampleRate, 24);
wavBuffer.writeUInt32LE(byteRate, 28);
wavBuffer.writeUInt16LE(blockAlign, 32);
wavBuffer.writeUInt16LE(bytesPerSample * 8, 34);
wavBuffer.write('data', 36);
wavBuffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < totalSamples; i++) {
  const s = Math.max(-1, Math.min(1, buffer[i]));
  const intVal = s < 0 ? Math.floor(s * 32768) : Math.floor(s * 32767);
  wavBuffer.writeInt16LE(intVal, headerSize + i * 2);
}

const publicDir = path.resolve(__dirname, '../public');
const distDir = path.resolve(__dirname, '../dist');
const wavPath = path.join(publicDir, 'Token sound.wav');
const mp3Path = path.join(publicDir, 'Token sound.mp3');

fs.writeFileSync(wavPath, wavBuffer);
fs.writeFileSync(path.join(publicDir, 'Token.wav'), wavBuffer);

// Convert to MP3
execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -b:a 256k "${mp3Path}"`, { stdio: 'inherit' });
console.log(`Generated "toi toi toi" token step MP3: ${mp3Path}`);

const mp3Targets = [
  'Token sound.mp3',
  'Token%20sound.mp3',
  'Token.mp3',
  'token.mp3',
  'token-step.mp3',
];

const wavTargets = [
  'Token sound.wav',
  'Token.wav',
  'token.wav',
  'token-step.wav',
];

for (const name of mp3Targets) {
  fs.copyFileSync(mp3Path, path.join(publicDir, name));
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(mp3Path, path.join(distDir, name));
  }
}

for (const name of wavTargets) {
  fs.copyFileSync(wavPath, path.join(publicDir, name));
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(wavPath, path.join(distDir, name));
  }
}

// Update tokenSoundData.ts
const mp3Buf = fs.readFileSync(mp3Path);
const base64 = `data:audio/mp3;base64,${mp3Buf.toString('base64')}`;
const soundDataFile = path.resolve(__dirname, '../src/utils/tokenSoundData.ts');
fs.writeFileSync(soundDataFile, `export const TOKEN_SOUND_BASE64 = "${base64}";\n`);
console.log(`Updated ${soundDataFile} with "toi toi toi" sound!`);
