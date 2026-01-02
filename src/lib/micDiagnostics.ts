/**
 * Microphone Diagnostics & Access Helper
 * Provides detailed error detection and user-friendly messages for mic issues.
 */

export interface MicDiagnostics {
  isSecureContext: boolean;
  isEmbedded: boolean;
  hasGetUserMedia: boolean;
  hasSpeechRecognition: boolean;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown' | 'unsupported';
  audioInputDevices: number;
  errorDetails: string | null;
}

export interface MicAccessResult {
  success: boolean;
  stream?: MediaStream;
  error?: {
    name: string;
    message: string;
    userMessage: string;
    actionRequired: 'unblock' | 'allow' | 'connect-device' | 'close-other-app' | 'open-new-tab' | 'none';
  };
  diagnostics: MicDiagnostics;
}

/**
 * Parse getUserMedia errors into user-friendly messages
 */
export function parseMediaError(error: any, diagnostics: MicDiagnostics): MicAccessResult['error'] {
  const name = error?.name || 'UnknownError';
  const message = error?.message || 'Unknown error occurred';

  // NotAllowedError - User denied OR browser policy blocked
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    // If embedded, it's likely a policy block
    if (diagnostics.isEmbedded) {
      return {
        name,
        message,
        userMessage: 'Microphone is blocked in this preview. Click "Open in new tab" to enable mic access.',
        actionRequired: 'open-new-tab',
      };
    }
    
    // If permission is 'denied', user blocked it in site settings
    if (diagnostics.permissionState === 'denied') {
      return {
        name,
        message,
        userMessage: 'Microphone is blocked in your browser settings. Click the lock icon in the address bar → Site settings → Allow Microphone.',
        actionRequired: 'unblock',
      };
    }
    
    // Otherwise, user just clicked "Block" on the prompt
    return {
      name,
      message,
      userMessage: 'Microphone access was denied. Please allow microphone access when prompted.',
      actionRequired: 'allow',
    };
  }

  // NotFoundError - No mic device
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return {
      name,
      message,
      userMessage: 'No microphone detected. Please connect a microphone and try again.',
      actionRequired: 'connect-device',
    };
  }

  // NotReadableError - Device in use by another app
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return {
      name,
      message,
      userMessage: 'Your microphone is in use by another app. Please close other apps using the mic and try again.',
      actionRequired: 'close-other-app',
    };
  }

  // OverconstrainedError - Constraints can't be satisfied
  if (name === 'OverconstrainedError') {
    return {
      name,
      message,
      userMessage: 'Microphone configuration error. Please try a different microphone.',
      actionRequired: 'connect-device',
    };
  }

  // SecurityError - Not secure context
  if (name === 'SecurityError') {
    return {
      name,
      message,
      userMessage: 'Microphone requires a secure connection (HTTPS). Please access this page via HTTPS.',
      actionRequired: 'none',
    };
  }

  // AbortError - Request was aborted
  if (name === 'AbortError') {
    return {
      name,
      message,
      userMessage: 'Microphone request was cancelled. Please try again.',
      actionRequired: 'none',
    };
  }

  // Generic fallback
  return {
    name,
    message,
    userMessage: `Microphone error: ${message}. Please check your browser settings.`,
    actionRequired: 'none',
  };
}

/**
 * Gather comprehensive mic diagnostics
 */
export async function getMicDiagnostics(): Promise<MicDiagnostics> {
  const diagnostics: MicDiagnostics = {
    isSecureContext: window.isSecureContext,
    isEmbedded: window.self !== window.top,
    hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    hasSpeechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    permissionState: 'unknown',
    audioInputDevices: 0,
    errorDetails: null,
  };

  // Check permission state if Permissions API is available
  try {
    if (navigator.permissions) {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      diagnostics.permissionState = permissionStatus.state as 'granted' | 'denied' | 'prompt';
    } else {
      diagnostics.permissionState = 'unsupported';
    }
  } catch (e) {
    diagnostics.permissionState = 'unsupported';
  }

  // Enumerate devices to count audio inputs
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    diagnostics.audioInputDevices = devices.filter(d => d.kind === 'audioinput').length;
  } catch (e) {
    diagnostics.errorDetails = 'Could not enumerate devices';
  }

  return diagnostics;
}

/**
 * Ensure microphone access - MUST be called from a user gesture (click/tap)
 * This properly requests mic permission and provides detailed error info.
 * 
 * @param keepStreamOpen - If true, returns the stream for the caller to use. If false, immediately stops the stream after permission is granted.
 */
export async function ensureMicrophoneAccess(keepStreamOpen = false): Promise<MicAccessResult> {
  console.log('[MicDiagnostics] Requesting microphone access...');
  
  const diagnostics = await getMicDiagnostics();
  
  console.log('[MicDiagnostics] Diagnostics:', {
    secure: diagnostics.isSecureContext,
    embedded: diagnostics.isEmbedded,
    hasMedia: diagnostics.hasGetUserMedia,
    hasSpeech: diagnostics.hasSpeechRecognition,
    permission: diagnostics.permissionState,
    devices: diagnostics.audioInputDevices,
  });

  // Pre-check: If we're embedded and permission isn't already granted, warn
  if (diagnostics.isEmbedded && diagnostics.permissionState !== 'granted') {
    console.warn('[MicDiagnostics] Embedded context - mic may be blocked by policy');
  }

  // Pre-check: If permission is already denied, don't bother trying
  if (diagnostics.permissionState === 'denied') {
    console.warn('[MicDiagnostics] Permission already denied - browser will not prompt');
    return {
      success: false,
      error: {
        name: 'NotAllowedError',
        message: 'Permission previously denied',
        userMessage: 'Microphone is blocked. Click the lock icon in the address bar → Site settings → Allow Microphone, then reload the page.',
        actionRequired: 'unblock',
      },
      diagnostics,
    };
  }

  // Try to get mic access
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    console.log('[MicDiagnostics] ✅ Microphone access granted!');
    
    if (!keepStreamOpen) {
      // Stop tracks immediately - we just wanted to trigger the permission prompt
      stream.getTracks().forEach(track => track.stop());
      return { success: true, diagnostics };
    }
    
    return { success: true, stream, diagnostics };
  } catch (error: any) {
    console.error('[MicDiagnostics] ❌ Microphone access failed:', error.name, error.message);
    
    // Re-fetch diagnostics after error (permission state may have changed)
    const updatedDiagnostics = await getMicDiagnostics();
    
    return {
      success: false,
      error: parseMediaError(error, updatedDiagnostics),
      diagnostics: updatedDiagnostics,
    };
  }
}

/**
 * Test if speech recognition can start successfully.
 * MUST be called from a user gesture.
 */
export async function testSpeechRecognition(): Promise<{ success: boolean; error?: string }> {
  const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  
  if (!SpeechRecognitionAPI) {
    return { success: false, error: 'Speech recognition not supported in this browser' };
  }

  return new Promise((resolve) => {
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let resolved = false;
    const complete = (success: boolean, error?: string) => {
      if (resolved) return;
      resolved = true;
      try { recognition.abort(); } catch (e) { /* ignore */ }
      resolve({ success, error });
    };

    recognition.onstart = () => {
      console.log('[MicDiagnostics] Speech recognition started successfully');
      // Stop it right away - we just wanted to test it
      complete(true);
    };

    recognition.onerror = (event: any) => {
      console.error('[MicDiagnostics] Speech recognition error:', event.error);
      complete(false, event.error);
    };

    // Timeout after 3 seconds
    setTimeout(() => {
      complete(false, 'Timeout - speech recognition did not start');
    }, 3000);

    try {
      recognition.start();
    } catch (e: any) {
      complete(false, e.message || 'Failed to start speech recognition');
    }
  });
}
