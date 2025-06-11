// __tests__/voice-pipeline.test.ts - Voice Pipeline Tests
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { POST as voicePipelineHandler } from '../app/api/voice/pipeline/route';
import { useVoicePipeline } from '../hooks/useVoicePipeline';
import { renderHook, act } from '@testing-library/react';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock Web APIs
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(),
    enumerateDevices: jest.fn(),
  },
});

Object.defineProperty(global.window, 'AudioContext', {
  value: jest.fn().mockImplementation(() => ({
    createAnalyser: jest.fn(() => ({
      fftSize: 256,
      smoothingTimeConstant: 0.8,
      getByteFrequencyData: jest.fn(),
      frequencyBinCount: 128,
    })),
    createMediaStreamSource: jest.fn(),
    close: jest.fn(),
    state: 'running',
    sampleRate: 16000,
  })),
});

Object.defineProperty(global.window, 'MediaRecorder', {
  value: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    state: 'inactive',
    ondataavailable: null,
    onstop: null,
    onerror: null,
  })),
});

describe('Voice Pipeline API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('STT Endpoint', () => {
    it('should process audio and return transcript', async () => {
      const mockWhisperResponse = {
        text: 'Hello, this is a test.',
        confidence: 0.95,
        language: 'en',
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWhisperResponse,
      } as Response);

      const request = new Request('http://localhost:3000/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stt',
          audio: 'base64-encoded-audio-data',
          format: 'webm',
          language: 'en',
        }),
      });

      const response = await voicePipelineHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transcript).toBe('Hello, this is a test.');
      expect(data.confidence).toBe(0.95);
    });

    it('should handle STT errors gracefully', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      } as Response);

      const request = new Request('http://localhost:3000/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stt',
          audio: 'invalid-audio-data',
          format: 'webm',
        }),
      });

      const response = await voicePipelineHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Whisper API error');
    });
  });

  describe('LLM Endpoint', () => {
    it('should generate appropriate interview responses', async () => {
      const mockGPTResponse = {
        choices: [{
          message: {
            content: 'That\'s an interesting point. Can you tell me more about your experience with that technology?'
          }
        }],
        usage: { total_tokens: 45 }
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGPTResponse,
      } as Response);

      const request = new Request('http://localhost:3000/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'llm',
          message: 'I have been working with React for about 3 years.',
          context: [],
          interviewConfig: {
            type: 'technical',
            questions: ['Tell me about your React experience.'],
            currentIndex: 0
          }
        }),
      });

      const response = await voicePipelineHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response).toContain('interesting point');
      expect(data.metadata.tokens).toBe(45);
    });
  });

  describe('TTS Endpoint', () => {
    it('should convert text to speech successfully', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockAudioBuffer,
      } as Response);

      const request = new Request('http://localhost:3000/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tts',
          text: 'Hello, how are you today?',
          voice: 'nova',
          provider: 'openai'
        }),
      });

      const response = await voicePipelineHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.audio).toBeDefined();
      expect(data.format).toBe('mp3');
      expect(data.provider).toBe('openai');
    });
  });

  describe('Full Pipeline', () => {
    it('should process complete STT->LLM->TTS pipeline', async () => {
      // Mock STT response
      const mockWhisperResponse = {
        text: 'I am interested in this position.',
        confidence: 0.92,
      };

      // Mock LLM response
      const mockGPTResponse = {
        choices: [{
          message: {
            content: 'Great! What specifically interests you about this role?'
          }
        }],
        usage: { total_tokens: 35 }
      };

      // Mock TTS response
      const mockAudioBuffer = new ArrayBuffer(2048);

      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWhisperResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGPTResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => mockAudioBuffer,
        } as Response);

      const request = new Request('http://localhost:3000/api/voice/pipeline', {
        method: 'POST',