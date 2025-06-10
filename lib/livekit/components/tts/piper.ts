import { TTSComponent } from '@/types/livekit';

export class PiperTTSComponent implements TTSComponent {
  private voice: string;
  private baseURL: string;

  constructor(
    voice = 'en_US-lessac-medium',
    baseURL = process.env.PIPER_TTS_URL || 'http://localhost:5003'
  ) {
    this.voice = voice;
    this.baseURL = baseURL;
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    try {
      console.log('🔊 Piper TTS:', text.substring(0, 50) + '...');
      
      const response = await fetch(`${this.baseURL}/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: this.voice,
          output_format: 'wav',
        }),
      });

      if (!response.ok) {
        throw new Error(`Piper TTS API error: ${response.statusText}`);
      }

      return await response.arrayBuffer();
      
    } catch (error) {
      console.error('❌ Piper TTS Error:', error);
      throw error;
    }
  }

  setVoice(voiceId: string): void {
    this.voice = voiceId;
  }
}