// components/VapiTokenChecker.tsx
"use client";

import { useState, useEffect } from "react";
import { vapiDevUtils } from "@/lib/vapi.sdk";

const VapiTokenChecker = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    try {
      const result = vapiDevUtils.testConfig();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Test failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="apple-glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Token Validation</h3>
        <button
          onClick={runTest}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Retest'}
        </button>
      </div>

      {testResult ? (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border ${testResult.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-semibold">
                {testResult.success ? 'Token Valid' : 'Token Invalid'}
              </span>
            </div>
            <p className="text-sm">{testResult.message}</p>
          </div>

          {testResult.details && (
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Token Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Length:</span>
                  <span className="text-white ml-2">{testResult.details.tokenLength}</span>
                </div>
                <div>
                  <span className="text-white/60">Type:</span>
                  <span className={`ml-2 ${testResult.details.tokenType === 'public' ? 'text-green-400' : testResult.details.tokenType === 'private' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {testResult.details.tokenType}
                  </span>
                </div>
                <div>
                  <span className="text-white/60">Preview:</span>
                  <span className="text-white ml-2 font-mono text-xs">{testResult.details.tokenPreview}</span>
                </div>
                <div>
                  <span className="text-white/60">Format Valid:</span>
                  <span className={`ml-2 ${testResult.details.isValidFormat ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.details.isValidFormat ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!testResult.success && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="text-yellow-400 font-medium mb-2">Quick Fix</h4>
              <div className="text-sm text-white/80 space-y-1">
                <p>1. Go to <a href="https://dashboard.vapi.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">VAPI Dashboard</a></p>
                <p>2. Get your <strong>Public Key</strong> (starts with pk-...)</p>
                <p>3. Add to .env.local: <code className="bg-black/30 px-2 py-1 rounded">NEXT_PUBLIC_VAPI_WEB_TOKEN=pk-...</code></p>
                <p>4. Restart your development server</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-white/10 rounded-lg"></div>
          <div className="h-24 bg-white/10 rounded-lg"></div>
        </div>
      )}
    </div>
  );
};

// components/VapiTest.tsx
const VapiTest = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [connectivityTest, setConnectivityTest] = useState<any>(null);
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);

  const runDiagnostics = () => {
    const result = vapiDevUtils.getDiagnostics();
    setDiagnostics(result);
  };

  const testConnectivity = async () => {
    setIsTestingConnectivity(true);
    try {
      const result = await vapiDevUtils.testConnectivity();
      setConnectivityTest(result);
    } catch (error: any) {
      setConnectivityTest({
        success: false,
        message: error.message || 'Connectivity test failed'
      });
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Environment Check */}
      <div className="apple-glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Environment Check</h3>
          <button
            onClick={runDiagnostics}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>

        {diagnostics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Environment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Node ENV:</span>
                    <span className="text-white">{diagnostics.environment.nodeEnv}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Public Token:</span>
                    <span className={diagnostics.environment.hasPublicToken ? 'text-green-400' : 'text-red-400'}>
                      {diagnostics.environment.hasPublicToken ? 'Set' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Workflow ID:</span>
                    <span className={diagnostics.environment.hasWorkflowId ? 'text-green-400' : 'text-red-400'}>
                      {diagnostics.environment.hasWorkflowId ? 'Set' : 'Missing'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">VAPI Instance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Initialized:</span>
                    <span className={diagnostics.vapiInstance.initialized ? 'text-green-400' : 'text-red-400'}>
                      {diagnostics.vapiInstance.initialized ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Ready:</span>
                    <span className={diagnostics.vapiInstance.ready ? 'text-green-400' : 'text-red-400'}>
                      {diagnostics.vapiInstance.ready ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {diagnostics.browserSupport && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Browser Support</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">WebRTC:</span>
                    <span className={diagnostics.browserSupport.webRTC ? 'text-green-400' : 'text-red-400'}>
                      {diagnostics.browserSupport.webRTC ? 'Supported' : 'Not Supported'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Web Audio:</span>
                    <span className={diagnostics.browserSupport.webAudio ? 'text-green-400' : 'text-red-400'}>
                      {diagnostics.browserSupport.webAudio ? 'Supported' : 'Not Supported'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">User Media:</span>
                    <span className={diagnostics.browserSupport.getUserMedia ? 'text-green-400' : 'text-red-400'}>
                      {diagnostics.browserSupport.getUserMedia ? 'Supported' : 'Not Supported'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Secure Context:</span>
                    <span className={diagnostics.browserSupport.isSecureContext ? 'text-green-400' : 'text-red-400'}>
                      {diagnostics.browserSupport.isSecureContext ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-pulse">
            <div className="h-32 bg-white/10 rounded-lg"></div>
          </div>
        )}
      </div>

      {/* Connectivity Test */}
      <div className="apple-glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">API Connectivity</h3>
          <button
            onClick={testConnectivity}
            disabled={isTestingConnectivity}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isTestingConnectivity ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {connectivityTest ? (
          <div className={`p-4 rounded-lg border ${connectivityTest.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            <div className="flex items-center gap-2 mb-2">
              {connectivityTest.success ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-semibold">
                {connectivityTest.success ? 'Connection Success' : 'Connection Failed'}
              </span>
            </div>
            <p className="text-sm">{connectivityTest.message}</p>
            {connectivityTest.details && (
              <div className="mt-3 p-3 bg-black/20 rounded text-xs">
                <pre>{JSON.stringify(connectivityTest.details, null, 2)}</pre>
              </div>
            )}
          </div>
        ) : (
          <div className="text-white/60 text-center py-4">
            Click "Test Connection" to verify API access
          </div>
        )}
      </div>
    </div>
  );
};

export { VapiTokenChecker, VapiTest };