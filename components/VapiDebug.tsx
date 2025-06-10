// components/VapiDebug.tsx - Enhanced debugging component
"use client";

import { useState } from "react";
import { vapiDevUtils } from "@/lib/vapi.sdk";

interface TestResult {
  configTest: any;
  diagnostics: any;
  connectivityTest?: any;
  timestamp: string;
  error?: string;
}

const VapiDebug = () => {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testConnectivity, setTestConnectivity] = useState(false);

  const runFullTest = async () => {
    setIsLoading(true);
    
    try {
      console.log('🧪 Running comprehensive VAPI test...');
      
      // Test configuration
      const configTest = vapiDevUtils.testConfig();
      const diagnostics = vapiDevUtils.getDiagnostics();
      
      let connectivityTest;
      if (testConnectivity) {
        console.log('🌐 Testing API connectivity...');
        connectivityTest = await vapiDevUtils.testConnectivity();
      }
      
      const result: TestResult = {
        configTest,
        diagnostics,
        connectivityTest,
        timestamp: new Date().toISOString()
      };
      
      setTestResult(result);
      
      console.log('✅ VAPI comprehensive test completed:', result);
      
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Test Header */}
      <div className="apple-glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              VAPI Debug Console
            </h2>
            <p className="text-white/60 text-sm">
              Comprehensive testing and debugging for your VAPI configuration
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={testConnectivity}
                onChange={(e) => setTestConnectivity(e.target.checked)}
                className="rounded"
              />
              Test API Connectivity
            </label>
            
            <button
              onClick={runFullTest}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-600/50 disabled:to-indigo-600/50 text-white rounded-xl transition-all duration-300 font-medium"
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
                  Run Full Test
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="space-y-6">
          {/* Configuration Test Result */}
          <div className="apple-glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuration Test
            </h3>
            
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${getStatusColor(testResult.configTest.success)}`}>
              {getStatusIcon(testResult.configTest.success)}
              <div>
                <h4 className="font-medium">Token Validation</h4>
                <p className="text-sm opacity-80">{testResult.configTest.message}</p>
              </div>
            </div>

            {/* Configuration Details */}
            {testResult.configTest.details && (
              <div className="mt-4 p-4 bg-black/20 rounded-xl">
                <h5 className="text-sm font-medium text-white/80 mb-3">Token Details:</h5>
                <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
                  <div>
                    <span className="font-medium">Length:</span> {testResult.configTest.details.tokenLength}
                  </div>
                  <div>
                    <span className="font-medium">Preview:</span> {testResult.configTest.details.tokenPreview}
                  </div>
                  <div>
                    <span className="font-medium">Correct Prefix:</span> 
                    <span className={testResult.configTest.details.hasCorrectPrefix ? 'text-green-400' : 'text-red-400'}>
                      {testResult.configTest.details.hasCorrectPrefix ? ' ✅ Yes' : ' ❌ No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Valid Format:</span>
                    <span className={testResult.configTest.details.isValidFormat ? 'text-green-400' : 'text-red-400'}>
                      {testResult.configTest.details.isValidFormat ? ' ✅ Yes' : ' ❌ No'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Environment Information */}
          {testResult.diagnostics && (
            <div className="apple-glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                </svg>
                Environment Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">Node Environment:</span>
                    <span className="text-white font-mono">{testResult.diagnostics.environment.nodeEnv}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">Base URL:</span>
                    <span className="text-white font-mono text-xs">{testResult.diagnostics.environment.baseUrl}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">VAPI Token:</span>
                    <span className={testResult.diagnostics.environment.hasToken ? 'text-green-400' : 'text-red-400'}>
                      {testResult.diagnostics.environment.hasToken ? '✅ Set' : '❌ Missing'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">Workflow ID:</span>
                    <span className={testResult.diagnostics.environment.hasWorkflowId ? 'text-green-400' : 'text-yellow-400'}>
                      {testResult.diagnostics.environment.hasWorkflowId ? '✅ Set' : '⚠️ Optional'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Connectivity Test */}
          {testResult.connectivityTest && (
            <div className="apple-glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                API Connectivity Test
              </h3>
              
              <div className={`flex items-center gap-3 p-4 rounded-xl border ${getStatusColor(testResult.connectivityTest.success)}`}>
                {getStatusIcon(testResult.connectivityTest.success)}
                <div>
                  <h4 className="font-medium">API Connection</h4>
                  <p className="text-sm opacity-80">{testResult.connectivityTest.message}</p>
                </div>
              </div>

              {testResult.connectivityTest.details && (
                <div className="mt-4 p-4 bg-black/20 rounded-xl">
                  <h5 className="text-sm font-medium text-white/80 mb-2">Response Details:</h5>
                  <pre className="text-xs text-white/60 overflow-auto">
                    {JSON.stringify(testResult.connectivityTest.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Browser Support */}
          {testResult.diagnostics?.browserSupport && (
            <div className="apple-glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Browser Support
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">getUserMedia:</span>
                    <span className={testResult.diagnostics.browserSupport.getUserMedia ? 'text-green-400' : 'text-red-400'}>
                      {testResult.diagnostics.browserSupport.getUserMedia ? '✅ Supported' : '❌ Not Supported'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">Secure Context:</span>
                    <span className={testResult.diagnostics.browserSupport.isSecureContext ? 'text-green-400' : 'text-yellow-400'}>
                      {testResult.diagnostics.browserSupport.isSecureContext ? '✅ HTTPS' : '⚠️ HTTP'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VAPI Instance Status */}
          {testResult.diagnostics?.vapiInstance && (
            <div className="apple-glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                VAPI Instance Status
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Initialized:</span>
                  <span className={testResult.diagnostics.vapiInstance.initialized ? 'text-green-400' : 'text-red-400'}>
                    {testResult.diagnostics.vapiInstance.initialized ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Ready:</span>
                  <span className={testResult.diagnostics.vapiInstance.ready ? 'text-green-400' : 'text-red-400'}>
                    {testResult.diagnostics.vapiInstance.ready ? '✅ Yes' : '❌ No'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Event Listeners:</span>
                  <span className={testResult.diagnostics.vapiInstance.hasEventListeners ? 'text-green-400' : 'text-yellow-400'}>
                    {testResult.diagnostics.vapiInstance.hasEventListeners ? '✅ Active' : '⚠️ None'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Details */}
          {testResult.error && (
            <div className="apple-glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Error Details
              </h3>
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <code className="text-sm text-red-300 block whitespace-pre-wrap">{testResult.error}</code>
              </div>
            </div>
          )}

          {/* Troubleshooting Guide */}
          {!testResult.configTest.success && (
            <div className="apple-glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                💡 Troubleshooting Guide
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <h4 className="font-medium text-blue-400 mb-2">Step 1: Set your VAPI token</h4>
                  <p className="text-sm text-white/80 mb-3">Add your VAPI token to <code className="bg-black/30 px-1 rounded">.env.local</code>:</p>
                  <div className="p-3 bg-black/30 rounded-lg font-mono text-xs text-green-400">
                    NEXT_PUBLIC_VAPI_WEB_TOKEN=sk-your-actual-token-here
                  </div>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <h4 className="font-medium text-purple-400 mb-2">Step 2: Get your token</h4>
                  <p className="text-sm text-white/80">Get your token from the <a href="https://vapi.ai/dashboard/api-keys" target="_blank" className="text-blue-400 hover:underline">VAPI Dashboard</a></p>
                </div>

                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <h4 className="font-medium text-green-400 mb-2">Step 3: Restart and test</h4>
                  <ol className="text-sm text-white/80 space-y-1 list-decimal list-inside">
                    <li>Restart your development server</li>
                    <li>Click "Run Full Test" again</li>
                    <li>Check that the token starts with "sk-" or "pk-"</li>
                    <li>Verify the token is not expired</li>
                  </ol>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <h4 className="font-medium text-yellow-400 mb-2">Common Issues:</h4>
                  <ul className="text-sm text-white/80 space-y-1 list-disc list-inside">
                    <li>Missing "NEXT_PUBLIC_" prefix in environment variable name</li>
                    <li>Token contains extra spaces or newlines</li>
                    <li>Using wrong token type (need Web SDK token, not API token)</li>
                    <li>Token expired or revoked</li>
                    <li>Development server not restarted after adding token</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Success Guide */}
          {testResult.configTest.success && (
            <div className="apple-glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                🎉 Configuration Successful!
              </h3>
              
              <div className="space-y-4">
                <p className="text-white/80">Your VAPI configuration is working correctly. You can now:</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <h4 className="font-medium text-green-400 mb-2">✅ Start Voice Calls</h4>
                    <p className="text-sm text-white/70">Use the Agent component to start AI-powered voice interviews</p>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <h4 className="font-medium text-blue-400 mb-2">🎤 Real-time Transcription</h4>
                    <p className="text-sm text-white/70">Voice conversations will be transcribed in real-time</p>
                  </div>

                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <h4 className="font-medium text-purple-400 mb-2">🤖 AI Interviews</h4>
                    <p className="text-sm text-white/70">Generate personalized interview questions and conduct practice sessions</p>
                  </div>

                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                    <h4 className="font-medium text-indigo-400 mb-2">📊 Detailed Feedback</h4>
                    <p className="text-sm text-white/70">Get comprehensive analysis and improvement suggestions</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VapiDebug;