// components/VapiTokenChecker.tsx
"use client";

import { useState } from "react";

interface TokenCheckResult {
  valid: boolean;
  message: string;
  details?: any;
  token?: string;
}

const VapiTokenChecker = () => {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<TokenCheckResult | null>(null);

  const checkToken = async () => {
    setChecking(true);
    setResult(null);

    try {
      // Get token from environment
      const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
      
      if (!token) {
        setResult({
          valid: false,
          message: "No VAPI token found in environment variables",
        });
        return;
      }

      console.log('🔍 Checking VAPI token:', `${token.substring(0, 8)}...`);

      // Test the token by making a simple API call to VAPI
      const response = await fetch('https://api.vapi.ai/assistant', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 VAPI Response Status:', response.status);
      
      if (response.status === 401) {
        setResult({
          valid: false,
          message: "Token is invalid or expired",
          token: `${token.substring(0, 8)}...${token.substring(token.length - 4)}`,
          details: {
            status: response.status,
            statusText: response.statusText,
          }
        });
        return;
      }

      if (response.status === 403) {
        setResult({
          valid: false,
          message: "Token is valid but lacks permissions",
          token: `${token.substring(0, 8)}...${token.substring(token.length - 4)}`,
          details: {
            status: response.status,
            statusText: response.statusText,
          }
        });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setResult({
          valid: true,
          message: "Token is valid and working!",
          token: `${token.substring(0, 8)}...${token.substring(token.length - 4)}`,
          details: {
            status: response.status,
            assistantsCount: Array.isArray(data) ? data.length : 'N/A',
          }
        });
      } else {
        const errorData = await response.text();
        setResult({
          valid: false,
          message: `Unexpected response: ${response.status}`,
          token: `${token.substring(0, 8)}...${token.substring(token.length - 4)}`,
          details: {
            status: response.status,
            error: errorData,
          }
        });
      }

    } catch (error: any) {
      console.error('❌ Token check error:', error);
      setResult({
        valid: false,
        message: `Network error: ${error.message}`,
        details: {
          error: error.message,
        }
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="apple-glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              VAPI Token Validator
            </h2>
            <p className="text-white/60 text-sm">Check if your VAPI token is valid and working</p>
          </div>

          <button
            onClick={checkToken}
            disabled={checking}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
          >
            {checking ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Check Token
              </>
            )}
          </button>
        </div>

        {/* Environment Variables Check */}
        <div className="mb-6 p-4 bg-black/20 rounded-xl">
          <h3 className="font-medium text-white mb-3">Environment Variables</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">NEXT_PUBLIC_VAPI_WEB_TOKEN:</span>
              <span className={process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN ? 'text-green-400' : 'text-red-400'}>
                {process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN ? 
                  `${process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN.substring(0, 8)}...` : 
                  'Not set'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">NEXT_PUBLIC_VAPI_WORKFLOW_ID:</span>
              <span className={process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID ? 'text-green-400' : 'text-yellow-400'}>
                {process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID ? 
                  `${process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID.substring(0, 8)}...` : 
                  'Not set (Optional)'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className={`p-4 rounded-xl border ${
            result.valid 
              ? 'bg-green-500/20 border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.valid ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-medium">{result.valid ? 'Success' : 'Error'}</span>
            </div>
            
            <p className="mb-3">{result.message}</p>
            
            {result.token && (
              <p className="text-sm opacity-80 mb-2">Token: {result.token}</p>
            )}
            
            {result.details && (
              <div className="text-xs opacity-70 space-y-1">
                {Object.entries(result.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <h3 className="font-medium text-blue-400 mb-3">🔧 How to Fix Token Issues</h3>
          <div className="text-sm text-white/80 space-y-2">
            <p><strong>1. Get a valid token:</strong></p>
            <p className="ml-4">• Go to <a href="https://vapi.ai/dashboard/api-keys" target="_blank" className="text-blue-400 hover:underline">VAPI Dashboard → API Keys</a></p>
            <p className="ml-4">• Create a new token or copy an existing one</p>
            
            <p><strong>2. Add to your .env.local file:</strong></p>
            <div className="ml-4 p-2 bg-black/30 rounded font-mono text-xs">
              NEXT_PUBLIC_VAPI_WEB_TOKEN=sk-your-actual-token-here
            </div>
            
            <p><strong>3. Restart your development server:</strong></p>
            <div className="ml-4 p-2 bg-black/30 rounded font-mono text-xs">
              npm run dev
            </div>
            
            <p><strong>4. Click "Check Token" again</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VapiTokenChecker;