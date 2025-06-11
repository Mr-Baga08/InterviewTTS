"use client";

import { useState } from 'react';

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export default function VoiceTest() {
  const [status, setStatus] = useState('Ready to test');
  const [isLoading, setIsLoading] = useState(false);

  const testPipeline = async () => {
    setStatus('Testing...');
    setIsLoading(true);
    
    try {
      // Test LiveKit Token API
      const tokenResponse = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: 'test-room',
          participantName: 'test-user'
        })
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`LiveKit API failed: ${tokenResponse.status} - ${errorText}`);
      }
      
      const tokenData = await tokenResponse.json();
      console.log('Token response:', tokenData);
      
      // Test Voice Pipeline API
      setStatus('✅ LiveKit API working. Testing Voice Pipeline...');
      
      const pipelineResponse = await fetch('/api/voice/pipeline', {
        method: 'GET'
      });
      
      if (!pipelineResponse.ok) {
        throw new Error(`Voice Pipeline API failed: ${pipelineResponse.status}`);
      }
      
      const pipelineData = await pipelineResponse.json();
      console.log('Pipeline response:', pipelineData);
      
      // Test Agent API
      setStatus('✅ Voice Pipeline working. Testing Agent API...');
      
      const agentResponse = await fetch('/api/livekit/agent', {
        method: 'GET'
      });
      
      if (!agentResponse.ok) {
        throw new Error(`Agent API failed: ${agentResponse.status}`);
      }
      
      const agentData = await agentResponse.json();
      console.log('Agent response:', agentData);
      
      setStatus('✅ All APIs working! Pipeline is ready.');
      
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Pipeline test error:', error);
      setStatus(`❌ Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSTT = async () => {
    setStatus('Testing STT...');
    setIsLoading(true);
    
    try {
      // Create a simple audio blob for testing (silent audio)
      const audioContext = new AudioContext();
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 1, audioContext.sampleRate);
      
      // Convert to base64 for API
      const arrayBuffer = new ArrayBuffer(1024);
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const response = await fetch('/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stt',
          audio: base64Audio,
          format: 'webm',
          language: 'en'
        })
      });
      
      if (!response.ok) {
        throw new Error(`STT API failed: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data.success ? '✅ STT API working' : '❌ STT API returned error');
      
    } catch (error: unknown) {
      setStatus(`❌ STT Error: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLLM = async () => {
    setStatus('Testing LLM...');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'llm',
          message: 'Hello, this is a test message.',
          context: []
        })
      });
      
      if (!response.ok) {
        throw new Error(`LLM API failed: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data.success ? '✅ LLM API working' : '❌ LLM API returned error');
      
    } catch (error: unknown) {
      setStatus(`❌ LLM Error: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testTTS = async () => {
    setStatus('Testing TTS...');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tts',
          text: 'Hello, this is a test message.',
          voice: 'nova',
          provider: 'openai'
        })
      });
      
      if (!response.ok) {
        throw new Error(`TTS API failed: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data.success ? '✅ TTS API working' : '❌ TTS API returned error');
      
    } catch (error: unknown) {
      setStatus(`❌ TTS Error: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFullPipeline = async () => {
    setStatus('Testing full pipeline...');
    setIsLoading(true);
    
    try {
      // Create test audio data
      const arrayBuffer = new ArrayBuffer(1024);
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const response = await fetch('/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pipeline',
          audio: base64Audio,
          format: 'webm',
          language: 'en',
          context: [],
          interviewConfig: {
            type: 'technical',
            questions: ['Tell me about yourself.'],
            currentIndex: 0
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Full pipeline failed: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data.success ? '✅ Full pipeline working!' : '❌ Full pipeline returned error');
      
    } catch (error: unknown) {
      setStatus(`❌ Pipeline Error: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Voice Pipeline Test Suite</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Status</h2>
        <p className={`${status.includes('✅') ? 'text-green-600' : status.includes('❌') ? 'text-red-600' : 'text-blue-600'}`}>
          {status}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testPipeline}
          disabled={isLoading}
          className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Testing...' : 'Test All APIs'}
        </button>
        
        <button
          onClick={testSTT}
          disabled={isLoading}
          className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Test STT Only
        </button>
        
        <button
          onClick={testLLM}
          disabled={isLoading}
          className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Test LLM Only
        </button>
        
        <button
          onClick={testTTS}
          disabled={isLoading}
          className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Test TTS Only
        </button>
        
        <button
          onClick={testFullPipeline}
          disabled={isLoading}
          className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Test Full Pipeline
        </button>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Environment Check</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Make sure LIVEKIT_API_KEY is set</li>
          <li>• Make sure LIVEKIT_API_SECRET is set</li>
          <li>• Make sure LIVEKIT_URL is set</li>
          <li>• Make sure OPENAI_API_KEY is set</li>
          <li>• Check browser console for detailed errors</li>
        </ul>
      </div>
    </div>
  );
}