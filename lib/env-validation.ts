// lib/env-validation.ts - Fixed Environment Variable Validation
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface APICheckResults {
  openai: ValidationResult;
  deepgram: ValidationResult;
  elevenlabs: ValidationResult;
  livekit: ValidationResult;
  firebase: ValidationResult;
}

interface SecurityRecommendation {
  level: 'error' | 'warning' | 'info';
  message: string;
  fix: string;
}

// ============================================================================
// ENVIRONMENT VALIDATION SCHEMAS
// ============================================================================

const envSchema = z.object({
  // Core APIs
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
  DEEPGRAM_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  
  // LiveKit Configuration
  NEXT_PUBLIC_LIVEKIT_URL: z.string().url("Invalid LiveKit URL"),
  LIVEKIT_API_KEY: z.string().min(1, "LiveKit API key is required"),
  LIVEKIT_API_SECRET: z.string().min(1, "LiveKit API secret is required"),
  
  // Firebase Configuration
  FIREBASE_PROJECT_ID: z.string().min(1, "Firebase project ID is required"),
  FIREBASE_CLIENT_EMAIL: z.string().email("Invalid Firebase client email"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "Firebase private key is required"),
  
  // Voice Pipeline Settings
  VAD_THRESHOLD: z.string().transform(Number).pipe(z.number().min(0).max(1)).optional(),
  SILENCE_TIMEOUT: z.string().transform(Number).pipe(z.number().min(500)).optional(),
  MAX_RECORDING_TIME: z.string().transform(Number).pipe(z.number().min(5000)).optional(),
  
  // Timeouts
  STT_TIMEOUT: z.string().transform(Number).pipe(z.number().min(5000)).optional(),
  LLM_TIMEOUT: z.string().transform(Number).pipe(z.number().min(3000)).optional(),
  TTS_TIMEOUT: z.string().transform(Number).pipe(z.number().min(5000)).optional(),
  
  // Rate Limiting
  STT_RATE_LIMIT_WHISPER: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  STT_RATE_LIMIT_DEEPGRAM: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  
  // Security
  NEXTAUTH_SECRET: z.string().min(32, "NextAuth secret must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url("Invalid NextAuth URL"),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  NEXT_PUBLIC_DEBUG: z.string().transform(val => val === 'true').optional(),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env);
    console.log('✅ Environment validation passed');
    return { success: true, env };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      return { success: false, errors: error.errors };
    }
    throw error;
  }
}

export async function checkAPIKeys(): Promise<APICheckResults> {
  const [openai, deepgram, elevenlabs] = await Promise.all([
    checkOpenAIKey(),
    checkDeepgramKey(), 
    checkElevenLabsKey()
  ]);

  return {
    openai,
    deepgram,
    elevenlabs,
    livekit: checkLiveKitConfig(),
    firebase: checkFirebaseConfig(),
  };
}

async function checkOpenAIKey(): Promise<ValidationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { valid: false, error: 'API key not found' };
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    } else if (response.status === 429) {
      return { valid: false, error: 'Rate limited - key is valid but quota exceeded' };
    } else {
      return { valid: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { valid: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

async function checkDeepgramKey(): Promise<ValidationResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) return { valid: false, error: 'API key not found (optional)' };
  
  try {
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      headers: { 'Authorization': `Token ${apiKey}` }
    });
    
    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    } else {
      return { valid: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { valid: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

async function checkElevenLabsKey(): Promise<ValidationResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return { valid: false, error: 'API key not found (optional)' };
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey }
    });
    
    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    } else {
      return { valid: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { valid: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

function checkLiveKitConfig(): ValidationResult {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  
  if (!url) return { valid: false, error: 'LiveKit URL not found' };
  if (!apiKey) return { valid: false, error: 'LiveKit API key not found' };
  if (!apiSecret) return { valid: false, error: 'LiveKit API secret not found' };
  
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid LiveKit URL format' };
  }
}

function checkFirebaseConfig(): ValidationResult {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (!projectId) return { valid: false, error: 'Project ID not found' };
  if (!clientEmail) return { valid: false, error: 'Client email not found' };
  if (!privateKey) return { valid: false, error: 'Private key not found' };
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clientEmail)) {
    return { valid: false, error: 'Invalid client email format' };
  }
  
  // Validate private key format
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    return { valid: false, error: 'Invalid private key format' };
  }
  
  return { valid: true };
}

// ============================================================================
// SECURITY RECOMMENDATIONS
// ============================================================================

export function getSecurityRecommendations(): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];
  
  // Check for insecure practices
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      recommendations.push({
        level: 'error',
        message: 'Debug mode is enabled in production',
        fix: 'Set NEXT_PUBLIC_DEBUG=false in production'
      });
    }
    
    if (process.env.NEXT_PUBLIC_SHOW_DEBUG_PANEL === 'true') {
      recommendations.push({
        level: 'error',
        message: 'Debug panel is enabled in production',
        fix: 'Set NEXT_PUBLIC_SHOW_DEBUG_PANEL=false in production'
      });
    }
  }
  
  // Check NextAuth secret strength
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.length < 64) {
    recommendations.push({
      level: 'warning',
      message: 'NextAuth secret is short',
      fix: 'Use a longer, more secure secret (64+ characters)'
    });
  }
  
  // Check for default/weak values
  if (process.env.NEXTAUTH_SECRET === 'your-secret-here') {
    recommendations.push({
      level: 'error',
      message: 'Using default NextAuth secret',
      fix: 'Generate a secure random secret'
    });
  }

  // Check for missing optional but recommended keys
  if (!process.env.DEEPGRAM_API_KEY) {
    recommendations.push({
      level: 'info',
      message: 'Deepgram API key not configured',
      fix: 'Add DEEPGRAM_API_KEY for STT fallback support'
    });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    recommendations.push({
      level: 'info',
      message: 'ElevenLabs API key not configured',
      fix: 'Add ELEVENLABS_API_KEY for premium TTS quality'
    });
  }
  
  return recommendations;
}

// ============================================================================
// ENVIRONMENT SETUP CHECKER
// ============================================================================

export async function runEnvironmentCheck(): Promise<boolean> {
  console.log('🔍 Running environment check...\n');
  
  // 1. Validate environment variables
  const validation = validateEnvironment();
  if (!validation.success) {
    console.log('❌ Environment validation failed');
    return false;
  }
  
  // 2. Check API keys
  console.log('🔑 Checking API keys...');
  try {
    const apiChecks = await checkAPIKeys();
    
    Object.entries(apiChecks).forEach(([service, result]) => {
      const icon = result.valid ? '✅' : '❌';
      const status = result.valid ? 'Valid' : `Invalid: ${result.error}`;
      console.log(`  ${icon} ${service}: ${status}`);
    });
  } catch (error) {
    console.error('❌ Error checking API keys:', error);
    return false;
  }
  
  // 3. Security recommendations
  console.log('\n🔒 Security check...');
  const recommendations = getSecurityRecommendations();
  
  if (recommendations.length === 0) {
    console.log('  ✅ No security issues found');
  } else {
    recommendations.forEach(rec => {
      const icon = rec.level === 'error' ? '🚨' : rec.level === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`  ${icon} ${rec.message}`);
      console.log(`     Fix: ${rec.fix}`);
    });
  }
  
  // 4. Voice pipeline specific checks
  console.log('\n🎤 Voice pipeline configuration...');
  
  const vadThreshold = Number(process.env.VAD_THRESHOLD || 0.01);
  if (vadThreshold < 0.005 || vadThreshold > 0.1) {
    console.log('  ⚠️ VAD threshold may be suboptimal');
    console.log('     Recommended: 0.01-0.03 for most environments');
  } else {
    console.log('  ✅ VAD threshold looks good');
  }
  
  const silenceTimeout = Number(process.env.SILENCE_TIMEOUT || 2000);
  if (silenceTimeout < 1000 || silenceTimeout > 5000) {
    console.log('  ⚠️ Silence timeout may be suboptimal');
    console.log('     Recommended: 1500-3000ms for natural conversation');
  } else {
    console.log('  ✅ Silence timeout looks good');
  }
  
  console.log('\n✅ Environment check complete!');
  return true;
}

// ============================================================================
// UTILITY: Generate secure values
// ============================================================================

export function generateSecureValues() {
  const crypto = require('crypto');
  
  return {
    nextAuthSecret: crypto.randomBytes(64).toString('hex'),
    webhookSecret: crypto.randomBytes(32).toString('hex'),
    sessionSecret: crypto.randomBytes(32).toString('hex'),
  };
}

// ============================================================================
// UTILITY: Environment checker for Next.js startup
// ============================================================================

export function createEnvChecker() {
  return async function checkEnvironmentOnStartup() {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(60));
      console.log('🔧 DEVELOPMENT ENVIRONMENT CHECK');
      console.log('='.repeat(60));
      
      const isValid = await runEnvironmentCheck();
      
      if (!isValid) {
        console.log('\n🚨 Environment check failed! Please fix the issues above.');
        console.log('📖 See documentation for setup instructions.');
      }
      
      console.log('='.repeat(60) + '\n');
    }
  };
}

// ============================================================================
// EXPORT TYPES FOR EXTERNAL USE
// ============================================================================

export type { ValidationResult, APICheckResults, SecurityRecommendation };