"use client";

import { useState } from 'react';

export default function VoiceTest() {
  const [status, setStatus] = useState('Ready to test');

  const testPipeline = async () => {
    setStatus('Testing...');
    
    try {
      // Test API endpoints
      const tokenResponse = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomName: 'test-room', 
          participantName: 'test-user' 
        })
      });
      
      if (tokenResponse.ok) {
        setStatus('✅ LiveKit API working');
      } else {
        setStatus('❌ LiveKit API failed');
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Voice Pipeline Test</h1>
      <button 
        onClick={testPipeline}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Pipeline
      </button>
      <p className="mt-4">{status}</p>
    </div>
  );
}