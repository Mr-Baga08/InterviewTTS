// lib/audio/client-optimizer.ts - Browser-side audio optimization
export class ClientAudioOptimizer {
    // Optimize audio on the client before sending to server
    static async optimizeAudioForSTT(audioBlob: Blob): Promise<{
      optimizedBlob: Blob;
      metadata: {
        originalSize: number;
        optimizedSize: number;
        duration: number;
        sampleRate: number;
        containsSpeech: boolean;
      };
    }> {
      return new Promise((resolve, reject) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const fileReader = new FileReader();
  
        fileReader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const originalSize = arrayBuffer.byteLength;
            
            // Decode audio
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const duration = audioBuffer.duration;
            const sampleRate = audioBuffer.sampleRate;
  
            // Get channel data (convert to mono if stereo)
            let channelData: Float32Array;
            if (audioBuffer.numberOfChannels > 1) {
              channelData = this.stereoToMono(audioBuffer);
            } else {
              channelData = audioBuffer.getChannelData(0);
            }
  
            // Detect speech
            const containsSpeech = this.detectSpeech(channelData, sampleRate);
            
            if (!containsSpeech) {
              // Return original if no speech detected (let server handle the error)
              resolve({
                optimizedBlob: audioBlob,
                metadata: {
                  originalSize,
                  optimizedSize: originalSize,
                  duration,
                  sampleRate,
                  containsSpeech: false
                }
              });
              return;
            }
  
            // Optimize audio
            const trimmedData = this.trimSilence(channelData);
            const normalizedData = this.normalize(trimmedData);
            
            // Resample to 16kHz if needed (optimal for Whisper)
            let finalData = normalizedData;
            let finalSampleRate = sampleRate;
            
            if (sampleRate !== 16000) {
              finalData = this.resample(normalizedData, sampleRate, 16000);
              finalSampleRate = 16000;
            }
  
            // Convert back to blob
            const optimizedBlob = this.float32ToWav(finalData, finalSampleRate);
            
            resolve({
              optimizedBlob,
              metadata: {
                originalSize,
                optimizedSize: optimizedBlob.size,
                duration: finalData.length / finalSampleRate,
                sampleRate: finalSampleRate,
                containsSpeech: true
              }
            });
  
          } catch (error) {
            reject(new Error(`Audio optimization failed: ${error}`));
          }
        };
  
        fileReader.onerror = () => reject(new Error('Failed to read audio file'));
        fileReader.readAsArrayBuffer(audioBlob);
      });
    }
  
    // Detect speech in audio
    private static detectSpeech(audioBuffer: Float32Array, sampleRate: number): boolean {
      const rms = this.calculateRMS(audioBuffer);
      const zcr = this.calculateZeroCrossingRate(audioBuffer);
      
      // More lenient thresholds for speech detection
      const RMS_THRESHOLD = 0.005;
      const ZCR_MIN = 0.01;
      const ZCR_MAX = 0.5;
      
      return rms > RMS_THRESHOLD && zcr > ZCR_MIN && zcr < ZCR_MAX;
    }
  
    // Calculate RMS (Root Mean Square) - energy level
    private static calculateRMS(audioBuffer: Float32Array): number {
      let sum = 0;
      for (let i = 0; i < audioBuffer.length; i++) {
        sum += audioBuffer[i] * audioBuffer[i];
      }
      return Math.sqrt(sum / audioBuffer.length);
    }
  
    // Calculate Zero Crossing Rate - helps identify speech vs noise
    private static calculateZeroCrossingRate(audioBuffer: Float32Array): number {
      let crossings = 0;
      for (let i = 1; i < audioBuffer.length; i++) {
        if ((audioBuffer[i] >= 0) !== (audioBuffer[i - 1] >= 0)) {
          crossings++;
        }
      }
      return crossings / audioBuffer.length;
    }
  
    // Remove silence from beginning and end
    private static trimSilence(audioBuffer: Float32Array, threshold: number = 0.01): Float32Array {
      let start = 0;
      let end = audioBuffer.length - 1;
  
      // Find start of audio content
      while (start < audioBuffer.length && Math.abs(audioBuffer[start]) < threshold) {
        start++;
      }
  
      // Find end of audio content
      while (end > start && Math.abs(audioBuffer[end]) < threshold) {
        end--;
      }
  
      // Add small padding
      const padding = Math.floor(audioBuffer.length * 0.05); // 5% padding
      start = Math.max(0, start - padding);
      end = Math.min(audioBuffer.length - 1, end + padding);
  
      return audioBuffer.slice(start, end + 1);
    }
  
    // Normalize audio levels
    private static normalize(audioBuffer: Float32Array): Float32Array {
      const maxAmplitude = Math.max(...audioBuffer.map(Math.abs));
      if (maxAmplitude === 0) return audioBuffer;
  
      const normalizedBuffer = new Float32Array(audioBuffer.length);
      const factor = 0.8 / maxAmplitude; // Keep some headroom
  
      for (let i = 0; i < audioBuffer.length; i++) {
        normalizedBuffer[i] = audioBuffer[i] * factor;
      }
  
      return normalizedBuffer;
    }
  
    // Convert stereo to mono
    private static stereoToMono(audioBuffer: AudioBuffer): Float32Array {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      const mono = new Float32Array(left.length);
  
      for (let i = 0; i < left.length; i++) {
        mono[i] = (left[i] + right[i]) / 2;
      }
  
      return mono;
    }
  
    // Simple resampling (linear interpolation)
    private static resample(inputBuffer: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
      if (inputSampleRate === outputSampleRate) {
        return inputBuffer;
      }
  
      const ratio = inputSampleRate / outputSampleRate;
      const outputLength = Math.round(inputBuffer.length / ratio);
      const outputBuffer = new Float32Array(outputLength);
  
      for (let i = 0; i < outputLength; i++) {
        const inputIndex = i * ratio;
        const index = Math.floor(inputIndex);
        const fraction = inputIndex - index;
  
        if (index + 1 < inputBuffer.length) {
          // Linear interpolation
          outputBuffer[i] = inputBuffer[index] * (1 - fraction) + inputBuffer[index + 1] * fraction;
        } else {
          outputBuffer[i] = inputBuffer[index];
        }
      }
  
      return outputBuffer;
    }
  
    // Convert Float32Array to WAV blob
    private static float32ToWav(buffer: Float32Array, sampleRate: number): Blob {
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
  
    // Quick audio validation
    static validateAudioBlob(audioBlob: Blob): { isValid: boolean; error?: string } {
      // Check file size
      if (audioBlob.size > 25 * 1024 * 1024) {
        return { isValid: false, error: 'Audio file too large (max 25MB)' };
      }
  
      if (audioBlob.size < 100) {
        return { isValid: false, error: 'Audio file too small' };
      }
  
      return { isValid: true };
    }
  }