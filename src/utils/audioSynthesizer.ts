/**
 * Premium Ludo Sound Effects Engine
 * 100% Original, Copyright-Free Sounds Synthesized via Web Audio API.
 * High-definition, crisp clatter shaker + smooth rolling tumble + solid wooden board drop.
 */

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('ludo_sound_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch {
      this.isMuted = false;
    }
  }

  private initCtx() {
    if (this.ctx) return;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();

        // Studio compressor for clean, crisp, impactful audio delivery
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-8, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(4, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(3.2, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.08, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.5, this.ctx.currentTime);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn('Web Audio API initialization error:', e);
    }
  }

  public unlock() {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('ludo_sound_muted', String(muted));
    } catch {}

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1.5, this.ctx.currentTime);
    }
  }

  private cachedNoiseBuffer: AudioBuffer | null = null;

  public getMuted(): boolean {
    return this.isMuted;
  }

  private createNoiseBuffer(durationSec: number): AudioBuffer | null {
    if (!this.ctx) return null;
    if (this.cachedNoiseBuffer) return this.cachedNoiseBuffer;
    const bufferSize = Math.floor(this.ctx.sampleRate * Math.max(0.5, durationSec));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.96;
    }
    this.cachedNoiseBuffer = buffer;
    return buffer;
  }

  // =========================================================================
  // 1. FRESH NEW DICE ROLL SOUND (Crisp Clattering Shake + Rolling Tumble + Solid Drop)
  // =========================================================================
  public playDiceRoll() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // --- Section 1: 4 Acoustic Tumble Clicks (0.0s - 0.28s) ---
    const clatterTimes = [0.02, 0.09, 0.18, 0.26];

    clatterTimes.forEach((tOffset, idx) => {
      const hitTime = now + tOffset;

      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      const freq = 620 + idx * 90;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, hitTime);
      osc.frequency.exponentialRampToValueAtTime(170, hitTime + 0.04);

      gain.gain.setValueAtTime(0.001, hitTime);
      gain.gain.linearRampToValueAtTime(0.65, hitTime + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.042);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(hitTime);
      osc.stop(hitTime + 0.046);
    });

    // High-Frequency Shaker Friction Burst
    const noiseBuf = this.createNoiseBuffer(0.4);
    if (noiseBuf) {
      const noise = this.ctx.createBufferSource();
      const nFilter = this.ctx.createBiquadFilter();
      const nGain = this.ctx.createGain();

      noise.buffer = noiseBuf;
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(2600, now);
      nFilter.Q.setValueAtTime(3.5, now);

      nGain.gain.setValueAtTime(0.001, now);
      nGain.gain.linearRampToValueAtTime(0.32, now + 0.03);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 0.3);
    }

    // --- Section 2: Board Landing Drop & Solid Thud at 0.32s ---
    const dropTime = now + 0.32;

    // 1. Deep Sub Bass Impact Kick
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, dropTime);
    subOsc.frequency.exponentialRampToValueAtTime(42, dropTime + 0.12);

    subGain.gain.setValueAtTime(0.001, dropTime);
    subGain.gain.linearRampToValueAtTime(1.1, dropTime + 0.004);
    subGain.gain.exponentialRampToValueAtTime(0.001, dropTime + 0.14);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(dropTime);
    subOsc.stop(dropTime + 0.15);

    // 2. Crisp Solid Wooden Board Slap
    const slapOsc = this.ctx.createOscillator();
    const slapGain = this.ctx.createGain();
    slapOsc.type = 'triangle';
    slapOsc.frequency.setValueAtTime(950, dropTime);
    slapOsc.frequency.exponentialRampToValueAtTime(180, dropTime + 0.045);

    slapGain.gain.setValueAtTime(0.75, dropTime);
    slapGain.gain.exponentialRampToValueAtTime(0.001, dropTime + 0.05);

    slapOsc.connect(slapGain);
    slapGain.connect(this.masterGain);
    slapOsc.start(dropTime);
    slapOsc.stop(dropTime + 0.055);
  }

  // =========================================================================
  // 2. PUNCHY TOKEN RUN SOUND (Bold Crisp Pop + Escalating Pitch)
  // =========================================================================
  public playTokenHop(stepIndex: number | boolean = 0, _isInitialOrTotal?: any) {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const numStep = typeof stepIndex === 'number' ? stepIndex : 0;
    const normalizedStep = Math.max(0, numStep % 8);
    const baseFreq = 650 + normalizedStep * 42;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 1.52, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.68, now + 0.075);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3600, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(1.05, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.13);

    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(baseFreq * 2.8, now);
    snapOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.026);

    snapGain.gain.setValueAtTime(0.62, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

    snapOsc.connect(snapGain);
    snapGain.connect(this.masterGain);

    snapOsc.start(now);
    snapOsc.stop(now + 0.036);
  }

  // =========================================================================
  // 3. TOKEN KILL / CUT SOUND: Heavy Smash Boom + Victorious Sparkle Cascade
  // =========================================================================
  public playCapture() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(240, now);
    boomOsc.frequency.exponentialRampToValueAtTime(30, now + 0.20);

    boomGain.gain.setValueAtTime(0.001, now);
    boomGain.gain.linearRampToValueAtTime(1.2, now + 0.004);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    boomOsc.connect(boomGain);
    boomGain.connect(this.masterGain);
    boomOsc.start(now);
    boomOsc.stop(now + 0.25);

    const slapOsc = this.ctx.createOscillator();
    const slapGain = this.ctx.createGain();
    slapOsc.type = 'triangle';
    slapOsc.frequency.setValueAtTime(980, now);
    slapOsc.frequency.exponentialRampToValueAtTime(80, now + 0.11);

    slapGain.gain.setValueAtTime(0.92, now);
    slapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    slapOsc.connect(slapGain);
    slapGain.connect(this.masterGain);
    slapOsc.start(now);
    slapOsc.stop(now + 0.14);

    const sparkleNotes = [1046.5, 1318.5, 1568.0, 1975.5, 2349.3, 2793.8];
    sparkleNotes.forEach((freq, idx) => {
      const noteTime = now + 0.05 + idx * 0.048;
      const sOsc = this.ctx!.createOscillator();
      const sGain = this.ctx!.createGain();

      sOsc.type = 'sine';
      sOsc.frequency.setValueAtTime(freq, noteTime);

      sGain.gain.setValueAtTime(0.001, noteTime);
      sGain.gain.linearRampToValueAtTime(0.42, noteTime + 0.006);
      sGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.38);

      sOsc.connect(sGain);
      sGain.connect(this.masterGain!);

      sOsc.start(noteTime);
      sOsc.stop(noteTime + 0.4);
    });
  }

  // =========================================================================
  // 4. TOKEN HOME WIN SOUND: Sweet Celebration Crystal Fanfare
  // =========================================================================
  public playHomeEntry() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    const bellNotes = [
      { freq: 523.25, delay: 0.00, dur: 0.65 },
      { freq: 659.25, delay: 0.06, dur: 0.65 },
      { freq: 783.99, delay: 0.12, dur: 0.75 },
      { freq: 1046.5, delay: 0.18, dur: 0.85 },
      { freq: 1318.5, delay: 0.25, dur: 0.95 },
      { freq: 1568.0, delay: 0.33, dur: 1.15 },
      { freq: 2093.0, delay: 0.42, dur: 1.35 },
    ];

    bellNotes.forEach(({ freq, delay, dur }) => {
      const noteTime = now + delay;
      const bellOsc = this.ctx!.createOscillator();
      const bellGain = this.ctx!.createGain();

      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(freq, noteTime);

      bellGain.gain.setValueAtTime(0.001, noteTime);
      bellGain.gain.linearRampToValueAtTime(0.58, noteTime + 0.008);
      bellGain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      bellOsc.connect(bellGain);
      bellGain.connect(this.masterGain!);

      bellOsc.start(noteTime);
      bellOsc.stop(noteTime + dur + 0.05);

      const overtoneOsc = this.ctx!.createOscillator();
      const overtoneGain = this.ctx!.createGain();
      overtoneOsc.type = 'sine';
      overtoneOsc.frequency.setValueAtTime(freq * 2.756, noteTime);

      overtoneGain.gain.setValueAtTime(0.18, noteTime);
      overtoneGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.5);

      overtoneOsc.connect(overtoneGain);
      overtoneGain.connect(this.masterGain!);

      overtoneOsc.start(noteTime);
      overtoneOsc.stop(noteTime + 0.52);
    });
  }

  // =========================================================================
  // 5. DICE 6 SOUND: Upbeat Festive Jackpot Fanfare
  // =========================================================================
  public playDiceSix() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    const jingleNotes = [
      { freq: 880.0, delay: 0.00, dur: 0.2 },
      { freq: 1174.66, delay: 0.07, dur: 0.22 },
      { freq: 1396.91, delay: 0.14, dur: 0.26 },
      { freq: 1760.0, delay: 0.22, dur: 0.4 },
      { freq: 2093.0, delay: 0.30, dur: 0.7 },
    ];

    jingleNotes.forEach(({ freq, delay, dur }) => {
      const noteTime = now + delay;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.68, noteTime + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + dur + 0.05);

      if (freq > 1300) {
        const shimOsc = this.ctx!.createOscillator();
        const shimGain = this.ctx!.createGain();
        shimOsc.type = 'triangle';
        shimOsc.frequency.setValueAtTime(freq * 1.5, noteTime);
        shimGain.gain.setValueAtTime(0.2, noteTime);
        shimGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.32);
        shimOsc.connect(shimGain);
        shimGain.connect(this.masterGain!);
        shimOsc.start(noteTime);
        shimOsc.stop(noteTime + 0.35);
      }
    });
  }

  // =========================================================================
  // 6. SAFE ZONE & CHAT SOUNDS
  // =========================================================================
  public playSafeZone() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now);
    osc.frequency.exponentialRampToValueAtTime(1568.0, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playChatPop() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.05);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // =========================================================================
  // 7. UI & SYSTEM SOUNDS
  // =========================================================================
  public playButtonClick() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.04);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playTurnAlert() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    [
      { f: 659.25, t: 0.0 },
      { f: 987.77, t: 0.12 },
    ].forEach(({ f, t }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(0.5, now + t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + t);
      osc.stop(now + t + 0.38);
    });
  }

  public playWinFanfare() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const fanfareNotes = [
      { f: 523.25, d: 0.00, dur: 0.22 },
      { f: 659.25, d: 0.12, dur: 0.22 },
      { f: 783.99, d: 0.24, dur: 0.3 },
      { f: 1046.5, d: 0.38, dur: 0.95 },
    ];

    fanfareNotes.forEach(({ f, d, dur }) => {
      const noteTime = now + d;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.6, noteTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + dur + 0.05);
    });
  }

  public playError() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  // =========================================================================
  // 8. GLACIER CRACKING ICE SOUND ("Trrrr... cracking ice" + Sub-Zero Shimmer)
  // =========================================================================
  public playGlacierCrack() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // 1. Rapid "Trrrr..." ice fracture snaps (crystalline high-passed crackles)
    const crackOffsets = [0.0, 0.04, 0.08, 0.13, 0.19, 0.26, 0.34, 0.43, 0.54];
    crackOffsets.forEach((offset, idx) => {
      const t = now + offset;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      const startFreq = 1800 + (idx % 3) * 650;
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(240 + idx * 30, t + 0.038);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.55, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.042);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.045);
    });

    // 2. High-frequency frosted ice crunch noise burst
    const noiseBuf = this.createNoiseBuffer(0.7);
    if (noiseBuf) {
      const noise = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const nGain = this.ctx.createGain();

      noise.buffer = noiseBuf;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3400, now);
      filter.Q.setValueAtTime(2.5, now);

      nGain.gain.setValueAtTime(0.001, now);
      nGain.gain.linearRampToValueAtTime(0.42, now + 0.05);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.68);
    }

    // 3. Crystalline Diamond Ice Chime Resonance
    const crystalNotes = [1567.98, 2093.0, 2637.02, 3135.96];
    crystalNotes.forEach((freq, i) => {
      const t = now + 0.12 + i * 0.09;
      const cOsc = this.ctx!.createOscillator();
      const cGain = this.ctx!.createGain();

      cOsc.type = 'sine';
      cOsc.frequency.setValueAtTime(freq, t);

      cGain.gain.setValueAtTime(0.001, t);
      cGain.gain.linearRampToValueAtTime(0.45, t + 0.01);
      cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

      cOsc.connect(cGain);
      cGain.connect(this.masterGain!);
      cOsc.start(t);
      cOsc.stop(t + 0.78);
    });
  }

  // =========================================================================
  // 9. COINS TO DIAMOND EXCHANGE SOUND (Falling Coins -> Sparkling Diamond)
  // =========================================================================
  public playDiamondExchange() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // 1. Falling gold coins clinking cascade
    const coinTimes = [0.0, 0.06, 0.12, 0.18, 0.24, 0.30];
    coinTimes.forEach((delay, idx) => {
      const t = now + delay;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + idx * 140, t);
      osc.frequency.exponentialRampToValueAtTime(2400 + idx * 180, t + 0.05);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.45, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.075);
    });

    // 2. Magical Diamond Birth Chime at 0.36s
    const diamondChord = [1046.5, 1318.5, 1568.0, 2093.0, 2637.02];
    diamondChord.forEach((freq, i) => {
      const t = now + 0.36 + i * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.55, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.88);
    });
  }
}

export const soundEffects = new SoundEffectsEngine();
