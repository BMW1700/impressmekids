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
 *
 * Reliability rules (do not regress these — they are why the mic used to die
 * mid-battle):
 *  1. A SpeechRecognition object is SINGLE USE. Never call start() again on an
 *     instance that already ended/aborted — always build a fresh one.
 *  2. Every handler checks it belongs to the CURRENT instance, and handlers are
 *     detached on teardown so dead objects go inert.
 *  3. Restarts use exponential backoff (Chrome rate-limits hot restart loops).
 *  4. A watchdog cold-restarts a session that should be listening but stalled.
 *  5. Components that own the mic outside this manager (RPGWordReader) register
 *     via claimExternal() so forceStop()/start() can actually revoke them.
 */

import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeech } from '@capacitor-community/speech-recognition';
import { backoffDelay, killRecognition, startMicWatchdog } from '@/lib/speech/micWatchdog';

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
  private isStarting = false;
  private shouldRestart = false;
  private config: RecognitionConfig | null = null;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;
  private failureCount = 0;
  private lastActivityAt = 0;
  private stopWatchdog: (() => void) | null = null;

  // External owner (a component that drives its own SpeechRecognition object,
  // e.g. RPGWordReader). We can't control its instance, but we can revoke it.
  private externalOwner: RecognitionOwner = null;
  private externalRevoke: (() => void) | null = null;

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
    return this.currentOwner ?? this.externalOwner;
  }

  isActive(): boolean {
    return this.isRunning || this.externalOwner !== null;
  }

  // ---------------- External ownership ----------------

  /**
   * Register a component that owns the microphone with its own recognition
   * object. If any other owner claims the mic, `revoke` is invoked so the
   * external owner can shut its session down instead of racing it.
   */
  claimExternal(owner: RecognitionOwner, revoke: () => void): void {
    if (this.externalOwner && this.externalOwner !== owner) {
      try { this.externalRevoke?.(); } catch { /* ignore */ }
    }
    // A manager-driven session must yield to the new external owner.
    if (this.currentOwner && this.currentOwner !== owner) {
      this.forceStopInternal();
    }
    this.externalOwner = owner;
    this.externalRevoke = revoke;
  }

  releaseExternal(owner: RecognitionOwner): void {
    if (this.externalOwner !== owner) return;
    this.externalOwner = null;
    this.externalRevoke = null;
  }

  private revokeExternal(): void {
    if (!this.externalOwner) return;
    console.log('[SpeechManager] Revoking external mic owner:', this.externalOwner);
    const revoke = this.externalRevoke;
    this.externalOwner = null;
    this.externalRevoke = null;
    try { revoke?.(); } catch { /* ignore */ }
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
    // Force stop any existing recognition first (including external owners)
    this.forceStop();

    this.config = config;
    this.currentOwner = config.owner;
    this.shouldRestart = config.continuous !== false;
    this.failureCount = 0;
    this.lastActivityAt = Date.now();
    this.clearRestartTimer();

    if (this.isNative) {
      void this.startNative(config);
      this.armWatchdog();
      return true;
    }

    const ok = this.startWebInstance();
    if (ok) this.armWatchdog();
    return ok;
  }

  private clearRestartTimer(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
  }

  private armWatchdog(): void {
    this.stopWatchdog?.();
    this.stopWatchdog = startMicWatchdog({
      shouldBeListening: () => this.shouldRestart && this.currentOwner !== null,
      msSinceActivity: () => Date.now() - this.lastActivityAt,
      isBusy: () => this.isRunning || this.isStarting,
      onRecover: () => {
        if (!this.shouldRestart || !this.currentOwner) return;
        console.warn('[SpeechManager] Watchdog cold-restarting owner:', this.currentOwner);
        this.lastActivityAt = Date.now();
        if (this.isNative) {
          const cfg = this.config;
          if (cfg) void this.restartNative(cfg);
        } else {
          killRecognition(this.recognition);
          this.recognition = null;
          this.isRunning = false;
          this.isStarting = false;
          this.startWebInstance();
        }
      },
    });
  }

  /** Build and start a FRESH web recognition instance. Never reuse one. */
  private startWebInstance(): boolean {
    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.error('[SpeechManager] Speech recognition not supported');
      return false;
    }

    const config = this.config;
    if (!config) return false;
    const owner = config.owner;

    console.log('[SpeechManager] Starting web recognition for:', owner);

    // Discard any previous object entirely.
    killRecognition(this.recognition);
    this.recognition = null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = config.continuous !== false;
    recognition.interimResults = config.interimResults !== false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;

    // Identity guard: handlers only act while THIS instance is the live one.
    const isLive = () => this.recognition === recognition && this.currentOwner === owner;

    recognition.onstart = () => {
      if (!isLive()) return;
      console.log('[SpeechManager] Recognition started for:', owner);
      this.isRunning = true;
      this.isStarting = false;
      this.failureCount = 0;
      this.lastActivityAt = Date.now();
      this.config?.onStart?.();
    };

    recognition.onend = () => {
      if (!isLive()) return;
      console.log('[SpeechManager] Recognition ended for:', owner);
      this.isRunning = false;
      this.isStarting = false;
      this.config?.onEnd?.();
      if (this.shouldRestart) this.scheduleColdRestart(recognition, backoffDelay(this.failureCount));
    };

    recognition.onresult = (event: any) => {
      if (!isLive()) return;
      this.lastActivityAt = Date.now();
      this.failureCount = 0;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript?.trim() || '';
        const isFinal = result.isFinal;

        const alternatives: string[] = [];
        for (let j = 0; j < result.length; j++) {
          const alt = result[j]?.transcript?.trim() || '';
          if (alt) alternatives.push(alt);
        }

        this.config?.onResult(transcript, alternatives, isFinal);
      }
    };

    recognition.onerror = (event: any) => {
      if (!isLive()) return;
      console.log('[SpeechManager] Recognition error:', event.error, 'for:', owner);

      this.isStarting = false;
      if (event.error === 'aborted') {
        this.isRunning = false;
        return;
      }

      this.config?.onError?.(event.error);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.shouldRestart = false;
        this.isRunning = false;
        return;
      }

      // Recoverable — cold restart with backoff.
      this.isRunning = false;
      this.failureCount += 1;
      if (this.shouldRestart) this.scheduleColdRestart(recognition, backoffDelay(this.failureCount));
    };

    this.recognition = recognition;
    this.isStarting = true;
    this.lastActivityAt = Date.now();

    try {
      recognition.start();
      return true;
    } catch (e) {
      console.error('[SpeechManager] Failed to start:', e);
      this.isStarting = false;
      this.isRunning = false;
      this.failureCount += 1;
      // CRITICAL: always schedule a retry, otherwise the mic stays dead.
      if (this.shouldRestart) this.scheduleColdRestart(recognition, backoffDelay(this.failureCount));
      return false;
    }
  }

  /**
   * Schedule a restart that builds a brand-new instance. `from` is the
   * instance that requested it — if it is no longer live, the request is
   * ignored so a stale session can never cancel or hijack the live one.
   */
  private scheduleColdRestart(from: any, delayMs: number): void {
    if (this.recognition !== from) return;
    this.clearRestartTimer();
    this.restartTimeout = setTimeout(() => {
      this.restartTimeout = null;
      if (!this.shouldRestart || !this.currentOwner) return;
      if (this.recognition !== from) return;
      if (this.isRunning || this.isStarting) return;
      this.startWebInstance();
    }, delayMs);
  }

  /**
   * Stop recognition for a specific owner.
   * Only stops if the owner matches the current owner.
   */
  stop(owner: RecognitionOwner): void {
    if (this.externalOwner === owner) {
      this.releaseExternal(owner);
      return;
    }
    if (this.currentOwner !== owner) {
      console.log('[SpeechManager] Stop ignored - different owner. Current:', this.currentOwner, 'Requested:', owner);
      return;
    }
    console.log('[SpeechManager] Stopping recognition for:', owner);
    this.shouldRestart = false;
    this.clearRestartTimer();
    this.stopWatchdog?.();
    this.stopWatchdog = null;

    const cfg = this.config;
    if (this.isNative) {
      void this.stopNative();
    } else if (this.recognition) {
      killRecognition(this.recognition);
      this.recognition = null;
      try { cfg?.onEnd?.(); } catch { /* ignore */ }
    }
    this.isRunning = false;
    this.isStarting = false;
    this.currentOwner = null;
    this.config = null;
  }

  /**
   * Force stop any recognition, regardless of owner.
   * Use when transitioning between components.
   */
  forceStop(): void {
    this.revokeExternal();
    this.forceStopInternal();
  }

  private forceStopInternal(): void {
    console.log('[SpeechManager] Force stopping. Current owner:', this.currentOwner);
    this.shouldRestart = false;
    this.clearRestartTimer();
    this.stopWatchdog?.();
    this.stopWatchdog = null;
    if (this.isNative) {
      void this.stopNative();
    } else if (this.recognition) {
      killRecognition(this.recognition);
      this.recognition = null;
    }
    this.isRunning = false;
    this.isStarting = false;
    this.currentOwner = null;
    this.config = null;
  }

  abort(owner: RecognitionOwner): void {
    if (this.externalOwner === owner) {
      this.releaseExternal(owner);
      return;
    }
    if (this.currentOwner !== owner) return;
    console.log('[SpeechManager] Aborting recognition for:', owner);
    this.forceStopInternal();
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
          this.lastActivityAt = Date.now();
          this.failureCount = 0;
          // Cache so we can promote to a final result on stop().
          this.lastPartial = { transcript: alts[0], alternatives: alts };
          this.config.onResult(alts[0], alts, false);
        },
      );

      // Auto-restart when the OS ends the utterance, matching Web Speech continuous mode.
      this.nativeStateHandle = await NativeSpeech.addListener(
        'listeningState',
        (data: { status?: string }) => {
          if (!this.config || this.currentOwner !== config.owner) return;
          if (data?.status === 'stopped') {
            // Promote the last partial to a final result so downstream
            // Benny word cards / AURA scoring see isFinal=true.
            const last = this.lastPartial;
            if (last) {
              try { this.config.onResult(last.transcript, last.alternatives, true); } catch { /* ignore */ }
              this.lastPartial = null;
            }
            this.config.onEnd?.();
            this.isRunning = false;

            // Auto-restart if the owner still wants continuous listening.
            if (this.shouldRestart && this.currentOwner === config.owner) {
              this.clearRestartTimer();
              this.restartTimeout = setTimeout(() => {
                this.restartTimeout = null;
                if (this.shouldRestart && this.currentOwner === config.owner) {
                  void this.restartNative(config);
                }
              }, backoffDelay(this.failureCount));
            }
          }
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
      this.isStarting = false;
      this.lastActivityAt = Date.now();
      this.lastPartial = null;
      this.config?.onStart?.();
    } catch (e: any) {
      console.error('[SpeechManager] Native start failed:', e);
      this.isRunning = false;
      this.isStarting = false;
      this.failureCount += 1;
      config.onError?.(String(e?.message || e || 'native-start-failed'));
    }
  }

  private async restartNative(config: RecognitionConfig): Promise<void> {
    try {
      try { await NativeSpeech.stop(); } catch { /* ignore */ }
      await NativeSpeech.start({
        language: 'en-US',
        maxResults: 5,
        partialResults: true,
        popup: false,
      } as any);
      this.isRunning = true;
      this.isStarting = false;
      this.failureCount = 0;
      this.lastActivityAt = Date.now();
      this.lastPartial = null;
    } catch (e) {
      console.log('[SpeechManager] Native restart failed:', e);
      this.failureCount += 1;
    }
  }

  private async stopNative(): Promise<void> {
    try { await NativeSpeech.stop(); } catch { /* ignore */ }
    try { await NativeSpeech.removeAllListeners(); } catch { /* ignore */ }
    this.nativeListenerHandle = null;
    this.nativeStateHandle = null;
    // Promote any cached partial to a final result so word readers advance.
    const last = this.lastPartial;
    this.lastPartial = null;
    if (last && this.config) {
      try { this.config.onResult(last.transcript, last.alternatives, true); } catch { /* ignore */ }
    }
    this.config?.onEnd?.();
  }
}

export const speechManager = SpeechRecognitionManager.getInstance();
export type { RecognitionOwner, RecognitionConfig };
