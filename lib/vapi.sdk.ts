import Vapi from "@vapi-ai/web";

// Enhanced types for better development experience
interface VapiConfig {
  token: string;
  baseUrl?: string;
  debug?: boolean;
  retryAttempts?: number;
  timeoutMs?: number;
  reconnectAttempts?: number;
}

interface VapiConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  lastError?: Error;
  connectionAttempts: number;
  lastConnectionTime?: Date;
}

interface VapiCallMetrics {
  callId?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  messageCount: number;
  errorCount: number;
  reconnectionCount: number;
}

interface EnhancedVapiInstance extends Vapi {
  connectionState: VapiConnectionState;
  callMetrics: VapiCallMetrics;
  config: VapiConfig;
}

// Configuration with Apple-inspired defaults
const VAPI_CONFIG: VapiConfig = {
  token: process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!,
  baseUrl: process.env.NEXT_PUBLIC_VAPI_BASE_URL,
  debug: process.env.NODE_ENV === 'development',
  retryAttempts: 3,
  timeoutMs: 30000, // 30 seconds
  reconnectAttempts: 5
};

// Validation and error handling
const validateConfig = (): VapiConfig => {
  if (!VAPI_CONFIG.token) {
    throw new Error(
      'Vapi token is missing. Please ensure NEXT_PUBLIC_VAPI_WEB_TOKEN is set in your environment variables.'
    );
  }

  if (VAPI_CONFIG.token.length < 10) {
    throw new Error(
      'Vapi token appears to be invalid. Please check your NEXT_PUBLIC_VAPI_WEB_TOKEN environment variable.'
    );
  }

  return VAPI_CONFIG;
};

// Enhanced logging utility with better error handling
const log = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  if (VAPI_CONFIG.debug) {
    const timestamp = new Date().toISOString();
    const prefix = `[Vapi SDK ${timestamp}]`;
    
    // Safely stringify data to avoid circular references
    let dataStr = '';
    if (data) {
      try {
        dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
      } catch (e) {
        dataStr = '[Object with circular references]';
      }
    }
    
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`, dataStr || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, dataStr || '');
        break;
      case 'error':
        console.error(`${prefix} ${message}`, dataStr || '');
        break;
    }
  }
};

// Performance monitoring
const createPerformanceTimer = () => {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
};

// Enhanced Vapi instance creation with error handling
const createVapiInstance = (): EnhancedVapiInstance => {
  try {
    const config = validateConfig();
    log('info', 'Initializing Vapi SDK', { 
      tokenLength: config.token.length,
      debug: config.debug 
    });

    const instance = new Vapi(config.token) as EnhancedVapiInstance;

    // Add enhanced properties
    instance.config = config;
    instance.connectionState = {
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      connectionAttempts: 0
    };
    instance.callMetrics = {
      messageCount: 0,
      errorCount: 0,
      reconnectionCount: 0
    };

    // Setup enhanced event listeners
    setupEnhancedEventListeners(instance);

    log('info', 'Vapi SDK initialized successfully');
    return instance;

  } catch (error: any) {
    log('error', 'Failed to initialize Vapi SDK', { error: error.message });
    throw new Error(`Vapi SDK initialization failed: ${error.message}`);
  }
};

// Enhanced event listeners for better monitoring
const setupEnhancedEventListeners = (instance: EnhancedVapiInstance) => {
  // Connection state tracking
  instance.on('call-start', () => {
    log('info', 'Call started');
    instance.connectionState.isConnected = true;
    instance.connectionState.isConnecting = false;
    instance.connectionState.lastConnectionTime = new Date();
    instance.callMetrics.startTime = new Date();
    instance.callMetrics.callId = `call_${Date.now()}`;
    instance.callMetrics.messageCount = 0;
    instance.callMetrics.errorCount = 0;
  });

  instance.on('call-end', () => {
    log('info', 'Call ended', {
      duration: instance.callMetrics.duration,
      messages: instance.callMetrics.messageCount,
      errors: instance.callMetrics.errorCount
    });
    
    instance.connectionState.isConnected = false;
    instance.connectionState.isConnecting = false;
    instance.callMetrics.endTime = new Date();
    
    if (instance.callMetrics.startTime && instance.callMetrics.endTime) {
      instance.callMetrics.duration = 
        instance.callMetrics.endTime.getTime() - instance.callMetrics.startTime.getTime();
    }
  });

  // Message tracking
  instance.on('message', (message) => {
    instance.callMetrics.messageCount++;
    
    if (VAPI_CONFIG.debug && message.type === 'transcript') {
      log('info', 'Message received', {
        type: message.type,
        role: (message as any).role,
        transcriptType: (message as any).transcriptType
      });
    }
  });

  // Error tracking and handling
  instance.on('error', (error) => {
    instance.callMetrics.errorCount++;
    instance.connectionState.lastError = error;
    
    log('error', 'Vapi error occurred', {
      error: error.message || 'Unknown error',
      type: error.name || 'Error',
      callId: instance.callMetrics.callId
    });

    // Implement smart error recovery
    handleVapiError(instance, error);
  });

  // Speech detection
  instance.on('speech-start', () => {
    log('info', 'Speech started');
  });

  instance.on('speech-end', () => {
    log('info', 'Speech ended');
  });

  // Try to set up function call listener with error handling
  try {
    // Check if the instance has this event before setting up listener
    if (typeof instance.on === 'function') {
      // Use a more generic approach to avoid TypeScript issues
      const eventHandler = (data: any) => {
        if (data && data.functionCall) {
          log('info', 'Function call received', {
            name: data.functionCall.name,
            callId: instance.callMetrics.callId
          });
        }
      };
      
      // Try different possible event names for function calls
      const possibleEvents = ['function-call', 'functionCall', 'function_call'];
      possibleEvents.forEach(eventName => {
        try {
          (instance as any).on(eventName, eventHandler);
        } catch (e) {
          // Silently ignore if event doesn't exist
        }
      });
    }
  } catch (error) {
    log('warn', 'Could not set up function call listener', { error });
  }
};

// Intelligent error handling and recovery
const handleVapiError = async (instance: EnhancedVapiInstance, error: Error) => {
  const { connectionState, config } = instance;

  // Don't attempt recovery if we're already reconnecting
  if (connectionState.isReconnecting) {
    return;
  }

  // Check if this is a recoverable error
  const isRecoverable = isRecoverableError(error);
  
  if (isRecoverable && connectionState.connectionAttempts < config.reconnectAttempts!) {
    connectionState.isReconnecting = true;
    connectionState.connectionAttempts++;
    
    log('warn', `Attempting reconnection (${connectionState.connectionAttempts}/${config.reconnectAttempts})`, {
      error: error.message
    });

    // Exponential backoff for reconnection
    const delay = Math.min(1000 * Math.pow(2, connectionState.connectionAttempts - 1), 10000);
    
    setTimeout(() => {
      connectionState.isReconnecting = false;
      instance.callMetrics.reconnectionCount++;
      
      // Emit custom event for UI to handle
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vapi-reconnecting', {
          detail: { attempt: connectionState.connectionAttempts, error }
        }));
      }
    }, delay);
  } else {
    log('error', 'Unrecoverable error or max reconnection attempts reached', {
      error: error.message,
      attempts: connectionState.connectionAttempts
    });
    
    // Emit custom event for UI to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vapi-error-unrecoverable', {
        detail: { error, attempts: connectionState.connectionAttempts }
      }));
    }
  }
};

// Determine if an error is recoverable
const isRecoverableError = (error: Error): boolean => {
  const recoverableErrors = [
    'network error',
    'connection timeout',
    'websocket error',
    'temporary failure'
  ];

  const errorMessage = error.message.toLowerCase();
  return recoverableErrors.some(pattern => errorMessage.includes(pattern));
};

// Enhanced Vapi utilities
export const vapiUtils = {
  /**
   * Get current connection state
   */
  getConnectionState: (): VapiConnectionState => ({
    ...vapi.connectionState
  }),

  /**
   * Get call metrics
   */
  getCallMetrics: (): VapiCallMetrics => ({
    ...vapi.callMetrics
  }),

  /**
   * Check if Vapi is ready for use
   */
  isReady: (): boolean => {
    return !!(vapi && VAPI_CONFIG.token);
  },

  /**
   * Reset connection state (useful for testing)
   */
  resetConnectionState: (): void => {
    vapi.connectionState = {
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      connectionAttempts: 0
    };
    vapi.callMetrics = {
      messageCount: 0,
      errorCount: 0,
      reconnectionCount: 0
    };
  },

  /**
   * Enhanced start call with error handling
   */
  startCall: async (assistant: any, variableValues?: any): Promise<{
    success: boolean;
    error?: string;
    callId?: string;
  }> => {
    const timer = createPerformanceTimer();
    
    try {
      if (vapi.connectionState.isConnected) {
        log('warn', 'Call already in progress');
        return { success: false, error: 'Call already in progress' };
      }

      vapi.connectionState.isConnecting = true;
      log('info', 'Starting Vapi call', { assistant: assistant.name || 'unknown' });

      await vapi.start(assistant, { variableValues });

      log('info', 'Call started successfully', {
        timeTaken: timer(),
        callId: vapi.callMetrics.callId
      });

      return { 
        success: true, 
        callId: vapi.callMetrics.callId 
      };

    } catch (error: any) {
      vapi.connectionState.isConnecting = false;
      log('error', 'Failed to start call', {
        error: error.message,
        timeTaken: timer()
      });

      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * Enhanced stop call with cleanup
   */
  stopCall: async (): Promise<{
    success: boolean;
    error?: string;
    metrics?: VapiCallMetrics;
  }> => {
    const timer = createPerformanceTimer();
    
    try {
      if (!vapi.connectionState.isConnected) {
        log('warn', 'No active call to stop');
        return { success: false, error: 'No active call to stop' };
      }

      log('info', 'Stopping Vapi call');
      const currentMetrics = { ...vapi.callMetrics };
      
      vapi.stop();

      log('info', 'Call stopped successfully', {
        timeTaken: timer(),
        finalMetrics: currentMetrics
      });

      return { 
        success: true, 
        metrics: currentMetrics 
      };

    } catch (error: any) {
      log('error', 'Failed to stop call', {
        error: error.message,
        timeTaken: timer()
      });

      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * Send function call result
   */
  sendFunctionResult: (result: any): void => {
    try {
      // Use the correct message structure for Vapi
      (vapi as any).send({
        type: 'function-call-result',
        functionCallResult: {
          result,
          forwardToClientEnabled: true
        }
      });
      
      log('info', 'Function result sent', { result });
    } catch (error: any) {
      log('error', 'Failed to send function result', { error: error.message || 'Unknown error' });
    }
  },

  /**
   * Add message to conversation
   */
  addMessage: (role: 'system' | 'user' | 'assistant', content: string): void => {
    try {
      // Use the correct message structure for Vapi
      (vapi as any).send({
        type: 'add-message',
        message: {
          role,
          content
        }
      });
      
      log('info', 'Message added', { role, content: content.substring(0, 50) + '...' });
    } catch (error: any) {
      log('error', 'Failed to add message', { error: error.message || 'Unknown error' });
    }
  }
};

// Development utilities
export const vapiDevUtils = {
  /**
   * Enable/disable debug logging
   */
  setDebug: (enabled: boolean): void => {
    VAPI_CONFIG.debug = enabled;
    log('info', `Debug logging ${enabled ? 'enabled' : 'disabled'}`);
  },

  /**
   * Get current configuration
   */
  getConfig: (): VapiConfig => ({ ...VAPI_CONFIG }),

  /**
   * Simulate error for testing
   */
  simulateError: (errorMessage: string): void => {
    const simulatedError = new Error(errorMessage);
    handleVapiError(vapi, simulatedError);
  },

  /**
   * Get detailed diagnostics
   */
  getDiagnostics: () => ({
    config: VAPI_CONFIG,
    connectionState: vapi.connectionState,
    callMetrics: vapi.callMetrics,
    isTokenValid: !!(VAPI_CONFIG.token && VAPI_CONFIG.token.length > 10),
    browserSupport: {
      webRTC: !!(window as any).RTCPeerConnection,
      webAudio: !!(window as any).AudioContext || !!(window as any).webkitAudioContext,
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    }
  })
};

// Create and export the enhanced Vapi instance
export const vapi = createVapiInstance();

// Export types for use in other files
export type { VapiConfig, VapiConnectionState, VapiCallMetrics };

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (vapi.connectionState.isConnected) {
      vapiUtils.stopCall();
    }
  });
}