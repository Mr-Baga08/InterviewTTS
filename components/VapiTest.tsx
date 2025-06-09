// components/VapiTest.tsx - Updated for type-safe VAPI SDK
"use client";

import { useState } from "react";
import { vapiDevUtils } from "@/lib/vapi.sdk";

interface TestResult {
  configTest: {
    success: boolean;
    message: string;
    token?: string;
    details?: {
      tokenLength: number;
      tokenPreview: string;
      hasCorrectPrefix: boolean;
    };
  };
  diagnostics: any;
  timestamp: string;
  error?: string;
}

const VapiTest = () => {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = () => {
    setIsLoading(true);
    
    try {
      console.log('🧪 Running VAPI configuration test...');
      
      // Test configuration
      const configTest = vapiDevUtils.testConfig();
      const diagnostics = vapiDevUtils.getDiagnostics();
      
      const result: TestResult = {
        configTest,
        diagnostics,
        timestamp: new Date().toISOString()
      };
      
      setTestResult(result);
      
      console.log('✅ VAPI test completed:', result);
      
    } catch (error: any) {
      console.error('❌ VAPI test failed:', error);
      setTestResult({
        configTest: {
          success: false,
          message: error.message || 'Test failed'
        },
        diagnostics: null,
        timestamp: new Date().toISOString(),
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (success: boolean) => {
    return success 
      ? "text-green-400 bg-green-500/20 border-green-500/30" 
      : "text-red-400 bg-red-500/20 border-red-500/30";
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Test Header */}
      <div className="apple-glass rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              VAPI Configuration Test
            </h2>
            <p className="text-white/60 text-sm">
              Test your VAPI token and configuration
            </p>
          </div>

          <button
            onClick={runTest}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Run Test
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="space-y-4">
          {/* Configuration Test Result */}
          <div className="apple-glass rounded-2xl p-6">
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${getStatusColor(testResult.configTest.success)}`}>
              {getStatusIcon(testResult.configTest.success)}
              <div>
                <h3 className="font-medium">Configuration Test</h3>
                <p className="text-sm opacity-80">{testResult.configTest.message}</p>
              </div>
            </div>

            {/* Configuration Details */}
            {testResult.configTest.details && (
              <div className="mt-4 p-4 bg-black/20 rounded-xl">
                <h4 className="text-sm font-medium text-white/80 mb-2">Details:</h4>
                <div className="space-y-1 text-sm text-white/60">
                  <div>Token Length: {testResult.configTest.details.tokenLength}</div>
                  <div>Token Preview: {testResult.configTest.details.tokenPreview}</div>
                  <div>Correct Prefix: {testResult.configTest.details.hasCorrectPrefix ? '✅' : '❌'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Environment Information */}
          {testResult.diagnostics && (
            <div className="apple-glass rounded-2xl p-6">
              <h3 className="font-medium text-white mb-4">Environment Information</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Node Environment:</span>
                  <span className="text-white font-mono">{testResult.diagnostics.environment.nodeEnv}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">VAPI Token Present:</span>
                  <span className={testResult.diagnostics.environment.hasToken ? 'text-green-400' : 'text-red-400'}>
                    {testResult.diagnostics.environment.hasToken ? '✅ Yes' : '❌ No'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Workflow ID Present:</span>
                  <span className={testResult.diagnostics.environment.hasWorkflowId ? 'text-green-400' : 'text-yellow-400'}>
                    {testResult.diagnostics.environment.hasWorkflowId ? '✅ Yes' : '⚠️ No (Optional)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Browser Support */}
          {testResult.diagnostics?.browserSupport && (
            <div className="apple-glass rounded-2xl p-6">
              <h3 className="font-medium text-white mb-4">Browser Support</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">WebRTC:</span>
                  <span className={testResult.diagnostics.browserSupport.webRTC ? 'text-green-400' : 'text-red-400'}>
                    {testResult.diagnostics.browserSupport.webRTC ? '✅ Supported' : '❌ Not Supported'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Web Audio:</span>
                  <span className={testResult.diagnostics.browserSupport.webAudio ? 'text-green-400' : 'text-red-400'}>
                    {testResult.diagnostics.browserSupport.webAudio ? '✅ Supported' : '❌ Not Supported'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">getUserMedia:</span>
                  <span className={testResult.diagnostics.browserSupport.getUserMedia ? 'text-green-400' : 'text-red-400'}>
                    {testResult.diagnostics.browserSupport.getUserMedia ? '✅ Supported' : '❌ Not Supported'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Details */}
          {testResult.error && (
            <div className="apple-glass rounded-2xl p-6">
              <h3 className="font-medium text-red-400 mb-4">Error Details</h3>
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <code className="text-sm text-red-300">{testResult.error}</code>
              </div>
            </div>
          )}

          {/* Quick Fix Guide */}
          {!testResult.configTest.success && (
            <div className="apple-glass rounded-2xl p-6">
              <h3 className="font-medium text-blue-400 mb-4">💡 Quick Fix</h3>
              <div className="space-y-3 text-sm text-white/80">
                <p>1. Add your VAPI token to <code className="bg-black/30 px-1 rounded">.env.local</code>:</p>
                <div className="p-3 bg-black/30 rounded-lg font-mono text-xs">
                  NEXT_PUBLIC_VAPI_WEB_TOKEN=sk-your-actual-token-here
                </div>
                <p>2. Get your token from: <a href="https://vapi.ai/dashboard/api-keys" target="_blank" className="text-blue-400 hover:underline">VAPI Dashboard</a></p>
                <p>3. Restart your development server</p>
                <p>4. Click "Run Test" again</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VapiTest;