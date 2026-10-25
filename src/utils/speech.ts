// High-Fidelity Natural Speech Synthesizer with Instant Voice Initiation & True Pause/Resume
// Robust across all browser environments (Chrome, Safari, Firefox, Edge, iframes).
// Zero delay, zero beeps, and seamless continuation on speed changes.

export type SpeakerPersonaId = 'victoria' | 'julian';

export interface SpeakerPersona {
  id: SpeakerPersonaId;
  name: string;
  gender: 'female' | 'male';
  pitch: number;
  rateMultiplier: number;
  preferredVoiceKeywords: string[];
}

export const SPEAKER_PERSONAS: SpeakerPersona[] = [
  {
    id: 'victoria',
    name: 'Victoria',
    gender: 'female',
    pitch: 1.0,
    rateMultiplier: 1.0,
    preferredVoiceKeywords: [
      'Victoria',
      'Samantha',
      'Google UK English Female',
      'Google US English',
      'Microsoft Zira',
      'Microsoft Jenny',
      'Karen',
      'Serena',
      'Fiona',
      'Moira',
      'Ava',
      'Allison',
      'Susan',
      'en-US',
      'en-GB',
    ],
  },
  {
    id: 'julian',
    name: 'Julian',
    gender: 'male',
    pitch: 0.95,
    rateMultiplier: 1.0,
    preferredVoiceKeywords: [
      'Julian',
      'Daniel',
      'Google UK English Male',
      'Google US English',
      'Microsoft David',
      'Microsoft Mark',
      'Alex',
      'Christopher',
      'George',
      'Arthur',
      'James',
      'Ryan',
      'Guy',
      'en-US',
      'en-GB',
    ],
  },
];

export const PLAYBACK_SPEEDS = [0.85, 1.0, 1.15, 1.25, 1.5, 1.75, 2.0] as const;

// Retain all active utterances globally to prevent V8/WebKit garbage-collection bugs
const activeUtterancesSet = new Set<SpeechSynthesisUtterance>();
let sharedAudioContext: AudioContext | null = null;

// Silent no-op audio chime: all beeps removed per user request
export function playAudioChime(): void {
  // Completely silent - no beep sounds
}

export function unlockWebAudio(): void {
  try {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!sharedAudioContext) {
          sharedAudioContext = new AudioCtx();
        }
        if (sharedAudioContext.state === 'suspended') {
          sharedAudioContext.resume();
        }
      }
      if ('speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    }
  } catch (e) {}
}

// Clean text and expand business/financial abbreviations for natural human pronunciation
export function humanizeCaseText(text: string): string {
  if (!text) return '';
  let cleaned = text
    .replace(/[#*_~`]/g, '')
    .replace(/\[\d+\]/g, '') // remove citation brackets like [1], [2]
    .replace(/https?:\/\/\S+/g, '') // remove URLs
    .replace(/\bEBITDA\b/g, 'Ee-bit-dah')
    .replace(/\bCAGR\b/g, 'compound annual growth rate')
    .replace(/\bWACC\b/g, 'wack')
    .replace(/\bROI\b/g, 'R.O.I.')
    .replace(/\bROE\b/g, 'R.O.E.')
    .replace(/\bROA\b/g, 'R.O.A.')
    .replace(/\bCOGS\b/g, 'cost of goods sold')
    .replace(/\bFY(\d{2,4})\b/g, 'Fiscal Year $1')
    .replace(/\bQ([1-4])\b/g, 'Quarter $1')
    .replace(/\bEx\.\s*(\d+)/gi, 'Exhibit $1')
    .replace(/\bvs\./gi, 'versus')
    .replace(/\bapprox\./gi, 'approximately')
    .replace(/\be\.g\.,?/gi, 'for example,')
    .replace(/\bi\.e\.,?/gi, 'that is,')
    .replace(/\betc\./gi, 'etcetera')
    .replace(/\bDept\./gi, 'Department')
    .replace(/\$(\d+(\.\d+)?)\s*B\b/gi, '$1 billion dollars')
    .replace(/\$(\d+(\.\d+)?)\s*M\b/gi, '$1 million dollars')
    .replace(/\$(\d+(\.\d+)?)\s*K\b/gi, '$1 thousand dollars')
    .replace(/\$(\d+)/g, '$1 dollars')
    .replace(/(\d+)%/g, '$1 percent')
    .replace(/(\d+)\s*bps\b/gi, '$1 basis points')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

export class CaseSpeechPlayer {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onEndCallback: (() => void) | null = null;
  private onStartCallback: (() => void) | null = null;
  private selectedPersonaId: SpeakerPersonaId = 'victoria';
  private userSpeed: number = 1.0;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;
  private keepAliveInterval: any = null;
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private isExplicitlyStopped: boolean = false;

  // Track current spoken text, char offset, and start timestamp for seamless speed changes & resume
  private currentRawText: string = '';
  private currentCharOffset: number = 0;
  private speechStartTime: number = 0;

  constructor() {
    if (this.isSupported()) {
      this.initVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoices();
        };
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      const v = window.speechSynthesis.getVoices() || [];
      if (v.length > 0) {
        this.voices = v;
        this.voicesLoaded = true;
      }
    } catch (e) {
      // Ignored
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public unlockAudio(): void {
    unlockWebAudio();
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        const fresh = window.speechSynthesis.getVoices();
        if (fresh && fresh.length > 0) {
          this.voices = fresh;
          this.voicesLoaded = true;
        }
      } catch (e) {}
    }
    return this.voices;
  }

  public setPersona(personaId: SpeakerPersonaId) {
    this.selectedPersonaId = personaId;
  }

  public getPersona(): SpeakerPersona {
    return (
      SPEAKER_PERSONAS.find((p) => p.id === this.selectedPersonaId) ||
      SPEAKER_PERSONAS[0]
    );
  }

  /**
   * Updates playback speed.
   * If currently reading aloud, seamlessly continues speech at the new speed from the exact word
   * being spoken, without restarting from the beginning of the case or paragraph!
   */
  public setSpeed(speed: number) {
    const validSpeed = Math.max(0.7, Math.min(2.0, speed));
    this.userSpeed = validSpeed;

    if (this.isSpeaking && !this.isPaused && this.currentRawText) {
      // Calculate current offset from boundary event or elapsed time fallback
      let offset = this.currentCharOffset;
      if (offset <= 0 && this.speechStartTime > 0) {
        const elapsedSec = (performance.now() - this.speechStartTime) / 1000;
        const estOffset = Math.floor(elapsedSec * 13 * this.userSpeed);
        offset = Math.min(this.currentRawText.length, estOffset);
      }

      const remaining = this.currentRawText.slice(offset).trim();

      // If there is meaningful remaining text (> 8 chars), continue seamlessly from here
      if (remaining.length > 8) {
        // Find next word boundary so speech doesn't cut off mid-word
        let wordStart = 0;
        while (wordStart < remaining.length && !/\s/.test(remaining[wordStart])) {
          wordStart++;
        }
        const cleanRemaining = remaining.slice(wordStart).trim() || remaining;

        const savedEnd = this.onEndCallback;
        const savedStart = this.onStartCallback;

        // Cleanly cancel current utterance without triggering its onend
        if (this.currentUtterance) {
          this.currentUtterance.onend = null;
          this.currentUtterance.onerror = null;
          activeUtterancesSet.delete(this.currentUtterance);
          this.currentUtterance = null;
        }

        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();
        } catch (e) {}

        // Small 20ms tick to allow Chrome IPC cancel queue to flush before speaking remaining text
        setTimeout(() => {
          if (!this.isExplicitlyStopped && !this.isPaused) {
            this.speakUtteranceInternal(cleanRemaining, savedStart, savedEnd, false);
          }
        }, 20);
      }
    }
  }

  public getSpeed(): number {
    return this.userSpeed;
  }

  public isPlayingActive(): boolean {
    return this.isSpeaking && !this.isPaused;
  }

  public isPausedActive(): boolean {
    return this.isPaused;
  }

  public getCurrentCharOffset(): number {
    return this.currentCharOffset;
  }

  // Find best matching voice without blocking. Prioritizes rock-solid local device voices first.
  private findMatchingVoice(persona: SpeakerPersona): SpeechSynthesisVoice | null {
    const available = this.getVoices();
    if (!available || available.length === 0) return null;

    // Split local vs remote voices to strictly prioritize local device voices that never fail in iframes
    const localVoices = available.filter((v) => v.localService === true);

    // Filter local voices by persona keywords
    if (localVoices.length > 0) {
      for (const keyword of persona.preferredVoiceKeywords) {
        const match = localVoices.find((v) =>
          v.name && v.name.toLowerCase().includes(keyword.toLowerCase())
        );
        if (match) return match;
      }

      // Gender match in local voices
      if (persona.gender === 'female') {
        const femaleLocal = localVoices.find((v) => {
          const n = (v.name || '').toLowerCase();
          return (
            n.includes('female') ||
            n.includes('woman') ||
            n.includes('samantha') ||
            n.includes('victoria') ||
            n.includes('zira') ||
            n.includes('karen') ||
            n.includes('ava')
          );
        });
        if (femaleLocal) return femaleLocal;
      } else {
        const maleLocal = localVoices.find((v) => {
          const n = (v.name || '').toLowerCase();
          return (
            n.includes('male') ||
            n.includes('man') ||
            n.includes('david') ||
            n.includes('alex') ||
            n.includes('daniel') ||
            n.includes('george') ||
            n.includes('mark')
          );
        });
        if (maleLocal) return maleLocal;
      }

      // Any local English voice
      const anyLocalEnglish = localVoices.find((v) => v.lang && v.lang.startsWith('en'));
      if (anyLocalEnglish) return anyLocalEnglish;
    }

    // If no local voice matched, check default voice
    const defaultVoice = available.find((v) => v.default);
    if (defaultVoice) return defaultVoice;

    // Check all available for preferred keywords
    for (const keyword of persona.preferredVoiceKeywords) {
      const match = available.find((v) =>
        v.name && v.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (match) return match;
    }

    // Any available English voice
    const englishVoice = available.find((v) => v.lang && v.lang.startsWith('en'));
    if (englishVoice) return englishVoice;

    return available[0] || null;
  }

  /**
   * Starts speaking text immediately with ZERO delay.
   * Executed strictly synchronously within the user interaction context for 100% browser policy activation.
   */
  public speakText(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    this.currentRawText = text;
    this.currentCharOffset = 0;
    this.speakUtteranceInternal(text, onStart, onEnd, true);
  }

  private speakUtteranceInternal(
    text: string,
    onStart?: (() => void) | null,
    onEnd?: (() => void) | null,
    resetOffset: boolean = true
  ) {
    if (!this.isSupported() && typeof window === 'undefined') {
      if (onStart) onStart();
      setTimeout(() => {
        if (onEnd) onEnd();
      }, 1500);
      return;
    }

    const naturalText = humanizeCaseText(text);
    if (!naturalText || naturalText.trim().length === 0) {
      if (onEnd) onEnd();
      return;
    }

    if (resetOffset) {
      this.currentCharOffset = 0;
    }
    this.speechStartTime = performance.now();

    // Mark as active and clear previous stop/pause flags
    this.isExplicitlyStopped = false;
    this.isPaused = false;
    this.isSpeaking = true;
    this.onStartCallback = onStart || null;
    this.onEndCallback = onEnd || null;

    if (this.currentUtterance) {
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      activeUtterancesSet.delete(this.currentUtterance);
      this.currentUtterance = null;
    }

    if (this.isExplicitlyStopped || this.isPaused) return;

    try {
      if (window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const persona = this.getPersona();
      const utterance = new SpeechSynthesisUtterance(naturalText);

      utterance.pitch = persona.pitch;
      utterance.rate = Math.max(0.7, Math.min(2.0, this.userSpeed * persona.rateMultiplier));

      const matchingVoice = this.findMatchingVoice(persona);
      if (matchingVoice) {
        utterance.voice = matchingVoice;
        utterance.lang = matchingVoice.lang || 'en-US';
      } else {
        utterance.lang = 'en-US';
      }

      utterance.onboundary = (e: SpeechSynthesisEvent) => {
        if (typeof e.charIndex === 'number' && e.charIndex >= 0) {
          this.currentCharOffset = e.charIndex;
        }
      };

      let hasFiredStart = false;
      const notifyStart = () => {
        if (!hasFiredStart) {
          hasFiredStart = true;
          this.isSpeaking = true;
          this.isPaused = false;
          if (this.onStartCallback) {
            this.onStartCallback();
          }
        }
      };

      utterance.onstart = () => {
        notifyStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.clearKeepAlive();
        activeUtterancesSet.delete(utterance);
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
        }
        if (!this.isExplicitlyStopped && !this.isPaused && this.onEndCallback) {
          this.onEndCallback();
        }
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance note:', e);
        this.isSpeaking = false;
        this.clearKeepAlive();
        activeUtterancesSet.delete(utterance);
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
        }
      };

      this.currentUtterance = utterance;
      activeUtterancesSet.add(utterance);
      (window as any).__activeUtterance = utterance;

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume();
      this.startKeepAlive();
      notifyStart();
    } catch (err) {
      console.error('Speech synthesis error:', err);
      this.isSpeaking = false;
    }
  }

  private startKeepAlive() {
    this.clearKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.speaking && !this.isPaused) {
          window.speechSynthesis.resume();
        } else if (!window.speechSynthesis.speaking) {
          this.clearKeepAlive();
        }
      }
    }, 4000);
  }

  private clearKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  public pause() {
    this.isPaused = true;
    this.isSpeaking = false;
    this.clearKeepAlive();

    if (this.currentUtterance) {
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      activeUtterancesSet.delete(this.currentUtterance);
      this.currentUtterance = null;
    }

    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  public resume() {
    this.isPaused = false;
    this.isSpeaking = true;

    if (this.currentRawText) {
      let offset = this.currentCharOffset;
      if (offset <= 0 && this.speechStartTime > 0) {
        const elapsedSec = (performance.now() - this.speechStartTime) / 1000;
        const estOffset = Math.floor(elapsedSec * 13 * this.userSpeed);
        offset = Math.min(this.currentRawText.length, estOffset);
      }

      const remaining = this.currentRawText.slice(offset).trim();
      if (remaining.length > 0) {
        this.speakUtteranceInternal(remaining, this.onStartCallback, this.onEndCallback, false);
      } else if (this.onEndCallback) {
        this.onEndCallback();
      }
    }
  }

  public stop() {
    this.isExplicitlyStopped = true;
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentRawText = '';
    this.currentCharOffset = 0;
    this.speechStartTime = 0;
    this.clearKeepAlive();

    if (this.currentUtterance) {
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      activeUtterancesSet.delete(this.currentUtterance);
      this.currentUtterance = null;
    }
    this.onEndCallback = null;
    this.onStartCallback = null;

    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      (window as any).__activeUtterance = null;
    }
  }
}

export const speechPlayer = new CaseSpeechPlayer();


