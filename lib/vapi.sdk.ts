// lib/vapi.sdk.ts - FIXED VERSION with Enhanced Authentication
import Vapi from "@vapi-ai/web";

interface VapiConfig {
  token: string;
  baseUrl: string;
  debug: boolean;
}

interface ConfigTestResult {
  success: boolean;
  message: string;
  token?: string;
  details?: {
    tokenLength: number;
    tokenPreview: string;
    hasCorrectPrefix: boolean;
    isValidFormat: boolean;
    tokenType: 'public' | 'private' | 'unknown';
  };
}

// Enhanced token validation with better error detection
function validateVapiToken(token: string): { 
  valid: boolean; 
  reason?: string; 
  tokenType?: 'public' | 'private' | 'unknown' 
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Token is empty or not a string' };
  }

  if (token.length < 20) {
    return { valid: false, reason: 'Token is too short (should be at least 20 characters)' };
  }

  // Determine token type
  let tokenType: 'public' | 'private' | 'unknown' = 'unknown';
  if (token.startsWith('pk-')) {
    tokenType = 'public';
  } else if (token.startsWith('sk-')) {
    tokenType = 'private';
  } else {
    return { valid: false, reason: 'Token should start with "pk-" (public) or "sk-" (private)' };
  }

  // For web SDK, we need public key (pk-) not secret key (sk-)
  if (tokenType === 'private') {
    return { 
      valid: false, 
      reason: 'Web SDK requires a public token (pk-), not a private token (sk-). Check your environment variables.',
      tokenType 
    };
  }

  // Basic format check
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
    return { valid: false, reason: 'Token contains invalid characters', tokenType };
  }

  return { valid: true, tokenType };
}

// Get VAPI token with enhanced validation
function getVapiToken(): { token: string | null; error?: string; tokenType?: string } {
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
        return { token, tokenType: validation.tokenType };
      } else {
        console.error(`❌ Token validation failed for ${envName}:`, validation.reason);
        return { 
          token: null, 
          error: `Invalid token in ${envName}: ${validation.reason}`,
          tokenType: validation.tokenType 
        };
      }
    } else {
      console.log(`❌ ${envName}: Not set`);
    }
  }

  return { 
    token: null, 
    error: 'No VAPI token found. Please set NEXT_PUBLIC_VAPI_WEB_TOKEN with a PUBLIC key (pk-...) in your .env.local file.' 
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
    
    // Create VAPI instance with enhanced configuration
    const vapiInstance = new Vapi(config.token, {
      // Add explicit configuration for better debugging
      apiUrl: config.baseUrl,
    });

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
            error.status === 401 ||
            error.message?.includes('Missing Authorization Header')) {
          console.error('🔐 AUTHENTICATION ERROR - TROUBLESHOOTING:');
          console.error('   1. Your token type:', config.token.startsWith('pk-') ? 'Public Key ✅' : 'Private Key ❌');
          console.error('   2. Current token preview:', `${config.token.substring(0, 8)}...`);
          console.error('   3. Token length:', config.token.length);
          console.error('   4. SOLUTION: Make sure you\'re using a PUBLIC key (pk-...) not a PRIVATE key (sk-...)');
          console.error('   5. Check your VAPI dashboard at https://dashboard.vapi.ai/');
        }

        if (error.message?.includes('Assistant not found') || error.statusCode === 404) {
          console.error('🤖 ASSISTANT/WORKFLOW ERROR:');
          console.error('   - The assistant or workflow ID might be incorrect');
          console.error('   - Check your NEXT_PUBLIC_VAPI_WORKFLOW_ID in .env.local');
        }
      });

      vapiInstance.on('message', (message: any) => {
        if (message.type === 'transcript') {
          console.log('📨 Transcript:', message.transcript);
        } else {
          console.log('📨 VAPI Message:', message.type, message);
        }
      });

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
    console.error('💡 Troubleshooting checklist:');
    console.error('   1. Set NEXT_PUBLIC_VAPI_WEB_TOKEN in .env.local');
    console.error('   2. Use a PUBLIC key (pk-...) NOT a private key (sk-...)');
    console.error('   3. Get your public key from https://dashboard.vapi.ai/');
    console.error('   4. Ensure token is not expired');
    console.error('   5. Verify you have the correct permissions');
    return null;
  }
}

// Create the VAPI instance
const vapiInstance = createVapiInstance();

// Export the VAPI instance
export const vapi = vapiInstance;

// Enhanced utility functions
export const vapiUtils = {
  isReady(): boolean {
    return vapiInstance !== null;
  },

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
      
      // Enhanced error messages
      if (error.message?.includes('Unauthorized') || 
          error.statusCode === 401 ||
          error.status === 401) {
        throw new Error('🔐 Authentication failed. You need a PUBLIC key (pk-...) for the web SDK. Check your .env.local file and make sure NEXT_PUBLIC_VAPI_WEB_TOKEN contains a public key from https://dashboard.vapi.ai/');
      }
      
      if (error.message?.includes('Not Found') || 
          error.statusCode === 404 || 
          error.status === 404) {
        throw new Error('🤖 Assistant or workflow not found. Please check your assistant ID or workflow ID.');
      }

      if (error.message?.includes('Rate Limit') || 
          error.statusCode === 429 || 
          error.status === 429) {
        throw new Error('⏰ Rate limit exceeded. Please wait a moment before trying again.');
      }
      
      throw new Error(`VAPI call failed: ${error.message}`);
    }
  },

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
  testConfig(): ConfigTestResult {
    try {
      const { token, error, tokenType } = getVapiToken();
      
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
            hasCorrectPrefix: token.startsWith('pk-') || token.startsWith('sk-'),
            isValidFormat: /^[a-zA-Z0-9_-]+$/.test(token),
            tokenType: validation.tokenType || 'unknown'
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
          isValidFormat: true,
          tokenType: validation.tokenType || 'unknown'
        }
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Configuration test failed'
      };
    }
  },

  getDiagnostics() {
    const configTest = this.testConfig();
    
    return {
      configuration: configTest,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasPublicToken: !!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN,
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
        ready: vapiUtils.isReady()
      }
    };
  },

  async testConnectivity(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const config = createConfig();
      
      // Test basic API connectivity with correct authentication
      const response = await fetch(`${config.baseUrl}/assistant`, {
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
          details: { 
            status: response.status, 
            response: errorData,
            suggestion: response.status === 401 ? 'Check if you\'re using a public key (pk-...) for web SDK' : 'Check your token permissions'
          }
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

// Export setup function for Agent component
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
      if (vapiInstance) {
        vapiUtils.stopCall();
      }
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  });
}

export default vapiInstance;