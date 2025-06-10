// lib/livekit/components/vad/silero.ts - Silero VAD Component
import { VADComponent } from '@/types/livekit';

export class SileroVADComponent implements VADComponent {
  private isActive = false;
  private speechStartCallback?: () => void;
  private speechEndCallback?: () => void;
  private model?: any;
  private audioBuffer: Float32Array[] = [];
  private isSpeechActive = false;
  private silenceFrames = 0;
  private speechFrames = 0;
  
  // VAD Configuration
  private readonly FRAME_SIZE = 512; // 32ms at 16kHz
  private readonly SPEECH_THRESHOLD = 0.5;
  private readonly MIN_SPEECH_FRAMES = 3;
  private readonly MIN_SILENCE_FRAMES = 8;
  private readonly PRE_SPEECH_PAD_FRAMES = 10;
  
  constructor(
    private config = {
      threshold: 0.5,
      minSpeechFrames: 3,
      preSpeechPadFrames: 10,
      redemptionFrames: 8,
    }
  ) {}

  async start(): Promise<void> {
    if (this.isActive) return;
    
    console.log('🎙️ Starting Silero VAD...');
    
    try {
      // Load Silero VAD model (using ONNX Runtime Web)
      await this.loadModel();
      this.isActive = true;
      this.resetState();
      
    } catch (error) {
      console.error('❌ Failed to start Silero VAD:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isActive) return;
    
    console.log('🛑 Stopping Silero VAD...');
    this.isActive = false;
    this.resetState();
  }

  onAudioData(data: Float32Array): boolean {
    if (!this.isActive || !this.model) return false;
    
    // Buffer audio data
    this.audioBuffer.push(new Float32Array(data));
    
    // Process when we have enough data
    while (this.getBufferLength() >= this.FRAME_SIZE) {
      const frame = this.extractFrame();
      const speechProbability = this.processSingleFrame(frame);
      const isSpeech = this.updateSpeechState(speechProbability);
      
      if (isSpeech !== this.isSpeechActive) {
        this.isSpeechActive = isSpeech;
        
        if (isSpeech && this.speechStartCallback) {
          this.speechStartCallback();
        } else if (!isSpeech && this.speechEndCallback) {
          this.speechEndCallback();
        }
      }
    }
    
    return this.isSpeechActive;
  }

  onSpeechStart(callback: () => void): void {
    this.speechStartCallback = callback;
  }

  onSpeechEnd(callback: () => void): void {
    this.speechEndCallback = callback;
  }

  private async loadModel(): Promise<void> {
    try {
      // Dynamic import of ONNX Runtime
      const ort = await import('onnxruntime-web');
      
      // Load Silero VAD model
      const modelUrl = '/models/silero_vad.onnx';
      this.model = await ort.InferenceSession.create(modelUrl);
      
      console.log('✅ Silero VAD model loaded');
      
    } catch (error) {
      console.error('❌ Failed to load Silero VAD model:', error);
      // Fallback to simple energy-based VAD
      this.model = 'fallback';
    }
  }

  private processSingleFrame(frame: Float32Array): number {
    if (this.model === 'fallback') {
      return this.energyBasedVAD(frame);
    }
    
    try {
      // Prepare input tensor for Silero VAD
      const inputTensor = new Float32Array(512);
      inputTensor.set(frame.slice(0, 512));
      
      // Run inference (simplified - actual implementation needs proper tensor handling)
      // This is a placeholder for the actual ONNX Runtime inference
      const speechProbability = this.runSileroInference(inputTensor);
      
      return speechProbability;
      
    } catch (error) {
      console.warn('VAD inference error, using fallback:', error);
      return this.energyBasedVAD(frame);
    }
  }

  private runSileroInference(frame: Float32Array): number {
    // Placeholder for actual Silero VAD inference
    // In a real implementation, this would use ONNX Runtime Web
    // to run the Silero VAD model
    
    // For now, return energy-based detection
    return this.energyBasedVAD(frame);
  }

  private energyBasedVAD(frame: Float32Array): number {
    // Simple energy-based voice activity detection as fallback
    let energy = 0;
    for (let i = 0; i < frame.length; i++) {
      energy += frame[i] * frame[i];
    }
    energy = Math.sqrt(energy / frame.length);
    
    // Normalize energy to probability-like value
    const probability = Math.min(1.0, energy * 10);
    return probability;
  }

  private updateSpeechState(speechProbability: number): boolean {
    const isSpeechDetected = speechProbability > this.config.threshold;
    
    if (isSpeechDetected) {
      this.speechFrames++;
      this.silenceFrames = 0;
    } else {
      this.silenceFrames++;
      this.speechFrames = 0;
    }
    
    // Determine speech state based on frame counts
    if (!this.isSpeechActive && this.speechFrames >= this.config.minSpeechFrames) {
      return true; // Start of speech
    }
    
    if (this.isSpeechActive && this.silenceFrames >= this.config.redemptionFrames) {
      return false; // End of speech
    }
    
    return this.isSpeechActive; // No state change
  }

  private getBufferLength(): number {
    return this.audioBuffer.reduce((sum, buffer) => sum + buffer.length, 0);
  }

  private extractFrame(): Float32Array {
    const frame = new Float32Array(this.FRAME_SIZE);
    let frameIndex = 0;
    
    while (frameIndex < this.FRAME_SIZE && this.audioBuffer.length > 0) {
      const buffer = this.audioBuffer[0];
      const remainingInFrame = this.FRAME_SIZE - frameIndex;
      const availableInBuffer = buffer.length;
      const copyLength = Math.min(remainingInFrame, availableInBuffer);
      
      frame.set(buffer.subarray(0, copyLength), frameIndex);
      frameIndex += copyLength;
      
      if (copyLength === availableInBuffer) {
        // Consumed entire buffer
        this.audioBuffer.shift();
      } else {
        // Partially consumed buffer
        this.audioBuffer[0] = buffer.subarray(copyLength);
      }
    }
    
    return frame;
  }

  private resetState(): void {
    this.audioBuffer = [];
    this.isSpeechActive = false;
    this.silenceFrames = 0;
    this.speechFrames = 0;
  }
}

// Simple energy-based VAD as fallback
export class SimpleVADComponent implements VADComponent {
  private isActive = false;
  private speechStartCallback?: () => void;
  private speechEndCallback?: () => void;
  private isSpeechActive = false;
  private energyHistory: number[] = [];
  private readonly HISTORY_SIZE = 10;
  
  constructor(
    private threshold = 0.01,
    private minSpeechDuration = 300, // ms
    private minSilenceDuration = 500 // ms
  ) {}

  async start(): Promise<void> {
    if (this.isActive) return;
    
    console.log('🎙️ Starting Simple VAD...');
    this.isActive = true;
    this.energyHistory = [];
    this.isSpeechActive = false;
  }

  async stop(): Promise<void> {
    if (!this.isActive) return;
    
    console.log('🛑 Stopping Simple VAD...');
    this.isActive = false;
    this.energyHistory = [];
  }

  onAudioData(data: Float32Array): boolean {
    if (!this.isActive) return false;
    
    // Calculate RMS energy
    let energy = 0;
    for (let i = 0; i < data.length; i++) {
      energy += data[i] * data[i];
    }
    energy = Math.sqrt(energy / data.length);
    
    // Update energy history
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.HISTORY_SIZE) {
      this.energyHistory.shift();
    }
    
    // Calculate adaptive threshold
    const avgEnergy = this.energyHistory.reduce((sum, e) => sum + e, 0) / this.energyHistory.length;
    const adaptiveThreshold = Math.max(this.threshold, avgEnergy * 1.5);
    
    const isSpeechDetected = energy > adaptiveThreshold;
    
    // Update speech state with hysteresis
    if (!this.isSpeechActive && isSpeechDetected) {
      this.isSpeechActive = true;
      this.speechStartCallback?.();
    } else if (this.isSpeechActive && !isSpeechDetected) {
      // Add some delay before declaring end of speech
      setTimeout(() => {
        if (!isSpeechDetected) {
          this.isSpeechActive = false;
          this.speechEndCallback?.();
        }
      }, this.minSilenceDuration);
    }
    
    return this.isSpeechActive;
  }

  onSpeechStart(callback: () => void): void {
    this.speechStartCallback = callback;
  }

  onSpeechEnd(callback: () => void): void {
    this.speechEndCallback = callback;
  }
}

// VAD Factory
export function createVADComponent(provider: 'silero' | 'simple' = 'simple'): VADComponent {
  switch (provider) {
    case 'silero':
      return new SileroVADComponent();
    case 'simple':
    default:
      return new SimpleVADComponent();
  }
}