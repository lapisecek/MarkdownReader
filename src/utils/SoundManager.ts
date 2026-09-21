export class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.5;

  private constructor() {}

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol / 100));
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public async setOutputDevice(deviceId: string) {
    this.init();
    if (this.audioContext && 'setSinkId' in this.audioContext) {
      try {
        await (this.audioContext as any).setSinkId(deviceId);
      } catch (e) {
        console.error('Failed to set audio output device:', e);
      }
    }
  }

  private createGainNode(): GainNode | null {
    if (!this.audioContext) return null;
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.volume;
    gainNode.connect(this.audioContext.destination);
    return gainNode;
  }

  public playTypewriter() {
    if (!this.isEnabled || !this.audioContext) return;
    const gainNode = this.createGainNode();
    if (!gainNode) return;
    
    // Create a very short, crisp click noise
    const osc = this.audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.02);
    
    gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.03);

    osc.connect(gainNode);
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.03);
  }

  public playSave() {
    if (!this.isEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const gainNode = this.createGainNode();
    if (!gainNode) return;

    // Pleasant chime chord
    const freqs = [440, 554.37, 659.25]; // A4, C#5, E5 (A major)
    const t = ctx.currentTime;

    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, t + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gainNode);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  }

  public playNotification() {
    if (!this.isEnabled || !this.audioContext) return;
    const gainNode = this.createGainNode();
    if (!gainNode) return;

    const t = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    
    osc.frequency.setValueAtTime(523.25, t); // C5
    osc.frequency.setValueAtTime(659.25, t + 0.15); // E5

    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, t + 0.05);
    gainNode.gain.setValueAtTime(this.volume * 0.2, t + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gainNode);
    osc.start(t);
    osc.stop(t + 0.4);
  }
}

export const soundManager = SoundManager.getInstance();
