// lib/livekit/components/tts/index.ts - Fixed TTS Component Factory
import { TTSComponent } from '@/types/livekit';
import { PROVIDER_CONFIGS } from '@/lib/livekit/config';

export class ElevenLabsTTSComponent implements TTSComponent {
  constructor(
    private config = PROVIDER_CONFIGS.tts.elevenlabs,
    private voiceId = config.voiceId
  ) {}

  setVoice(voiceId: string): void {
    this.voiceId = voiceId;
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    try {
      console.log('🔊 ElevenLabs TTS:', text.substring(0, 50) + '...');
      
      // Validate API key exists
      if (!this.config.apiKey) {
        throw new Error('ElevenLabs API key is not configured');
      }

      // Create headers object with proper type safety
      const headers: Record<string, string> = {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.config.apiKey, // Now guaranteed to be string
      };
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.6,
              similarity_boost: 0.85,
              style: 0.3,
              use_speaker_boost: true
            }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return audioBuffer;
      
    } catch (error) {
      console.error('❌ ElevenLabs TTS Error:', error);
      throw error;
    }
  }
}

export class OpenAITTSComponent implements TTSComponent {
  constructor(
    private config = PROVIDER_CONFIGS.tts.openai,
    private voice = 'nova'
  ) {}

  setVoice(voice: string): void {
    this.voice = voice;
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    try {
      console.log('🔊 OpenAI TTS:', text.substring(0, 50) + '...');
      
      // Validate API key exists
      if (!this.config.apiKey) {
        throw new Error('OpenAI API key is not configured');
      }

      // Create headers object with proper type safety
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      };
      
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: this.voice,
          response_format: 'mp3',
          speed: 1.0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI TTS API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return audioBuffer;
      
    } catch (error) {
      console.error('❌ OpenAI TTS Error:', error);
      throw error;
    }
  }
}

export class CoquiTTSComponent implements TTSComponent {
  constructor(
    private config = PROVIDER_CONFIGS.tts.coqui,
    private voice = 'default'
  ) {}

  setVoice(voice: string): void {
    this.voice = voice;
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    try {
      console.log('🔊 Coqui TTS:', text.substring(0, 50) + '...');
      
      // Validate base URL exists
      if (!this.config.baseURL) {
        throw new Error('Coqui TTS base URL is not configured');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      const response = await fetch(`${this.config.baseURL}/api/tts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: text,
          speaker_id: this.voice,
          style_wav: '',
          language_id: 'en',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Coqui TTS API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return audioBuffer;
      
    } catch (error) {
      console.error('❌ Coqui TTS Error:', error);
      throw error;
    }
  }
}

// Browser-based TTS fallback
export class BrowserTTSComponent implements TTSComponent {
  private synth: SpeechSynthesis;
  private voice?: SpeechSynthesisVoice;

  constructor() {
    if (typeof window === 'undefined') {
      throw new Error('BrowserTTSComponent can only be used in browser environment');
    }
    this.synth = window.speechSynthesis;
    this.loadVoices();
  }

  setVoice(voiceName: string): void {
    const voices = this.synth.getVoices();
    this.voice = voices.find(v => v.name.includes(voiceName)) || voices[0];
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔊 Browser TTS:', text.substring(0, 50) + '...');
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voice || null;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // For browser TTS, we'll return an empty buffer since we can't easily capture the audio
        // The speech will play directly through the browser
        utterance.onend = () => {
          // Return minimal WAV header as placeholder
          const emptyWav = this.createEmptyWavBuffer();
          resolve(emptyWav);
        };

        utterance.onerror = (event) => {
          reject(new Error(`Browser TTS error: ${event.error}`));
        };
        
        this.synth.speak(utterance);

      } catch (error) {
        console.error('❌ Browser TTS Error:', error);
        reject(error);
      }
    });
  }

  private loadVoices(): void {
    const voices = this.synth.getVoices();
    if (voices.length === 0) {
      this.synth.addEventListener('voiceschanged', () => {
        const newVoices = this.synth.getVoices();
        this.voice = newVoices.find(v => v.lang.startsWith('en')) || newVoices[0];
      });
    } else {
      this.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }
  }

  private createEmptyWavBuffer(): ArrayBuffer {
    // Create a minimal valid WAV file header
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 22050, true);
    view.setUint32(28, 44100, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, 0, true);

    return buffer;
  }
}

// Enhanced TTS Factory with better error handling
export function createTTSComponent(provider: string): TTSComponent {
  try {
    switch (provider) {
      case 'elevenlabs':
        return new ElevenLabsTTSComponent();
      case 'openai':
        return new OpenAITTSComponent();
      case 'coqui':
        return new CoquiTTSComponent();
      case 'browser':
        return new BrowserTTSComponent();
      default:
        throw new Error(`Unsupported TTS provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Failed to create TTS component for provider ${provider}:`, error);
    // Fallback to browser TTS if available
    if (typeof window !== 'undefined' && provider !== 'browser') {
      console.log('Falling back to browser TTS');
      return new BrowserTTSComponent();
    }
    throw error;
  }
}

// Multi-provider TTS Manager with failover
export class TTSManager {
  private providers: { name: string; component: TTSComponent }[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const providerOrder = ['openai', 'elevenlabs', 'coqui', 'browser'];
    
    for (const provider of providerOrder) {
      try {
        const component = createTTSComponent(provider);
        this.providers.push({ name: provider, component });
        console.log(`✅ TTS Provider ${provider} initialized`);
      } catch (error) {
        console.log(`❌ TTS Provider ${provider} failed to initialize:`, error);
      }
    }
  }

  async synthesize(text: string, preferredProvider?: string): Promise<{
    audioBuffer: ArrayBuffer;
    provider: string;
  }> {
    // Try preferred provider first
    if (preferredProvider) {
      const preferred = this.providers.find(p => p.name === preferredProvider);
      if (preferred) {
        try {
          const audioBuffer = await preferred.component.synthesize(text);
          return { audioBuffer, provider: preferred.name };
        } catch (error) {
          console.log(`Preferred TTS provider ${preferredProvider} failed:`, error);
        }
      }
    }

    // Try all providers in order
    for (const { name, component } of this.providers) {
      try {
        console.log(`🔄 Trying TTS provider: ${name}`);
        const audioBuffer = await component.synthesize(text);
        return { audioBuffer, provider: name };
      } catch (error) {
        console.log(`TTS provider ${name} failed:`, error);
      }
    }

    throw new Error('All TTS providers failed');
  }

  setVoice(voiceId: string, provider?: string): void {
    if (provider) {
      const targetProvider = this.providers.find(p => p.name === provider);
      if (targetProvider) {
        targetProvider.component.setVoice(voiceId);
      }
    } else {
      // Set voice for all providers
      this.providers.forEach(({ component }) => {
        component.setVoice(voiceId);
      });
    }
  }

  getAvailableProviders(): string[] {
    return this.providers.map(p => p.name);
  }
}

// Enhanced Audio utility functions
export class AudioUtils {
  private static audioContext: AudioContext | null = null;

  // Get or create a shared AudioContext
  private static getAudioContext(): AudioContext {
    if (!this.audioContext && typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }
    return this.audioContext;
  }

  static async convertToWav(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        console.warn('AudioContext not available in server environment, returning original buffer');
        return audioBuffer;
      }

      const audioContext = this.getAudioContext();
      
      // Resume context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create a copy of the buffer to avoid "already detached" errors
      const bufferCopy = audioBuffer.slice(0);
      const audioData = await audioContext.decodeAudioData(bufferCopy);
      
      const wavBuffer = this.audioBufferToWav(audioData);
      return wavBuffer;
    } catch (error) {
      console.error('Failed to convert to WAV:', error);
      return audioBuffer; // Return original if conversion fails
    }
  }

  static audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataLength = audioBuffer.length * bytesPerSample * numChannels;

    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return buffer;
  }

  static async playAudioBuffer(audioBuffer: ArrayBuffer): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Audio playback not available in server environment');
      }

      const audioContext = this.getAudioContext();
      
      // Resume AudioContext if it's suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create a copy to avoid "already detached" errors
      const bufferCopy = audioBuffer.slice(0);
      const audioData = await audioContext.decodeAudioData(bufferCopy);
      const source = audioContext.createBufferSource();
      
      source.buffer = audioData;
      source.connect(audioContext.destination);
      
      return new Promise((resolve, reject) => {
        let hasEnded = false;

        // Set up timeout as fallback (duration + 2 second buffer)
        const timeoutDuration = Math.max((audioData.duration + 2) * 1000, 5000);
        const timeout = setTimeout(() => {
          if (!hasEnded) {
            hasEnded = true;
            reject(new Error('Audio playback timeout'));
          }
        }, timeoutDuration);

        source.onended = () => {
          if (!hasEnded) {
            hasEnded = true;
            clearTimeout(timeout);
            resolve();
          }
        };

        try {
          source.start();
        } catch (startError) {
          clearTimeout(timeout);
          reject(new Error(`Failed to start audio playback: ${startError}`));
        }
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  // Alternative playback method using HTML5 Audio
  static async playAudioBufferHTML5(audioBuffer: ArrayBuffer): Promise<void> {
    try {
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      return new Promise((resolve, reject) => {
        let hasEnded = false;

        const cleanup = () => {
          URL.revokeObjectURL(audioUrl);
        };

        const timeout = setTimeout(() => {
          if (!hasEnded) {
            hasEnded = true;
            cleanup();
            reject(new Error('Audio playback timeout'));
          }
        }, 30000); // 30 second timeout

        audio.onended = () => {
          if (!hasEnded) {
            hasEnded = true;
            clearTimeout(timeout);
            cleanup();
            resolve();
          }
        };

        audio.onerror = (error) => {
          if (!hasEnded) {
            hasEnded = true;
            clearTimeout(timeout);
            cleanup();
            reject(new Error(`Audio playback failed: ${error}`));
          }
        };

        audio.oncanplaythrough = () => {
          audio.play().catch((playError) => {
            if (!hasEnded) {
              hasEnded = true;
              clearTimeout(timeout);
              cleanup();
              reject(new Error(`Failed to play audio: ${playError}`));
            }
          });
        };

        audio.load();
      });
    } catch (error) {
      console.error('Failed to play audio with HTML5:', error);
      throw error;
    }
  }

  static createAudioUrl(audioBuffer: ArrayBuffer, type: string = 'audio/wav'): string {
    const blob = new Blob([audioBuffer], { type });
    return URL.createObjectURL(blob);
  }

  static revokeAudioUrl(url: string): void {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Failed to revoke audio URL:', error);
    }
  }

  // Validate audio buffer
  static validateAudioBuffer(audioBuffer: ArrayBuffer): { isValid: boolean; error?: string } {
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return { isValid: false, error: 'Audio buffer is empty' };
    }

    if (audioBuffer.byteLength < 44) {
      return { isValid: false, error: 'Audio buffer too small to contain valid audio' };
    }

    return { isValid: true };
  }

  // Get audio duration estimate
  static estimateAudioDuration(audioBuffer: ArrayBuffer): number {
    try {
      // For WAV files, try to read duration from header
      const view = new DataView(audioBuffer);
      
      // Check if it's a WAV file
      const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
      if (riff === 'RIFF') {
        const sampleRate = view.getUint32(24, true);
        const dataSize = view.getUint32(40, true);
        const channels = view.getUint16(22, true);
        const bitsPerSample = view.getUint16(34, true);
        
        if (sampleRate > 0) {
          const bytesPerSecond = sampleRate * channels * (bitsPerSample / 8);
          return dataSize / bytesPerSecond;
        }
      }
      
      // Fallback estimation based on file size (very rough)
      return audioBuffer.byteLength / 32000; // Assume 32kbps average
    } catch (error) {
      console.warn('Failed to estimate audio duration:', error);
      return 0;
    }
  }

  // Cleanup method
  static cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(console.warn);
      this.audioContext = null;
    }
  }
}