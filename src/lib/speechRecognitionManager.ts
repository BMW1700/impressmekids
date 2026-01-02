/**
 * Singleton Speech Recognition Manager
 * Ensures only ONE recognition session runs at a time across the entire app.
 * Prevents mic conflicts between main reader and mini-games.
 */

type RecognitionOwner = 'reader' | 'tug_of_war' | 'balloon_battle' | 'shield' | 'spell_combo' | 'rhyme_chain' | 'speed_typist' | 'dodge_words' | 'fireball_defense' | 'beast_swarm' | 'asteroid_barrage' | 'ice_crystal' | 'ghostly_whispers' | 'rolling_boulders' | 'fireball_barrage' | null;

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
  private restartTimeout: NodeJS.Timeout | null = null;

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
    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.error('[SpeechManager] Speech recognition not supported');
      return false;
    }

    // If same owner is already running, just update config
    if (this.currentOwner === config.owner && this.isRunning) {
      console.log('[SpeechManager] Same owner already running:', config.owner);
      this.config = config;
      return true;
    }

    // Force stop any existing recognition first
    this.forceStop();

    console.log('[SpeechManager] Starting recognition for:', config.owner);
    
    this.config = config;
    this.currentOwner = config.owner;
    this.shouldRestart = config.continuous !== false;

    // Clear any pending restart
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

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
    
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
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
    
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // Ignore
      }
      this.recognition = null;
    }
    
    this.isRunning = false;
    this.currentOwner = null;
    this.config = null;
  }

  /**
   * Abort recognition immediately (for cleanup)
   */
  abort(owner: RecognitionOwner): void {
    if (this.currentOwner !== owner) {
      return;
    }

    console.log('[SpeechManager] Aborting recognition for:', owner);
    this.shouldRestart = false;
    
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // Ignore
      }
      this.recognition = null;
    }
    
    this.isRunning = false;
    this.currentOwner = null;
    this.config = null;
  }
}

export const speechManager = SpeechRecognitionManager.getInstance();
export type { RecognitionOwner, RecognitionConfig };
