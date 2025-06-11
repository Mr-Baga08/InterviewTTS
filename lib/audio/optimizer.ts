// lib/audio/optimizer.ts - Audio optimization for better STT
export class AudioOptimizer {
    // Detect if audio contains speech
    static detectSpeech(audioBuffer: Float32Array, sampleRate: number = 16000): boolean {
      const rms = this.calculateRMS(audioBuffer);
      const zeroCrossingRate = this.calculateZeroCrossingRate(audioBuffer);
      
      // Thresholds for speech detection
      const RMS_THRESHOLD = 0.01;
      const ZCR_THRESHOLD = 0.1;
      
      return rms > RMS_THRESHOLD && zeroCrossingRate > ZCR_THRESHOLD;
    }
  
    // Calculate Root Mean Square (energy level)
    static calculateRMS(audioBuffer: Float32Array): number {
      let sum = 0;
      for (let i = 0; i < audioBuffer.length; i++) {
        sum += audioBuffer[i] * audioBuffer[i];
      }
      return Math.sqrt(sum / audioBuffer.length);
    }
  
    // Calculate Zero Crossing Rate (speech indicator)
    static calculateZeroCrossingRate(audioBuffer: Float32Array): number {
      let crossings = 0;
      for (let i = 1; i < audioBuffer.length; i++) {
        if ((audioBuffer[i] >= 0) !== (audioBuffer[i - 1] >= 0)) {
          crossings++;
        }
      }
      return crossings / audioBuffer.length;
    }
  
    // Remove silence from audio
    static trimSilence(audioBuffer: Float32Array, threshold: number = 0.01): Float32Array {
      let start = 0;
      let end = audioBuffer.length - 1;
  
      // Find start of speech
      while (start < audioBuffer.length && Math.abs(audioBuffer[start]) < threshold) {
        start++;
      }
  
      // Find end of speech
      while (end > start && Math.abs(audioBuffer[end]) < threshold) {
        end--;
      }
  
      return audioBuffer.slice(start, end + 1);
    }
  
    // Normalize audio levels
    static normalize(audioBuffer: Float32Array): Float32Array {
      const maxAmplitude = Math.max(...audioBuffer.map(Math.abs));
      if (maxAmplitude === 0) return audioBuffer;
  
      const normalizedBuffer = new Float32Array(audioBuffer.length);
      const factor = 0.8 / maxAmplitude; // Keep some headroom
  
      for (let i = 0; i < audioBuffer.length; i++) {
        normalizedBuffer[i] = audioBuffer[i] * factor;
      }
  
      return normalizedBuffer;
    }
  
    // Convert different audio formats to optimal format for STT
    static async optimizeAudioBlob(audioBlob: Blob): Promise<{
      optimizedBlob: Blob;
      containsSpeech: boolean;
      optimizations: {
        originalSize: number;
        optimizedSize: number;
        speechDetected: boolean;
        processingTime: number;
      };
    }> {
      const startTime = Date.now();
  
      try {
        // For server-side processing, we'll do basic optimization
        const arrayBuffer = await audioBlob.arrayBuffer();
        const originalSize = arrayBuffer.byteLength;
  
        // Basic validation - check if audio is not empty
        if (originalSize < 1000) { // Less than 1KB is likely too short
          throw new Error('Audio file too small - please record for at least 1 second');
        }
  
        // For now, return the original blob with some metadata
        // In a full implementation, you'd decode the audio and apply optimizations
        const optimizedBlob = audioBlob;
        const optimizedSize = originalSize;
  
        return {
          optimizedBlob,
          containsSpeech: true, // Assume speech for now
          optimizations: {
            originalSize,
            optimizedSize,
            speechDetected: true,
            processingTime: Date.now() - startTime
          }
        };
      } catch (error) {
        throw new Error(`Audio optimization failed: ${error}`);
      }
    }
  
    // Convert Float32Array to WAV blob (for client-side use)
    static float32ToWav(buffer: Float32Array, sampleRate: number): Blob {
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
  
    // Validate audio format and size
    static validateAudio(audioBlob: Blob): { isValid: boolean; error?: string } {
      // Check file size (max 25MB for Whisper)
      if (audioBlob.size > 25 * 1024 * 1024) {
        return { isValid: false, error: 'Audio file too large. Maximum size is 25MB.' };
      }
  
      // Check minimum size
      if (audioBlob.size < 1000) {
        return { isValid: false, error: 'Audio file too small. Please record for at least 1 second.' };
      }
  
      // Check file type
      const validTypes = ['audio/wav', 'audio/mp3', 'audio/webm', 'audio/m4a', 'audio/flac'];
      if (!validTypes.some(type => audioBlob.type.includes(type.split('/')[1]))) {
        return { isValid: false, error: 'Unsupported audio format. Please use WAV, MP3, WebM, M4A, or FLAC.' };
      }
  
      return { isValid: true };
    }
  }