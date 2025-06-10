// lib/livekit/components/tts/index.ts - TTS Component Factory
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
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.config.apiKey,
          },
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
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
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
      
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: this.voice,
          response_format: 'mp3',
          speed: 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS API error: ${response.statusText}`);
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
      
      const response = await fetch(`${this.config.baseURL}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          speaker_id: this.voice,
          style_wav: '',
          language_id: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`Coqui TTS API error: ${response.statusText}`);
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

        // Capture audio using Web Audio API
        this.captureAudio(utterance)
          .then(resolve)
          .catch(reject);

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

  private async captureAudio(utterance: SpeechSynthesisUtterance): Promise<ArrayBuffer> {
    // Note: This is a simplified implementation
    // In reality, capturing browser TTS audio requires more complex setup
    return new Promise((resolve) => {
      utterance.onend = () => {
        // Return empty buffer as placeholder
        // Real implementation would use MediaRecorder or AudioWorklet
        const emptyBuffer = new ArrayBuffer(0);
        resolve(emptyBuffer);
      };
      
      this.synth.speak(utterance);
    });
  }
}

// TTS Factory
export function createTTSComponent(provider: string): TTSComponent {
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
}

// Audio utility functions
export class AudioUtils {
  static async convertToWav(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    // Convert MP3/other formats to WAV for consistent playback
    const audioContext = new AudioContext();
    const audioData = await audioContext.decodeAudioData(audioBuffer);
    
    const wavBuffer = this.audioBufferToWav(audioData);
    return wavBuffer;
  }

  static audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const buffer = new ArrayBuffer(44 + audioBuffer.length * bytesPerSample);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + audioBuffer.length * bytesPerSample, true);
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
    view.setUint32(40, audioBuffer.length * bytesPerSample, true);

    // Convert audio data
    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return buffer;
  }

  static async playAudioBuffer(audioBuffer: ArrayBuffer): Promise<void> {
    const audioContext = new AudioContext();
    const audioData = await audioContext.decodeAudioData(audioBuffer);
    const source = audioContext.createBufferSource();
    
    source.buffer = audioData;
    source.connect(audioContext.destination);
    
    return new Promise((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  }
}