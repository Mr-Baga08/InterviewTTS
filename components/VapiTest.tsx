// components/VapiTest.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { vapi, vapiUtils } from "@/lib/vapi.sdk";

const VapiTest = () => {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [callStatus, setCallStatus] = useState<string>("inactive");

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setTestLogs([]);
  };

  const testBasicConnection = async () => {
    setIsTestRunning(true);
    addLog("🔍 Testing basic VAPI connection...");

    try {
      if (!vapiUtils.isReady()) {
        addLog("❌ VAPI is not ready - check your token configuration");
        return;
      }

      addLog("✅ VAPI SDK is ready");
      
      const config = vapiUtils.getConfig();
      addLog(`📋 Token: ${config.token || 'Not found'}`);
      addLog(`🌐 Base URL: ${config.baseUrl || 'Default'}`);
      
      addLog("✅ Basic connection test completed");
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsTestRunning(false);
    }
  };

  const testVoiceCall = async () => {
    setIsTestRunning(true);
    addLog("📞 Testing voice call functionality...");

    try {
      if (!vapi) {
        addLog("❌ VAPI instance not available");
        return;
      }

      // Set up event listeners
      const onCallStart = () => {
        addLog("✅ Call started successfully");
        setCallStatus("active");
      };

      const onCallEnd = () => {
        addLog("📞 Call ended");
        setCallStatus("ended");
      };

      const onError = (error: any) => {
        addLog(`❌ Call error: ${error.message}`);
        setCallStatus("error");
      };

      const onMessage = (message: any) => {
        addLog(`💬 Message: ${message.type} - ${JSON.stringify(message).substring(0, 100)}...`);
      };

      // Add event listeners
      vapi.on('call-start', onCallStart);
      vapi.on('call-end', onCallEnd);
      vapi.on('error', onError);
      vapi.on('message', onMessage);

      addLog("🎯 Starting test call...");
      setCallStatus("connecting");

      // Test with a simple assistant configuration
      const testAssistant = {
        name: "Test Assistant",
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a test assistant. Say 'Hello, this is a test call' and then end the call."
            }
          ]
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM"
        }
      };

      await vapiUtils.startCall(testAssistant);
      
      // Auto-stop the call after 5 seconds for testing
      setTimeout(() => {
        if (callStatus === "active") {
          addLog("⏱️ Auto-stopping test call after 5 seconds");
          vapiUtils.stopCall();
        }
      }, 5000);

      // Cleanup listeners after test
      setTimeout(() => {
        vapi.off('call-start', onCallStart);
        vapi.off('call-end', onCallEnd);
        vapi.off('error', onError);
        vapi.off('message', onMessage);
      }, 10000);

    } catch (error: any) {
      addLog(`❌ Call test failed: ${error.message}`);
      setCallStatus("error");
    } finally {
      setIsTestRunning(false);
    }
  };

  const stopCall = () => {
    try {
      vapiUtils.stopCall();
      addLog("🛑 Manually stopped call");
      setCallStatus("stopped");
    } catch (error: any) {
      addLog(`❌ Error stopping call: ${error.message}`);
    }
  };

  return (
    <div className="apple-glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">VAPI Function Tests</h3>
        <div className="flex gap-2">
          <Button 
            onClick={clearLogs}
            variant="outline"
            size="sm"
            className="text-white/70 border-white/20"
          >
            Clear Logs
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Test Controls */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={testBasicConnection}
            disabled={isTestRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Test Connection
          </Button>
          
          <Button 
            onClick={testVoiceCall}
            disabled={isTestRunning || callStatus === "active"}
            className="bg-green-600 hover:bg-green-700"
          >
            Test Voice Call
          </Button>
          
          {(callStatus === "active" || callStatus === "connecting") && (
            <Button 
              onClick={stopCall}
              className="bg-red-600 hover:bg-red-700"
            >
              Stop Call
            </Button>
          )}
        </div>

        {/* Call Status */}
        <div className="bg-black/20 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <span className="text-white/70">Call Status:</span>
            <span className={`font-medium ${
              callStatus === "active" ? "text-green-400" :
              callStatus === "connecting" ? "text-yellow-400" :
              callStatus === "error" ? "text-red-400" :
              "text-white/60"
            }`}>
              {callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
            </span>
            {callStatus === "active" && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
        </div>

        {/* Test Logs */}
        <div className="bg-black/20 rounded-xl p-4">
          <h4 className="font-medium text-white mb-3">Test Logs</h4>
          <div className="bg-black/30 rounded-lg p-3 max-h-64 overflow-y-auto">
            {testLogs.length === 0 ? (
              <div className="text-white/50 text-sm text-center py-4">
                No logs yet. Run a test to see output.
              </div>
            ) : (
              <div className="space-y-1">
                {testLogs.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-white/80">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Environment Info */}
        <div className="bg-black/20 rounded-xl p-4">
          <h4 className="font-medium text-white mb-2">Environment Info</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">VAPI Ready:</span>
              <span className={vapiUtils.isReady() ? "text-green-400" : "text-red-400"}>
                {vapiUtils.isReady() ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Secure Context:</span>
              <span className={window.isSecureContext ? "text-green-400" : "text-red-400"}>
                {window.isSecureContext ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">WebRTC:</span>
              <span className={!!window.RTCPeerConnection ? "text-green-400" : "text-red-400"}>
                {!!window.RTCPeerConnection ? "✅ Supported" : "❌ Not Supported"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">User Media:</span>
              <span className={!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? "text-green-400" : "text-red-400"}>
                {!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? "✅ Supported" : "❌ Not Supported"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VapiTest;