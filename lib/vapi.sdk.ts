// lib/vapi.sdk.ts - FINAL TYPE-SAFE VERSION
import Vapi from "@vapi-ai/web";

// Type-safe configuration interface
interface VapiConfig {
  token: string;
  baseUrl: string;
  debug: boolean;
}

// Type for configuration test results
interface ConfigTestResult {
  success: boolean;
  message: string;
  token?: string;
  details?: {
    tokenLength: number;
    tokenPreview: string;
    hasCorrectPrefix: boolean;
  };
}

// Get VAPI token with proper type checking
function getVapiToken(): string | null {
  const possibleTokens = [
    process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN,
    process.env.NEXT_PUBLIC_VAPI_TOKEN,
    process.env.VAPI_TOKEN,
    process.env.VAPI_WEB_TOKEN,
  ];

  // Find the first valid token
  for (const token of possibleTokens) {
    if (token && typeof token === 'string' && token.length > 10) {
      console.log('✅ VAPI token found:', `${token.substring(0, 8)}...`);
      return token;
    }
  }

  return null;
}

// Create configuration with proper error handling
function createConfig(): VapiConfig {
  const token = getVapiToken();
  
  if (!token) {
    throw new Error(
      '❌ VAPI token not found. Please add to your .env.local file:\nNEXT_PUBLIC_VAPI_WEB_TOKEN=your-token-here'
    );
  }

  return {
    token,
    baseUrl: process.env.NEXT_PUBLIC_VAPI_BASE_URL || "https://api.vapi.ai",
    debug: process.env.NODE_ENV === 'development'
  };
}

// Initialize VAPI instance with proper error handling
function createVapiInstance(): Vapi | null {
  try {
    const config = createConfig();
    
    console.log('🚀 Initializing VAPI SDK...');
    
    // Create VAPI instance - VAPI constructor only takes token as first parameter
    const vapiInstance = new Vapi(config.token);

    // Add event listeners for debugging
    if (config.debug) {
      vapiInstance.on('call-start', () => {
        console.log('📞 VAPI call started');
      });

      vapiInstance.on('call-end', () => {
        console.log('📞 VAPI call ended');
      });

      vapiInstance.on('error', (error: Error) => {
        console.error('❌ VAPI error:', error);
        
        // Check for auth errors specifically
        if (error.message?.includes('Unauthorized') || 
            error.message?.includes('401')) {
          console.error('🔐 Authentication Error - Check your VAPI token');
          console.error('Current token preview:', `${config.token.substring(0, 8)}...`);
        }
      });

      vapiInstance.on('message', (message: any) => {
        if (message.type === 'transcript') {
          console.log('📨 Transcript:', message);
        }
      });
    }

    console.log('✅ VAPI SDK initialized successfully');
    return vapiInstance;

  } catch (error: any) {
    console.error('❌ Failed to initialize VAPI SDK:', error.message);
    return null;
  }
}

// Create the VAPI instance (can be null if initialization fails)
const vapiInstance = createVapiInstance();

// Export the VAPI instance
export const vapi = vapiInstance;

// Utility functions
export const vapiUtils = {
  /**
   * Check if VAPI is ready
   */
  isReady(): boolean {
    return vapiInstance !== null;
  },

  /**
   * Start a call with better error handling
   */
  async startCall(assistant: any, options?: { variableValues?: any }): Promise<void> {
    if (!vapiInstance) {
      throw new Error('VAPI not initialized. Please check your token configuration.');
    }

    try {
      console.log('📞 Starting VAPI call...', { assistant });
      
      if (options?.variableValues) {
        await vapiInstance.start(assistant, { variableValues: options.variableValues });
      } else {
        await vapiInstance.start(assistant);
      }
      
      console.log('✅ VAPI call started successfully');
    } catch (error: any) {
      console.error('❌ Failed to start VAPI call:', error);
      
      // Provide specific error messages
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        throw new Error('Authentication failed. Please check your VAPI token in .env.local');
      }
      
      throw error;
    }
  },

  /**
   * Stop the current call
   */
  stopCall(): void {
    if (!vapiInstance) {
      console.warn('⚠️ VAPI not initialized');
      return;
    }

    try {
      console.log('🛑 Stopping VAPI call...');
      vapiInstance.stop();
      console.log('✅ VAPI call stopped');
    } catch (error: any) {
      console.error('❌ Failed to stop VAPI call:', error);
    }
  },

  /**
   * Get configuration for debugging
   */
  getConfig(): Partial<VapiConfig> {
    try {
      const config = createConfig();
      return {
        token: `${config.token.substring(0, 8)}...${config.token.substring(config.token.length - 4)}`,
        baseUrl: config.baseUrl,
        debug: config.debug
      };
    } catch (error) {
      return { debug: false };
    }
  }
};

// Development utilities
export const vapiDevUtils = {
  /**
   * Test VAPI configuration
   */
  testConfig(): ConfigTestResult {
    try {
      const token = getVapiToken();
      
      if (!token) {
        return {
          success: false,
          message: 'No VAPI token found in environment variables'
        };
      }

      if (token.length < 20) {
        return {
          success: false,
          message: 'VAPI token appears to be too short',
          token: `${token.substring(0, 8)}...`
        };
      }

      const hasCorrectPrefix = token.startsWith('sk-') || token.startsWith('pk-');
      
      if (!hasCorrectPrefix) {
        return {
          success: false,
          message: 'VAPI token should start with sk- or pk-',
          token: `${token.substring(0, 10)}...`,
          details: {
            tokenLength: token.length,
            tokenPreview: `${token.substring(0, 8)}...${token.substring(token.length - 4)}`,
            hasCorrectPrefix: false
          }
        };
      }

      return {
        success: true,
        message: 'VAPI configuration looks good',
        token: `${token.substring(0, 8)}...${token.substring(token.length - 4)}`,
        details: {
          tokenLength: token.length,
          tokenPreview: `${token.substring(0, 8)}...${token.substring(token.length - 4)}`,
          hasCorrectPrefix: true
        }
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Configuration test failed'
      };
    }
  },

  /**
   * Get diagnostics information
   */
  getDiagnostics() {
    const configTest = this.testConfig();
    
    return {
      configuration: configTest,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasToken: !!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN,
        hasWorkflowId: !!process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID
      },
      browserSupport: typeof window !== 'undefined' ? {
        webRTC: !!(window as any).RTCPeerConnection,
        webAudio: !!(window as any).AudioContext || !!(window as any).webkitAudioContext,
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      } : null,
      vapiInstance: {
        initialized: vapiInstance !== null,
        ready: vapiUtils.isReady()
      }
    };
  }
};

// Enhanced event handlers for the Agent component
export const setupVapiEventHandlers = (onMessage?: (message: any) => void, onError?: (error: Error) => void) => {
  if (!vapiInstance) {
    console.warn('⚠️ Cannot setup event handlers: VAPI not initialized');
    return;
  }

  if (onMessage) {
    vapiInstance.on('message', onMessage);
  }

  if (onError) {
    vapiInstance.on('error', onError);
  }

  // Return cleanup function
  return () => {
    if (vapiInstance) {
      if (onMessage) {
        vapiInstance.off('message', onMessage);
      }
      if (onError) {
        vapiInstance.off('error', onError);
      }
    }
  };
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      vapiUtils.stopCall();
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  });
}

// Export default for easier imports
export default vapiInstance;