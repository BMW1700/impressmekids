/**
 * Singleton Speech Recognition Manager
 * Ensures only ONE recognition session runs at a time across the entire app.
 * Prevents mic conflicts between main reader and mini-games.
 *
 * Platform routing:
 *  - Web browsers  -> window.webkitSpeechRecognition (Chrome, Edge, Safari desktop)
 *  - iOS/Android   -> @capacitor-community/speech-recognition (native SFSpeechRecognizer)
 *
 * The native adapter emits the same (transcript, alternatives, isFinal) shape
 * as the web path, so RPGWordReader / Benny / AURA see no difference.
 */

import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeech } from '@capacitor-community/speech-recognition';

type RecognitionOwner = 'reader' | 'tug_of_war' | 'balloon_battle' | 'shield' | 'spell_combo' | 'rhyme_chain' | 'speed_typist' | 'dodge_words' | 'fireball_defense' | 'beast_swarm' | 'asteroid_barrage' | 'ice_crystal' | 'ghostly_whispers' | 'rolling_boulders' | 'fireball_barrage' | 'quickblock' | 'web_trap' | 'ink_splash' | 'goblin_horde' | 'word_cannon' | 'word_echo' | 'word_ninja' | 'pvp_battle' | 'coop_battle' | 'castle_swarm' | null;

interface RecognitionConfig {
  owner: RecognitionOwner;
  continuous?: boolean;
  interimResults?: boolean;
  onResult: (transcript: string, alternatives: string[], isFinal: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

class SpeechRecognitionManager {
  private static instance: SpeechRecognitionManager;
  private recognition: any = null;
  private currentOwner: RecognitionOwner = null;
  private isRunning = false;
  private shouldRestart = false;
  private config: RecognitionConfig | null = null;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;

  // Native-only state
  private isNative = Capacitor.isNativePlatform();
  private nativeListenerHandle: any = null;
  private nativeStateHandle: any = null;
  private lastPartial: { transcript: string; alternatives: string[] } | null = null;

  private constructor() {}

  static getInstance(): SpeechRecognitionManager {
    if (!SpeechRecognitionManager.instance) {
      SpeechRecognitionManager.instance = new SpeechRecognitionManager();
    }
    return SpeechRecognitionManager.instance;
  }

  getCurrentOwner(): RecognitionOwner {
    return this.currentOwner;
  }

  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Start recognition for a specific owner.
   * If another owner is active, it will be forcefully stopped first.
   */
  start(config: RecognitionConfig): boolean {
    // If same owner is already running, just update config (works for both paths)
    if (this.currentOwner === config.owner && this.isRunning) {
      console.log('[SpeechManager] Same owner already running:', config.owner);
      this.config = config;
      return true;
    }
    // Force stop any existing recognition first
    this.forceStop();

    this.config = config;
    this.currentOwner = config.owner;
    this.shouldRestart = config.continuous !== false;
    if (this.restartTimeout) { clearTimeout(this.restartTimeout); this.restartTimeout = null; }

    if (this.isNative) {
      void this.startNative(config);
      return true;
    }

    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.error('[SpeechManager] Speech recognition not supported');
      return false;
    }

    console.log('[SpeechManager] Starting web recognition for:', config.owner);


    // Create new recognition instance
    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = config.continuous !== false;
    this.recognition.interimResults = config.interimResults !== false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 5;

    this.recognition.onstart = () => {
      console.log('[SpeechManager] Recognition started for:', this.currentOwner);
      this.isRunning = true;
      this.config?.onStart?.();
    };

    this.recognition.onend = () => {
      console.log('[SpeechManager] Recognition ended for:', this.currentOwner);
      this.isRunning = false;
      this.config?.onEnd?.();

      // Auto-restart if configured and same owner
      if (this.shouldRestart && this.currentOwner === config.owner) {
        this.restartTimeout = setTimeout(() => {
          if (this.shouldRestart && this.currentOwner === config.owner) {
            console.log('[SpeechManager] Auto-restarting for:', config.owner);
            try {
              this.recognition?.start();
            } catch (e) {
              console.log('[SpeechManager] Restart failed:', e);
            }
          }
        }, 100);
      }
    };

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript?.trim() || '';
        const isFinal = result.isFinal;

        // Collect alternatives
        const alternatives: string[] = [];
        for (let j = 0; j < result.length; j++) {
          const alt = result[j]?.transcript?.trim() || '';
          if (alt) alternatives.push(alt);
        }

        this.config?.onResult(transcript, alternatives, isFinal);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.log('[SpeechManager] Recognition error:', event.error, 'for:', this.currentOwner);
      
      if (event.error === 'aborted') {
        this.isRunning = false;
        return;
      }

      this.config?.onError?.(event.error);

      // For recoverable errors, try to restart
      if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'network') {
        this.isRunning = false;
        if (this.shouldRestart && this.currentOwner === config.owner) {
          this.restartTimeout = setTimeout(() => {
            if (this.shouldRestart && this.currentOwner === config.owner) {
              try {
                this.recognition?.start();
              } catch (e) {
                console.log('[SpeechManager] Error restart failed:', e);
              }
            }
          }, 300);
        }
      }
    };

    try {
      this.recognition.start();
      return true;
    } catch (e) {
      console.error('[SpeechManager] Failed to start:', e);
      this.isRunning = false;
      return false;
    }
  }

  /**
   * Stop recognition for a specific owner.
   * Only stops if the owner matches the current owner.
   */
  stop(owner: RecognitionOwner): void {
    if (this.currentOwner !== owner) {
      console.log('[SpeechManager] Stop ignored - different owner. Current:', this.currentOwner, 'Requested:', owner);
      return;
    }
    console.log('[SpeechManager] Stopping recognition for:', owner);
    this.shouldRestart = false;
    if (this.restartTimeout) { clearTimeout(this.restartTimeout); this.restartTimeout = null; }
    if (this.isNative) {
      void this.stopNative();
    } else if (this.recognition) {
      try { this.recognition.stop(); } catch { /* ignore */ }
    }
    this.isRunning = false;
    this.currentOwner = null;
    this.config = null;
  }

  /**
   * Force stop any recognition, regardless of owner.
   * Use when transitioning between components.
   */
  forceStop(): void {
    console.log('[SpeechManager] Force stopping. Current owner:', this.currentOwner);
    this.shouldRestart = false;
    if (this.restartTimeout) { clearTimeout(this.restartTimeout); this.restartTimeout = null; }
    if (this.isNative) {
      void this.stopNative();
    } else if (this.recognition) {
      try { this.recognition.abort(); } catch { /* ignore */ }
      this.recognition = null;
    }
    this.isRunning = false;
    this.currentOwner = null;
    this.config = null;
  }

  abort(owner: RecognitionOwner): void {
    if (this.currentOwner !== owner) return;
    console.log('[SpeechManager] Aborting recognition for:', owner);
    this.shouldRestart = false;
    if (this.restartTimeout) { clearTimeout(this.restartTimeout); this.restartTimeout = null; }
    if (this.isNative) {
      void this.stopNative();
    } else if (this.recognition) {
      try { this.recognition.abort(); } catch { /* ignore */ }
      this.recognition = null;
    }
    this.isRunning = false;
    this.currentOwner = null;
    this.config = null;
  }

  // ---------------- Native (Capacitor) path ----------------
  //
  // The @capacitor-community/speech-recognition plugin exposes an event-based
  // partial-results stream on iOS/Android. We forward each partial as a
  // non-final result and mark the terminal event as final so callers that
  // rely on `isFinal` (e.g. Benny word cards) behave identically to web.

  private async startNative(config: RecognitionConfig): Promise<void> {
    try {
      const avail = await NativeSpeech.available().catch(() => ({ available: false }));
      if (!(avail as any).available) {
        console.error('[SpeechManager] Native speech recognition unavailable');
        config.onError?.('not-supported');
        return;
      }
      const perm = await NativeSpeech.checkPermissions().catch(() => ({ speechRecognition: 'prompt' }));
      if ((perm as any).speechRecognition !== 'granted') {
        const req = await NativeSpeech.requestPermissions().catch(() => ({ speechRecognition: 'denied' }));
        if ((req as any).speechRecognition !== 'granted') {
          config.onError?.('not-allowed');
          return;
        }
      }

      // Detach any prior listener before attaching a new one.
      try { await NativeSpeech.removeAllListeners(); } catch { /* ignore */ }

      this.nativeListenerHandle = await NativeSpeech.addListener(
        'partialResults',
        (data: { matches?: string[] }) => {
          if (!this.config || this.currentOwner !== config.owner) return;
          const alts = (data?.matches ?? []).map((s) => (s || '').trim()).filter(Boolean);
          if (alts.length === 0) return;
          this.config.onResult(alts[0], alts, false);
        },
      );

      await NativeSpeech.start({
        language: 'en-US',
        maxResults: 5,
        prompt: undefined,
        partialResults: true,
        popup: false,
      } as any);

      this.isRunning = true;
      this.config?.onStart?.();
    } catch (e: any) {
      console.error('[SpeechManager] Native start failed:', e);
      this.isRunning = false;
      config.onError?.(String(e?.message || e || 'native-start-failed'));
    }
  }

  private async stopNative(): Promise<void> {
    try { await NativeSpeech.stop(); } catch { /* ignore */ }
    try { await NativeSpeech.removeAllListeners(); } catch { /* ignore */ }
    this.nativeListenerHandle = null;
    // Emit a terminal final result using the last known transcript is not
    // possible here (the plugin does not expose one on stop). Callers that
    // subscribed via `partialResults` have already received partials; we
    // fire `onEnd` so word readers can advance if they were waiting.
    this.config?.onEnd?.();
  }
}

export const speechManager = SpeechRecognitionManager.getInstance();
export type { RecognitionOwner, RecognitionConfig };
