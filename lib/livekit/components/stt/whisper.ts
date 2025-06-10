// lib/livekit/components/stt/whisper.ts - OpenAI Whisper STT Component
import { STTComponent } from '@/types/livekit';
import { PROVIDER_CONFIGS } from '@/lib/livekit/config';

export class WhisperSTTComponent implements STTComponent {
  private isActive = false;
  private audioBuffer: Float32Array[] = [];
  private transcriptCallback?: (text: string, isFinal: boolean) => void;
  private processingInterval?: NodeJS.Timeout;
  private lastProcessTime = 0;
  private readonly PROCESS_INTERVAL = 2000; // Process every 2 seconds
  private readonly MIN_AUDIO_LENGTH = 1; // Minimum 1 second of audio

  constructor(
    private config = PROVIDER_CONFIGS.stt.whisper
  ) {}

  async start(): Promise<void> {
    if (this.isActive) return;
    
    console.log('🎤 Starting Whisper STT...');
    this.isActive = true;
    this.audioBuffer = [];
    
    // Start periodic processing
    this.processingInterval = setInterval(
      () => this.processAudioBuffer(),
      this.PROCESS_INTERVAL
    );
  }

  async stop(): Promise<void> {
    if (!this.isActive) return;
    
    console.log('🛑 Stopping Whisper STT...');
    this.isActive = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    // Process any remaining audio
    await this.processAudioBuffer(true);
    this.audioBuffer = [];
  }

  onAudioData(data: Float32Array): void {
    if (!this.isActive) return;
    
    // Store audio data for batch processing
    this.audioBuffer.push(new Float32Array(data));
  }

  onTranscript(callback: (text: string, isFinal: boolean) => void): void {
    this.transcriptCallback = callback;
  }

  private async processAudioBuffer(isFinal = false): Promise<void> {
    if (!this.transcriptCallback || this.audioBuffer.length === 0) return;
    
    const now = Date.now();
    const timeSinceLastProcess = now - this.lastProcessTime;
    
    // Don't process too frequently unless it's final
    if (!isFinal && timeSinceLastProcess < this.PROCESS_INTERVAL) return;
    
    try {
      // Concatenate audio buffers
      const totalLength = this.audioBuffer.reduce((sum, buffer) => sum + buffer.length, 0);
      const combinedBuffer = new Float32Array(totalLength);
      
      let offset = 0;
      for (const buffer of this.audioBuffer) {
        combinedBuffer.set(buffer, offset);
        offset += buffer.length;
      }
      
      // Check if we have enough audio (minimum duration)
      const durationSeconds = combinedBuffer.length / 16000; // Assuming 16kHz
      if (durationSeconds < this.MIN_AUDIO_LENGTH && !isFinal) return;
      
      // Convert to WAV blob
      const audioBlob = this.float32ToWav(combinedBuffer, 16000);
      
      // Send to Whisper API
      const transcript = await this.transcribeAudio(audioBlob);
      
      if (transcript.trim()) {
        // Send partial transcript
        this.transcriptCallback(transcript, false);
        
        if (isFinal) {
          // Send final transcript
          this.transcriptCallback(transcript, true);
        }
      }
      
      // Clear processed buffer (keep some overlap for continuous recognition)
      if (!isFinal) {
        const overlapFrames = Math.floor(combinedBuffer.length * 0.2); // 20% overlap
        this.audioBuffer = [combinedBuffer.slice(-overlapFrames)];
      }
      
      this.lastProcessTime = now;
      
    } catch (error) {
      console.error('❌ Whisper STT Error:', error);
    }
  }

  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', this.config.model);
    formData.append('temperature', this.config.temperature.toString());
    formData.append('language', 'en');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const transcript = await response.text();
    return transcript.trim();
  }

  private float32ToWav(buffer: Float32Array, sampleRate: number): Blob {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float32 to int16
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
}

// Alternative: Browser-based Whisper using transformers.js (for offline use)
export class LocalWhisperSTTComponent implements STTComponent {
  private worker?: Worker;
  private isActive = false;
  private transcriptCallback?: (text: string, isFinal: boolean) => void;

  async start(): Promise<void> {
    if (this.isActive) return;
    
    console.log('🎤 Starting Local Whisper STT...');
    
    // Initialize Web Worker for Whisper
    this.worker = new Worker('/workers/whisper-worker.js');
    
    this.worker.onmessage = (event) => {
      const { type, data } = event.data;
      
      if (type === 'transcript' && this.transcriptCallback) {
        this.transcriptCallback(data.text, data.isFinal);
      }
    };
    
    this.isActive = true;
  }

  async stop(): Promise<void> {
    if (!this.isActive) return;
    
    console.log('🛑 Stopping Local Whisper STT...');
    this.isActive = false;
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = undefined;
    }
  }

  onAudioData(data: Float32Array): void {
    if (!this.isActive || !this.worker) return;
    
    this.worker.postMessage({
      type: 'audio',
      data: data.buffer
    });
  }

  onTranscript(callback: (text: string, isFinal: boolean) => void): void {
    this.transcriptCallback = callback;
  }
}