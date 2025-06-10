"use client";

import { useState } from 'react';

export default function VoiceTestComponent() {
  const [isRecording, setIsRecording] = useState(false);

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        alert('✅ Microphone test successful!');
      }, 3000);
      
    } catch (error) {
      alert(`❌ Microphone error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Voice Test</h3>
      <button 
        onClick={testMicrophone}
        disabled={isRecording}
        className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
      >
        {isRecording ? 'Recording...' : 'Test Microphone'}
      </button>
    </div>
  );
}