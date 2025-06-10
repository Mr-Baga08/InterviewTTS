// components/VapiTokenChecker.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { vapiDevUtils } from "@/lib/vapi.sdk";

const VapiTokenChecker = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const diagnostics = vapiDevUtils.getDiagnostics();
      const connectivityTest = await vapiDevUtils.testConnectivity();
      
      setTestResult({
        ...diagnostics,
        connectivity: connectivityTest
      });
    } catch (error: any) {
      setTestResult({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="apple-glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">VAPI Token & Configuration</h3>
        <Button 
          onClick={runDiagnostics}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Testing..." : "Run Diagnostics"}
        </Button>
      </div>

      {testResult && (
        <div className="space-y-4">
          <div className="bg-black/20 rounded-xl p-4">
            <h4 className="font-medium text-white mb-2">Configuration Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Token Valid:</span>
                <span className={testResult.configuration?.success ? "text-green-400" : "text-red-400"}>
                  {testResult.configuration?.success ? "✅ Yes" : "❌ No"}
                </span>
              </div>
              {testResult.configuration?.token && (
                <div className="flex justify-between">
                  <span className="text-white/70">Token Preview:</span>
                  <span className="text-white/80 font-mono text-xs">
                    {testResult.configuration.token}
                  </span>
                </div>
              )}
              {testResult.configuration?.details && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="flex justify-between">
                    <span className="text-white/70">Length:</span>
                    <span className="text-white/80">{testResult.configuration.details.tokenLength}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Format:</span>
                    <span className={testResult.configuration.details.isValidFormat ? "text-green-400" : "text-red-400"}>
                      {testResult.configuration.details.isValidFormat ? "Valid" : "Invalid"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-black/20 rounded-xl p-4">
            <h4 className="font-medium text-white mb-2">Environment Check</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Node Env:</span>
                <span className="text-white/80">{testResult.environment?.nodeEnv}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Has Token:</span>
                <span className={testResult.environment?.hasToken ? "text-green-400" : "text-red-400"}>
                  {testResult.environment?.hasToken ? "✅ Yes" : "❌ No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Has Workflow ID:</span>
                <span className={testResult.environment?.hasWorkflowId ? "text-green-400" : "text-red-400"}>
                  {testResult.environment?.hasWorkflowId ? "✅ Yes" : "❌ No"}
                </span>
              </div>
            </div>
          </div>

          {testResult.browserSupport && (
            <div className="bg-black/20 rounded-xl p-4">
              <h4 className="font-medium text-white mb-2">Browser Support</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">WebRTC:</span>
                  <span className={testResult.browserSupport.webRTC ? "text-green-400" : "text-red-400"}>
                    {testResult.browserSupport.webRTC ? "✅ Supported" : "❌ Not Supported"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Web Audio:</span>
                  <span className={testResult.browserSupport.webAudio ? "text-green-400" : "text-red-400"}>
                    {testResult.browserSupport.webAudio ? "✅ Supported" : "❌ Not Supported"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">User Media:</span>
                  <span className={testResult.browserSupport.getUserMedia ? "text-green-400" : "text-red-400"}>
                    {testResult.browserSupport.getUserMedia ? "✅ Supported" : "❌ Not Supported"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Secure Context:</span>
                  <span className={testResult.browserSupport.isSecureContext ? "text-green-400" : "text-red-400"}>
                    {testResult.browserSupport.isSecureContext ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-black/20 rounded-xl p-4">
            <h4 className="font-medium text-white mb-2">VAPI Instance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Initialized:</span>
                <span className={testResult.vapiInstance?.initialized ? "text-green-400" : "text-red-400"}>
                  {testResult.vapiInstance?.initialized ? "✅ Yes" : "❌ No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Ready:</span>
                <span className={testResult.vapiInstance?.ready ? "text-green-400" : "text-red-400"}>
                  {testResult.vapiInstance?.ready ? "✅ Yes" : "❌ No"}
                </span>
              </div>
            </div>
          </div>

          {testResult.connectivity && (
            <div className="bg-black/20 rounded-xl p-4">
              <h4 className="font-medium text-white mb-2">Connectivity Test</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">API Connection:</span>
                  <span className={testResult.connectivity.success ? "text-green-400" : "text-red-400"}>
                    {testResult.connectivity.success ? "✅ Connected" : "❌ Failed"}
                  </span>
                </div>
                <div className="text-white/70 text-xs">
                  {testResult.connectivity.message}
                </div>
              </div>
            </div>
          )}

          {testResult.error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
              <h4 className="font-medium text-red-400 mb-2">Error</h4>
              <pre className="text-red-300 text-xs whitespace-pre-wrap">
                {testResult.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VapiTokenChecker;