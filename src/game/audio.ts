type SoundName = "drop" | "merge" | "combo" | "coin" | "purchase" | "unlock" | "chest" | "star" | "complete" | "gameover" | "button";

export function haptic(type: "light" | "medium" | "heavy" | "success" | "warning" = "light") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    if (type === "light") navigator.vibrate(22);
    else if (type === "medium") navigator.vibrate(40);
    else if (type === "heavy") navigator.vibrate([45, 30, 45]);
    else if (type === "success") navigator.vibrate([30, 30, 50]);
    else if (type === "warning") navigator.vibrate([60, 40, 60]);
  } catch {
    // Vibration not supported or allowed
  }
}

class OrchardAudio {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private musicMasterGain: GainNode | null = null;
  sound = true;
  music = true;
  vibration = true;

  configure(sound: boolean, music: boolean, vibration = true) {
    this.sound = sound;
    this.music = music;
    this.vibration = vibration;
    if (!music) {
      this.stopMusic();
    } else {
      if (this.ctx && this.musicTimer === null) {
        this.startMusic();
      }
    }
  }

  unlock() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx && AudioCtx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        void this.ctx.resume().then(() => {
          if (this.music && this.musicTimer === null) {
            this.startMusic();
          }
        });
      } else if (this.ctx && this.music && this.musicTimer === null) {
        this.startMusic();
      }
    } catch {
      // AudioContext unavailable
    }
  }

  play(name: SoundName, level = 0) {
    if (!this.sound) return;
    this.unlock();
    if (!this.ctx) return;

    if (name === "drop") {
      // Crisp bubbly tactile fruit drop sound
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(340, now);
      osc1.frequency.exponentialRampToValueAtTime(140, now + 0.09);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(480, now);
      osc2.frequency.exponentialRampToValueAtTime(210, now + 0.06);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.38, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.12);
      osc2.stop(now + 0.12);

      if (this.vibration) haptic("light");
      return;
    }

    const recipes: Record<SoundName, [number, number, OscillatorType, number, number]> = {
      drop: [320, 140, "sine", 0.1, 0.35],
      merge: [440 + level * 55, 780 + level * 65, "triangle", 0.2, 0.42],
      combo: [650, 1180, "triangle", 0.28, 0.45],
      coin: [980, 1480, "sine", 0.18, 0.38],
      purchase: [520, 920, "triangle", 0.24, 0.4],
      unlock: [580, 1200, "sine", 0.3, 0.4],
      chest: [220, 940, "sawtooth", 0.4, 0.42],
      star: [820, 1560, "sine", 0.28, 0.4],
      complete: [520, 1040, "triangle", 0.55, 0.45],
      gameover: [320, 110, "sine", 0.55, 0.38],
      button: [480, 640, "sine", 0.08, 0.32],
    };

    const [from, to, type, duration, volume] = recipes[name];
    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, to), now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain).connect(this.ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);

    if (this.vibration) {
      if (name === "merge") haptic("medium");
      else if (name === "combo" || name === "star") haptic("success");
      else if (name === "chest" || name === "complete") haptic("heavy");
      else if (name === "button") haptic("light");
    }
  }

  startMusic() {
    if (!this.music || this.musicTimer !== null || !this.ctx) return;
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    if (!this.musicMasterGain) {
      this.musicMasterGain = this.ctx.createGain();
      this.musicMasterGain.gain.value = 0.22;
      this.musicMasterGain.connect(this.ctx.destination);
    }

    // Cheerful, uplifting pentatonic melody + chords
    // C - G - Am - F progression
    const chords = [
      [261.63, 329.63, 392.00], // C major (C4, E4, G4)
      [196.00, 246.94, 293.66], // G major (G3, B3, D4)
      [220.00, 261.63, 329.63], // A minor (A3, C4, E4)
      [174.61, 220.00, 261.63], // F major (F3, A3, C4)
    ];

    const melodyNotes = [
      523.25, 659.25, 783.99, 659.25, // C5, E5, G5, E5
      587.33, 783.99, 880.00, 783.99, // D5, G5, A5, G5
      659.25, 880.00, 1046.50, 880.00, // E5, A5, C6, A5
      698.46, 880.00, 783.99, 659.25,  // F5, A5, G5, E5
    ];

    const bassNotes = [130.81, 98.00, 110.00, 87.31]; // C3, G2, A2, F2

    let step = 0;

    const tick = () => {
      if (!this.ctx || !this.music || !this.musicMasterGain) return;
      const now = this.ctx.currentTime;
      const beat = step % 16;
      const chordIndex = Math.floor(beat / 4);

      // Play soft warm chord pad on the downbeat of each bar
      if (beat % 4 === 0) {
        const chord = chords[chordIndex];
        const bass = bassNotes[chordIndex];

        // Bass voice
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = "sine";
        bassOsc.frequency.setValueAtTime(bass, now);
        bassGain.gain.setValueAtTime(0.001, now);
        bassGain.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        bassOsc.connect(bassGain).connect(this.musicMasterGain);
        bassOsc.start(now);
        bassOsc.stop(now + 1.25);

        // Chord notes
        chord.forEach((freq) => {
          if (!this.ctx || !this.musicMasterGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
          osc.connect(gain).connect(this.musicMasterGain);
          osc.start(now);
          osc.stop(now + 1.35);
        });
      }

      // Play bright marimba/kalimba melody note
      const melodyFreq = melodyNotes[beat];
      if (melodyFreq) {
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.type = "sine";
        melOsc.frequency.setValueAtTime(melodyFreq, now);

        // Slight bell overtone
        const overtone = this.ctx.createOscillator();
        overtone.type = "triangle";
        overtone.frequency.setValueAtTime(melodyFreq * 2, now);

        melGain.gain.setValueAtTime(0.001, now);
        melGain.gain.exponentialRampToValueAtTime(0.24, now + 0.02);
        melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        melOsc.connect(melGain);
        overtone.connect(melGain);
        melGain.connect(this.musicMasterGain);

        melOsc.start(now);
        overtone.start(now);
        melOsc.stop(now + 0.4);
        overtone.stop(now + 0.4);
      }

      step++;
    };

    tick();
    this.musicTimer = window.setInterval(tick, 380);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const audio = new OrchardAudio();