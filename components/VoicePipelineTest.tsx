// components/VoicePipelineTest.tsx - Testing Component
"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TestResult {
  service: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
  duration?: number;
}

const VoicePipelineTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (service: string, updates: Partial<TestResult>) => {
    setResults(prev => {
      const index = prev.findIndex(r => r.service === service);
      if (index >= 0) {
        const newResults = [...prev];
        newResults[index] = { ...newResults[index], ...updates };
        return newResults;
      } else {
        return [...prev, { service, status: 'pending', message: '', ...updates }];
      }
    });
  };

  const testMicrophone = async (): Promise<void> => {
    const startTime = Date.now();
    updateResult('microphone', { status: 'pending', message: 'Testing microphone access...' });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Test audio levels
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      // Clean up
      stream.getTracks().forEach(track => track.stop());
      await audioContext.close();

      const duration = Date.now() - startTime;
      updateResult('microphone', {
        status: 'success',
        message: 'Microphone access granted and functioning',
        duration
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateResult('microphone', {
        status: 'error',
        message: `Microphone test failed: ${error.message}`,
        duration
      });
    }
  };

  const testSTT = async (): Promise<void> => {
    const startTime = Date.now();
    updateResult('stt', { status: 'pending', message: 'Testing speech-to-text API...' });

    try {
      // Create a test audio blob (silence)
      const audioContext = new AudioContext();
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
      
      // Convert to WAV
      const wav = audioBufferToWav(buffer);
      const audioBase64 = arrayBufferToBase64(wav);

      const response = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: audioBase64,
          format: 'wav',
          language: 'en'
        }),
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok && result.success) {
        updateResult('stt', {
          status: 'success',
          message: 'STT API is responding correctly',
          data: result,
          duration
        });
      } else {
        updateResult('stt', {
          status: 'error',
          message: `STT API error: ${result.error || response.statusText}`,
          duration
        });
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateResult('stt', {
        status: 'error',
        message: `STT test failed: ${error.message}`,
        duration
      });
    }
  };

  const testLLM = async (): Promise<void> => {
    const startTime = Date.now();
    updateResult('llm', { status: 'pending', message: 'Testing language model API...' });

    try {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello, this is a test message',
          context: [],
          interviewType: 'technical',
          questions: ['What is your experience with React?'],
          currentQuestionIndex: 0
        }),
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok && result.success) {
        updateResult('llm', {
          status: 'success',
          message: 'LLM API is responding correctly',
          data: { response: result.response?.substring(0, 100) + '...', tokens: result.metadata?.tokens },
          duration
        });
      } else {
        updateResult('llm', {
          status: 'error',
          message: `LLM API error: ${result.error || response.statusText}`,
          duration
        });
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateResult('llm', {
        status: 'error',
        message: `LLM test failed: ${error.message}`,
        duration
      });
    }
  };

  const testTTS = async (): Promise<void> => {
    const startTime = Date.now();
    updateResult('tts', { status: 'pending', message: 'Testing text-to-speech API...' });

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello, this is a test of the text to speech system.',
          voice: 'nova',
          provider: 'openai',
          format: 'mp3'
        }),
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok && result.success) {
        // Test audio playback
        try {
          const audioBuffer = Uint8Array.from(atob(result.audio), c => c.charCodeAt(0));
          const audioBlob = new Blob([audioBuffer], { type: `audio/${result.format}` });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const audio = new Audio(audioUrl);
          await audio.play();
          
          setTimeout(() => {
            URL.revokeObjectURL(audioUrl);
          }, 5000);

          updateResult('tts', {
            status: 'success',
            message: 'TTS API working and audio playing',
            data: { 
              duration: result.duration, 
              size: result.metadata?.size,
              provider: result.metadata?.provider 
            },
            duration
          });
        } catch (playError) {
          updateResult('tts', {
            status: 'success',
            message: 'TTS API working but audio playback failed (check browser permissions)',
            data: result.metadata,
            duration
          });
        }
      } else {
        updateResult('tts', {
          status: 'error',
          message: `TTS API error: ${result.error || response.statusText}`,
          duration
        });
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateResult('tts', {
        status: 'error',
        message: `TTS test failed: ${error.message}`,
        duration
      });
    }
  };

  const testFullPipeline = async (): Promise<void> => {
    const startTime = Date.now();
    updateResult('pipeline', { status: 'pending', message: 'Testing full voice pipeline...' });

    try {
      // Step 1: Record 3 seconds of audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      const recordingPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          resolve(audioBlob);
        };
      });

      updateResult('pipeline', { status: 'pending', message: 'Recording audio for 3 seconds...' });
      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
      }, 3000);

      const audioBlob = await recordingPromise;
      
      // Step 2: Convert to base64 and send to STT
      updateResult('pipeline', { status: 'pending', message: 'Converting speech to text...' });
      const audioBuffer = await audioBlob.arrayBuffer();
      const audioBase64 = arrayBufferToBase64(audioBuffer);

      const sttResponse = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: audioBase64,
          format: 'webm',
          language: 'en'
        }),
      });

      const sttResult = await sttResponse.json();
      if (!sttResult.success) {
        throw new Error(`STT failed: ${sttResult.error}`);
      }

      const transcript = sttResult.transcript || 'No speech detected';

      // Step 3: Send to LLM
      updateResult('pipeline', { status: 'pending', message: 'Generating AI response...' });
      const llmResponse = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcript,
          context: [],
          interviewType: 'technical'
        }),
      });

      const llmResult = await llmResponse.json();
      if (!llmResult.success) {
        throw new Error(`LLM failed: ${llmResult.error}`);
      }

      // Step 4: Convert response to speech
      updateResult('pipeline', { status: 'pending', message: 'Converting response to speech...' });
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: llmResult.response,
          voice: 'nova',
          provider: 'openai'
        }),
      });

      const ttsResult = await ttsResponse.json();
      if (!ttsResult.success) {
        throw new Error(`TTS failed: ${ttsResult.error}`);
      }

      // Step 5: Play response
      updateResult('pipeline', { status: 'pending', message: 'Playing AI response...' });
      const responseAudioBuffer = Uint8Array.from(atob(ttsResult.audio), c => c.charCodeAt(0));
      const responseAudioBlob = new Blob([responseAudioBuffer], { type: `audio/${ttsResult.format}` });
      const responseAudioUrl = URL.createObjectURL(responseAudioBlob);
      
      const audio = new Audio(responseAudioUrl);
      await audio.play();

      const duration = Date.now() - startTime;
      updateResult('pipeline', {
        status: 'success',
        message: 'Full pipeline test completed successfully!',
        data: {
          transcript,
          response: llmResult.response?.substring(0, 100) + '...',
          totalDuration: `${(duration / 1000).toFixed(1)}s`
        },
        duration
      });

      setTimeout(() => {
        URL.revokeObjectURL(responseAudioUrl);
      }, 10000);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateResult('pipeline', {
        status: 'error',
        message: `Pipeline test failed: ${error.message}`,
        duration
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      await testMicrophone();
      await testSTT();
      await testLLM();
      await testTTS();
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runFullPipelineTest = async () => {
    setIsRunning(true);
    await testFullPipeline();
    setIsRunning(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="voice-pipeline-test">
      <div className="apple-glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Voice Pipeline Testing</h3>
          <div className="flex gap-2">
            <button
              onClick={clearResults}
              disabled={isRunning}
              className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Test Controls */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className={cn(
              'flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all duration-300',
              isRunning 
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
            )}
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Test Individual APIs</span>
              </>
            )}
          </button>

          <button
            onClick={runFullPipelineTest}
            disabled={isRunning}
            className={cn(
              'flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all duration-300',
              isRunning 
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105'
            )}
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Testing Pipeline...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Test Full Pipeline</span>
              </>
            )}
          </button>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.service}
                className={cn(
                  'p-4 rounded-xl border transition-all duration-300',
                  result.status === 'success' && 'bg-green-500/10 border-green-500/30',
                  result.status === 'error' && 'bg-red-500/10 border-red-500/30',
                  result.status === 'pending' && 'bg-yellow-500/10 border-yellow-500/30'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.status === 'success' && (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {result.status === 'error' && (
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {result.status === 'pending' && (
                      <div className="w-5 h-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                    )}
                    <span className="font-medium text-white capitalize">{result.service}</span>
                  </div>
                  
                  {result.duration && (
                    <span className="text-sm text-white/60">{result.duration}ms</span>
                  )}
                </div>
                
                <p className={cn(
                  'text-sm',
                  result.status === 'success' && 'text-green-300',
                  result.status === 'error' && 'text-red-300',
                  result.status === 'pending' && 'text-yellow-300'
                )}>
                  {result.message}
                </p>
                
                {result.data && (
                  <div className="mt-2 p-2 bg-black/30 rounded text-xs text-white/80">
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <h4 className="font-medium text-white mb-2">Testing Instructions:</h4>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• <strong>Individual APIs:</strong> Tests each service (STT, LLM, TTS) separately</li>
            <li>• <strong>Full Pipeline:</strong> Records your voice → STT → LLM → TTS → Playback</li>
            <li>• Make sure to allow microphone access when prompted</li>
            <li>• For full pipeline test, speak clearly for 3 seconds when recording starts</li>
            <li>• Check browser console for detailed error logs if tests fail</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Utility functions
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);

  // Convert audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default VoicePipelineTest;