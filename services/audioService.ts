
class AudioService {
  private ctx: AudioContext | null = null;
  private whirringOsc: OscillatorNode | null = null;
  private whirringLfo: OscillatorNode | null = null;
  private whirringGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startWhirring() {
    this.init();
    if (!this.ctx) return;
    this.stopWhirring();

    const now = this.ctx.currentTime;
    
    // Create dual-layer sound to evoke a heavy spinning metal wheel/gear
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(125, now);

    // Speed modulation LFO to provide a mechanical "whirring" pulse (12Hz)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(12, now);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(35, now); // Modulates frequency by +/-35Hz

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    // Smooth ramp-up to avoid clicks
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.15);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    lfo.start();

    this.whirringOsc = osc;
    this.whirringLfo = lfo;
    this.whirringGain = gainNode;
  }

  stopWhirring() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.whirringOsc;
    const lfo = this.whirringLfo;
    const gainNode = this.whirringGain;

    this.whirringOsc = null;
    this.whirringLfo = null;
    this.whirringGain = null;

    if (gainNode) {
      try {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        // Clean exponential fade-out
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        if (osc) {
          osc.stop(now + 0.35);
        }
        if (lfo) {
          lfo.stop(now + 0.35);
        }
      } catch (e) {
        if (osc) try { osc.stop(); } catch(err) {}
        if (lfo) try { lfo.stop(); } catch(err) {}
      }
    }
  }

  playTick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playCountdownTick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime); // High crisp frequency
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playCountdownGo() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Impact riser synth
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.45); // Rising energy
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.45);

    // Complementary chirp
    const chirp = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();
    chirp.type = 'square';
    chirp.frequency.setValueAtTime(1100, now);
    chirp.frequency.exponentialRampToValueAtTime(550, now + 0.25);
    chirpGain.gain.setValueAtTime(0.08, now);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    chirp.connect(chirpGain);
    chirpGain.connect(this.ctx.destination);
    chirp.start();
    chirp.stop(now + 0.25);
  }

  playWin() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.50];
    frequencies.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      gain.gain.setValueAtTime(0.15, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.1);
    });
  }

  playLose() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.4);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(215, now);
    osc2.frequency.exponentialRampToValueAtTime(50, now + 0.4);
    osc2.connect(gain);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc2.start();
    osc.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  playLevelUp(level: number) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const baseFreq = 110 * (1 + level * 0.5);
    
    // Sweeping massive bass
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(baseFreq / 2, now);
    sub.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 1.5);
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.3, now + 0.2);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start();
    sub.stop(now + 1.5);

    // Glitchy high chords
    [1, 1.2, 1.5, 1.8].forEach((mult, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq * mult, now + i * 0.1);
      g.gain.setValueAtTime(0, now + i * 0.1);
      g.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + 1);
    });
  }

  speakWithFemaleVoice(text: string, pitch = 1.25, rate = 0.8) {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Clear any pending speech to ensure instant delivery
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      
      // Filter for English voices first
      const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
      
      // Known male identifiers to avoid
      const maleNames = ['david', 'daniel', 'george', 'alex', 'fred', 'oliver', 'ryan', 'james', 'thomas', 'guy', 'male'];
      // Known female voice identifiers
      const femaleNames = ['female', 'samantha', 'zira', 'hazel', 'karen', 'tessa', 'susan', 'victoria', 'moira', 'fiona', 'heather', 'siri', 'sara', 'clara', 'natural'];

      // Attempt 1: English female voice matching known female names, verifying no male match
      let targetVoice = englishVoices.find(v => {
        const name = v.name.toLowerCase();
        return femaleNames.some(fn => name.includes(fn)) && !maleNames.some(mn => name.includes(mn) && mn !== 'female');
      });

      // Attempt 2: English voice containing word "female" or "woman" (as fallback)
      if (!targetVoice) {
        targetVoice = englishVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes('female') || name.includes('woman') || name.includes('girl');
        });
      }

      // Attempt 3: Any English voice that does NOT match known male names
      if (!targetVoice) {
        targetVoice = englishVoices.find(v => {
          const name = v.name.toLowerCase();
          return !maleNames.some(mn => name.includes(mn));
        });
      }

      // Attempt 4: Any voice worldwide (regardless of English) matching known female names
      if (!targetVoice) {
        targetVoice = voices.find(v => {
          const name = v.name.toLowerCase();
          return femaleNames.some(fn => name.includes(fn));
        });
      }

      // Attempt 5: First English voice
      if (!targetVoice) {
        targetVoice = englishVoices[0];
      }

      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      // Determine pitch adjustment to guarantee feminine tone
      // If the voice name contains male identifiers or we fallback heavily, increase pitch significantly
      const voiceNameLower = targetVoice ? targetVoice.name.toLowerCase() : '';
      const isKnownMale = maleNames.some(mn => voiceNameLower.includes(mn));
      
      if (isKnownMale) {
        // If we are forced to use a male voice because it's the only one, raise the pitch to make it sound feminine
        utterance.pitch = 1.65;
        utterance.rate = rate * 1.05;
      } else {
        // Expressive sassy/seductive female pitch and slightly slower rate for deep tone
        utterance.pitch = pitch; 
        utterance.rate = rate;
      }
      
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    }
  }

  playKissVocal() {
    this.speakWithFemaleVoice("Oh, Kiss me.", 1.25, 0.82);
  }

  playHugVocal() {
    this.speakWithFemaleVoice("Hug me baby. Oh baby", 1.20, 0.80);
  }

  playLickVocal() {
    this.speakWithFemaleVoice("Wait, now I will Lick you", 1.25, 0.80);
  }

  playCreepVocal() {
    this.speakWithFemaleVoice("Ouch, you are such a creep.", 1.25, 0.88);
  }
}

export const audioService = new AudioService();
