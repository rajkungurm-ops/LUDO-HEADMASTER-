import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Physical Modeling of Authentic Ludo Pawn / Token Step Sound Effect
// Characteristics:
// - Duration: ~80ms (crisp, agile, non-fatiguing for rapid multiple hops)
// - Tactile Strike Transient: sharp wooden contact (3400 Hz down to 1600 Hz in 8ms)
// - Board Body Thump: warm resonant wood cavity (480 Hz with secondary 960 Hz resonance)
// - Contact Friction: microscopic bandpass noise tap (1400 Hz)
const sampleRate = 44100;
const duration = 0.088; // 88ms total
const totalSamples = Math.floor(sampleRate * duration);
const buffer = new Float32Array(totalSamples);

// Helper: Add resonant bandpass noise burst (wood contact slap)
function addNoiseBurst(startTime, dur, peakVol, centerFreq, q = 3.0) {
  const startSample = Math.floor(startTime * sampleRate);
  const numSamples = Math.floor(dur * sampleRate);

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
    const idx = startSample + i;
    if (idx >= totalSamples) break;

    const progress = i / numSamples;
    const env = Math.exp(-progress * 18) * (1 - Math.exp(-progress * 60));
    const noise = Math.random() * 2 - 1;

    const x0 = noise;
    const y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;

    buffer[idx] += y0 * env * peakVol;
  }
}

// Helper: Add pitch-dropping resonant sine/triangle click (hard pawn base impact)
function addTonalClick(startTime, dur, startFreq, endFreq, peakVol, wave = 'sine') {
  const startSample = Math.floor(startTime * sampleRate);
  const numSamples = Math.floor(dur * sampleRate);
  let phase = 0;

  for (let i = 0; i < numSamples; i++) {
    const idx = startSample + i;
    if (idx >= totalSamples) break;

    const progress = i / numSamples;
    // Exponential pitch decay
    const currentFreq = endFreq + (startFreq - endFreq) * Math.exp(-progress * 14);
    phase += (2 * Math.PI * currentFreq) / sampleRate;

    let sampleVal = 0;
    if (wave === 'triangle') {
      const normPhase = (phase % (2 * Math.PI)) / (2 * Math.PI);
      sampleVal = 4 * Math.abs(normPhase - 0.5) - 1;
    } else {
      sampleVal = Math.sin(phase);
    }

    // Snappy envelope: steep attack (0.8ms), natural acoustic wood decay
    const attackSamples = Math.floor(0.0008 * sampleRate);
    let env = 0;
    if (i < attackSamples) {
      env = i / attackSamples;
    } else {
      env = Math.exp(-progress * 11);
    }

    buffer[idx] += sampleVal * env * peakVol;
  }
}

// 1. Initial sharp micro-click (contact point, hard enamel/wood pawn bottom)
addTonalClick(0.000, 0.018, 3800, 1600, 0.75, 'triangle');

// 2. Main hollow wooden board impact "tuk/tok" body
addTonalClick(0.001, 0.065, 580, 420, 0.95, 'sine');
addTonalClick(0.001, 0.045, 960, 780, 0.45, 'sine'); // Harmonic overtone

// 3. Surface texture friction & subtle board hollow air burst
addNoiseBurst(0.0005, 0.022, 0.35, 2400, 2.8);
addNoiseBurst(0.0015, 0.040, 0.28, 920, 1.8);

// 4. Low warmth wooden frame resonance (deep satisfying thud)
addTonalClick(0.002, 0.055, 290, 220, 0.40, 'sine');

// Peak Normalize to -0.3 dB for loud, clear in-game audio
let maxVal = 0;
for (let i = 0; i < totalSamples; i++) {
  const abs = Math.abs(buffer[i]);
  if (abs > maxVal) maxVal = abs;
}
if (maxVal > 0) {
  const gain = 0.96 / maxVal;
  for (let i = 0; i < totalSamples; i++) {
    buffer[i] *= gain;
  }
}

// Encode to 16-bit PCM WAV
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
const wavPath = path.join(publicDir, 'Token.wav');
const mp3Path = path.join(publicDir, 'Token.mp3');

fs.writeFileSync(wavPath, wavBuffer);
console.log(`Saved pristine token step WAV: ${wavPath}`);

// Convert to high bitrate MP3 using ffmpeg
try {
  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -b:a 256k "${mp3Path}"`, { stdio: 'inherit' });
  console.log(`Converted to high quality MP3: ${mp3Path}`);
  // Copy to all token aliases including "Token sound.mp3"
  const mp3Aliases = [
    'Token sound.mp3',
    'Token%20sound.mp3',
    'Token.mp3',
    'token.mp3',
    'token-step.mp3',
  ];
  const wavAliases = [
    'Token sound.wav',
    'Token.wav',
    'token.wav',
    'token-step.wav',
  ];

  for (const name of mp3Aliases) {
    fs.copyFileSync(mp3Path, path.join(publicDir, name));
    if (fs.existsSync(distDir)) {
      fs.copyFileSync(mp3Path, path.join(distDir, name));
    }
  }

  for (const name of wavAliases) {
    fs.copyFileSync(wavPath, path.join(publicDir, name));
    if (fs.existsSync(distDir)) {
      fs.copyFileSync(wavPath, path.join(distDir, name));
    }
  }
} catch (e) {
  console.error('ffmpeg error:', e);
}

// Update src/utils/tokenSoundData.ts with the new base64 audio
const mp3Buf = fs.readFileSync(mp3Path);
const base64 = `data:audio/mp3;base64,${mp3Buf.toString('base64')}`;
const soundDataFile = path.resolve(__dirname, '../src/utils/tokenSoundData.ts');
fs.writeFileSync(soundDataFile, `export const TOKEN_SOUND_BASE64 = "${base64}";\n`);
console.log(`Updated ${soundDataFile} with authentic Ludo token step sound!`);
