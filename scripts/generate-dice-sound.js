import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const publicDir = path.resolve('public');
const realDiceWav = path.join(publicDir, 'real-dice.wav');

if (fs.existsSync(realDiceWav)) {
  execSync(`ffmpeg -y -i "${realDiceWav}" -af "volume=1.4" -ar 44100 -b:a 192k "${path.join(publicDir, 'dice.mp3')}"`);
  execSync(`ffmpeg -y -i "${realDiceWav}" -af "volume=1.4" -ar 44100 "${path.join(publicDir, 'dice.wav')}"`);

  const mp3Path = path.join(publicDir, 'dice.mp3');
  const targets = [
    path.join(publicDir, 'Dice sound.mp3'),
    path.join(publicDir, 'Dice%20sound.mp3'),
    path.join(publicDir, 'Dice.mp3'),
    path.join(publicDir, 'dice-roll.mp3'),
  ];
  targets.forEach((t) => fs.copyFileSync(mp3Path, t));

  const b64 = fs.readFileSync(mp3Path).toString('base64');
  const tsContent = `export const DICE_SOUND_BASE64 = "data:audio/mp3;base64,${b64}";\n`;
  fs.writeFileSync(path.resolve('src/utils/diceSoundData.ts'), tsContent);

  const defaultSoundsPath = path.resolve('src/utils/defaultSounds.ts');
  let defaultSounds = fs.readFileSync(defaultSoundsPath, 'utf8');
  defaultSounds = defaultSounds.replace(
    /export const DEFAULT_DICE_SOUND_BASE64 =\s*"[^"]*";/,
    `export const DEFAULT_DICE_SOUND_BASE64 = "data:audio/mp3;base64,${b64}";`
  );
  fs.writeFileSync(defaultSoundsPath, defaultSounds);
  console.log('Successfully applied authentic real dice roll audio (< 1s)!');
} else {
  console.error('real-dice.wav not found');
}
