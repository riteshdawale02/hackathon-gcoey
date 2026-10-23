// Audio chime and Text-to-Speech token announcer
class AudioAnnouncer {
  constructor() {
    this.audioCtx = null;
    this.speechEnabled = true;
    this.lastAnnouncedToken = null;
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play pleasant hospital ding-dong chime
  playChime() {
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Tone 1: High note (F5 ~ 698.46 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Tone 2: Harmonious lower note (C5 ~ 523.25 Hz)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.35);
      gain2.gain.setValueAtTime(0.35, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 1.2);
    } catch (err) {
      console.warn('Audio chime error:', err);
    }
  }

  // Speak announcement
  announceToken(tokenNumber, roomNumber, doctorName) {
    if (!('speechSynthesis' in window)) return;

    this.playChime();

    setTimeout(() => {
      try {
        window.speechSynthesis.cancel(); // Cancel any existing speech
        const speech = new SpeechSynthesisUtterance();
        speech.text = `Attention please. Token ${tokenNumber}, please proceed to ${roomNumber || 'consultation room'}${doctorName ? ' for ' + doctorName : ''}.`;
        speech.lang = 'en-US';
        speech.rate = 0.95;
        speech.pitch = 1.0;
        window.speechSynthesis.speak(speech);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    }, 600);
  }
}

export const announcer = new AudioAnnouncer();
