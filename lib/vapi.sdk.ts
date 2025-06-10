// lib/vapi.sdk.ts - FIXED VERSION with Better Auth Handling
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
    isValidFormat: boolean;
  };
}

// Enhanced token validation
function validateVapiToken(token: string): { valid: boolean; reason?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Token is empty or not a string' };
  }

  if (token.length < 20) {
    return { valid: false, reason: 'Token is too short (should be at least 20 characters)' };
  }

  if (!token.startsWith('sk-') && !token.startsWith('pk-')) {
    return { valid: false, reason: 'Token should start with "sk-" or "pk-"' };
  }

  // Basic format check (should contain only valid characters)
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
    return { valid: false, reason: 'Token contains invalid characters' };
  }

  return { valid: true };
}

// Get VAPI token with enhanced validation
function getVapiToken(): { token: string | null; error?: string } {
  const possibleTokens = [
    process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN,
    process.env.NEXT_PUBLIC_VAPI_TOKEN,
    process.env.VAPI_TOKEN,
    process.env.VAPI_WEB_TOKEN,
  ];

  console.log('🔍 Checking for VAPI tokens...');
  
  // Find the first valid token
  for (let i = 0; i < possibleTokens.length; i++) {
    const token = possibleTokens[i];
    const envName = ['NEXT_PUBLIC_VAPI_WEB_TOKEN', 'NEXT_PUBLIC_VAPI_TOKEN', 'VAPI_TOKEN', 'VAPI_WEB_TOKEN'][i];
    
    if (token) {
      console.log(`✅ Found token in ${envName}:`, `${token.substring(0, 8)}...`);
      
      const validation = validateVapiToken(token);
      if (validation.valid) {
        console.log('✅ Token validation passed');
        return { token };
      } else {
        console.warn(`⚠️ Token validation failed for ${envName}:`, validation.reason);
        return { token: null, error: `Invalid token in ${envName}: ${validation.reason}` };
      }
    } else {
      console.log(`❌ ${envName}: Not set`);
    }
  }

  return { 
    token: null, 
    error: 'No VAPI token found in environment variables. Please set NEXT_PUBLIC_VAPI_WEB_TOKEN in your .env.local file.' 
  };
}

// Create configuration with enhanced error handling
function createConfig(): VapiConfig {
  const { token, error } = getVapiToken();
  
  if (!token) {
    throw new Error(error || 'VAPI token not found');
  }

  return {
    token,
    baseUrl: process.env.NEXT_PUBLIC_VAPI_BASE_URL || "https://api.vapi.ai",
    debug: process.env.NODE_ENV === 'development'
  };
}

// Initialize VAPI instance with better error handling
function createVapiInstance(): Vapi | null {
  try {
    const config = createConfig();
    
    console.log('🚀 Initializing VAPI SDK...');
    console.log('📍 Base URL:', config.baseUrl);
    console.log('🔑 Token preview:', `${config.token.substring(0, 12)}...${config.token.substring(config.token.length - 4)}`);
    
    // Create VAPI instance with enhanced error handling
    const vapiInstance = new Vapi(config.token);

    // Enhanced event listeners for debugging
    if (config.debug) {
      vapiInstance.on('call-start', () => {
        console.log('📞 VAPI call started successfully');
      });

      vapiInstance.on('call-end', () => {
        console.log('📞 VAPI call ended');
      });

      vapiInstance.on('error', (error: any) => {
        console.error('❌ VAPI error details:', {
          message: error.message,
          status: error.status,
          statusCode: error.statusCode,
          response: error.response,
          stack: error.stack
        });
        
        // Enhanced auth error detection
        if (error.message?.includes('Unauthorized') || 
            error.message?.includes('401') ||
            error.statusCode === 401 ||
            error.message?.includes('Missing Authorization Header')) {
          console.error('🔐 AUTHENTICATION ERROR DETAILS:');
          console.error('   - Current token preview:', `${config.token.substring(0, 8)}...`);
          console.error('   - Token length:', config.token.length);
          console.error('   - Token starts with:', config.token.substring(0, 3));
          console.error('   - Suggestion: Check if your token is valid and not expired');
        }
      });

      vapiInstance.on('message', (message: any) => {
        if (message.type === 'transcript') {
          console.log('📨 Transcript:', message.transcript);
        } else {
          console.log('📨 VAPI Message:', message.type, message);
        }
      });

      // Additional event listeners for debugging
      vapiInstance.on('speech-start', () => {
        console.log('🎤 Speech started');
      });

      vapiInstance.on('speech-end', () => {
        console.log('🎤 Speech ended');
      });
    }

    console.log('✅ VAPI SDK initialized successfully');
    return vapiInstance;

  } catch (error: any) {
    console.error('❌ Failed to initialize VAPI SDK:', error.message);
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Check if NEXT_PUBLIC_VAPI_WEB_TOKEN is set in .env.local');
    console.error('   2. Ensure token starts with "sk-" or "pk-"');
    console.error('   3. Verify token is not expired');
    console.error('   4. Make sure you have the correct permissions');
    return null;
  }
}

// Create the VAPI instance (can be null if initialization fails)
const vapiInstance = createVapiInstance();

// Export the VAPI instance
export const vapi = vapiInstance;

// Enhanced utility functions
export const vapiUtils = {
  /**
   * Check if VAPI is ready
   */
  isReady(): boolean {
    return vapiInstance !== null;
  },

  /**
   * Start a call with enhanced error handling
   */
  async startCall(assistant: any, options?: { variableValues?: any }): Promise<void> {
    if (!vapiInstance) {
      throw new Error('VAPI not initialized. Please check your token configuration.');
    }

    try {
      console.log('📞 Starting VAPI call...');
      console.log('🤖 Assistant config:', typeof assistant === 'string' ? `Workflow ID: ${assistant}` : 'Custom assistant object');
      
      if (options?.variableValues) {
        console.log('📋 Variable values:', options.variableValues);
        await vapiInstance.start(assistant, { variableValues: options.variableValues });
      } else {
        await vapiInstance.start(assistant);
      }
      
      console.log('✅ VAPI call started successfully');
    } catch (error: any) {
      console.error('❌ Failed to start VAPI call:', {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
        response: error.response
      });
      
      // Enhanced error messages based on error type
      if (error.message?.includes('Unauthorized') || 
          error.statusCode === 401 ||
          error.message?.includes('Missing Authorization Header')) {
        throw new Error('🔐 Authentication failed. Your VAPI token is invalid, expired, or missing. Please check your .env.local file and ensure NEXT_PUBLIC_VAPI_WEB_TOKEN is correctly set.');
      }
      
      if (error.message?.includes('Not Found') || error.statusCode === 404) {
        throw new Error('🤖 Assistant or workflow not found. Please check your assistant ID or workflow ID.');
      }

      if (error.message?.includes('Rate Limit') || error.statusCode === 429) {
        throw new Error('⏰ Rate limit exceeded. Please wait a moment before trying again.');
      }
      
      throw new Error(`VAPI call failed: ${error.message}`);
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

// Enhanced development utilities
export const vapiDevUtils = {
  /**
   * Test VAPI configuration with detailed validation
   */
  testConfig(): ConfigTestResult {
    try {
      const { token, error } = getVapiToken();
      
      if (!token) {
        return {
          success: false,
          message: error || 'No VAPI token found'
        };
      }

      const validation = validateVapiToken(token);
      
      if (!validation.valid) {
        return {
          success: false,
          message: validation.reason || 'Token validation failed',
          token: `${token.substring(0, 8)}...`,
          details: {
            tokenLength: token.length,
            tokenPreview: `${token.substring(0, 8)}...${token.substring(token.length - 4)}`,
            hasCorrectPrefix: token.startsWith('sk-') || token.startsWith('pk-'),
            isValidFormat: /^[a-zA-Z0-9_-]+$/.test(token)
          }
        };
      }

      return {
        success: true,
        message: 'VAPI configuration is valid ✅',
        token: `${token.substring(0, 8)}...${token.substring(token.length - 4)}`,
        details: {
          tokenLength: token.length,
          tokenPreview: `${token.substring(0, 8)}...${token.substring(token.length - 4)}`,
          hasCorrectPrefix: true,
          isValidFormat: true
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
   * Get comprehensive diagnostics information
   */
  getDiagnostics() {
    const configTest = this.testConfig();
    
    return {
      configuration: configTest,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasToken: !!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN,
        hasWorkflowId: !!process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID,
        baseUrl: process.env.NEXT_PUBLIC_VAPI_BASE_URL || "https://api.vapi.ai"
      },
      browserSupport: typeof window !== 'undefined' ? {
        webRTC: !!(window as any).RTCPeerConnection,
        webAudio: !!(window as any).AudioContext || !!(window as any).webkitAudioContext,
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        isSecureContext: window.isSecureContext
      } : null,
      vapiInstance: {
        initialized: vapiInstance !== null,
        ready: vapiUtils.isReady(),
        hasEventListeners: vapiInstance ? Object.keys((vapiInstance as any)._events || {}).length > 0 : false
      }
    };
  },

  /**
   * Test API connectivity
   */
  async testConnectivity(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const config = createConfig();
      
      // Test basic API connectivity
      const response = await fetch(`${config.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'VAPI API connectivity test passed ✅'
        };
      } else {
        const errorData = await response.text();
        return {
          success: false,
          message: `API connectivity test failed: ${response.status} ${response.statusText}`,
          details: { status: response.status, response: errorData }
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Connectivity test failed: ${error.message}`,
        details: error
      };
    }
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

// Enhanced cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      if (vapiInstance) {
        vapiUtils.stopCall();
      }
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  });
}

// Export default for easier imports
export default vapiInstance;