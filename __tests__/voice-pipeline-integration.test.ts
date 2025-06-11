// // __tests__/voice-pipeline-integration.test.ts - Complete Testing Guide
// import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
// import { renderHook, act, render, screen, fireEvent, waitFor } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import { useVoicePipeline } from '../hooks/useVoicePipeline';
// import VoiceInterface from '../components/VoiceInterface';
// import VoicePipelineStatus from '../components/VoicePipelineStatus';
// import { EnhancedSTTService } from '../lib/stt/enhanced-stt';

// // ============================================================================
// // MOCK SETUP
// // ============================================================================

// // Mock fetch globally
// global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// // Mock Web APIs
// Object.defineProperty(global.navigator, 'mediaDevices', {
//   value: {
//     getUserMedia: jest.fn(),
//     enumerateDevices: jest.fn(),
//   },
// });

// Object.defineProperty(global.window, 'AudioContext', {
//   value: jest.fn().mockImplementation(() => ({
//     createAnalyser: jest.fn(() => ({
//       fftSize: 256,
//       smoothingTimeConstant: 0.8,
//       getByteFrequencyData: jest.fn(),
//       frequencyBinCount: 128,
//     })),
//     createMediaStreamSource: jest.fn(),
//     close: jest.fn(),
//     state: 'running',
//     sampleRate: 16000,
//   })),
// });

// Object.defineProperty(global.window, 'MediaRecorder', {
//   value: jest.fn().mockImplementation(() => ({
//     start: jest.fn(),
//     stop: jest.fn(),
//     pause: jest.fn(),
//     resume: jest.fn(),
//     state: 'inactive',
//     ondataavailable: null,
//     onstop: null,
//     onerror: null,
//   })),
// });

// // Mock URL.createObjectURL
// Object.defineProperty(global.URL, 'createObjectURL', {
//   value: jest.fn(() => 'mock-blob-url'),
// });

// Object.defineProperty(global.URL, 'revokeObjectURL', {
//   value: jest.fn(),
// });

// // ============================================================================
// // ENHANCED STT SERVICE TESTS
// // ============================================================================

// describe('EnhancedSTTService', () => {
//   let sttService: EnhancedSTTService;

//   beforeEach(() => {
//     sttService = new EnhancedSTTService();
//     jest.clearAllMocks();
    
//     // Reset environment variables
//     process.env.OPENAI_API_KEY = 'test-openai-key';
//     process.env.DEEPGRAM_API_KEY = 'test-deepgram-key';
//   });

//   describe('Rate Limiting', () => {
//     it('should enforce rate limits per provider', async () => {
//       // Mock successful Whisper response
//       (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
//         ok: true,
//         json: async () => ({ text: 'Test transcript' }),
//       } as Response);

//       // Make 51 requests rapidly (exceeding limit of 50)
//       const requests = Array.from({ length: 51 }, () =>
//         sttService.processAudio({
//           audio: 'base64-test-audio',
//           format: 'webm',
//           language: 'en'
//         })
//       );

//       const results = await Promise.all(requests);
      
//       // Last request should be rate limited
//       expect(results[50].success).toBe(false);
//       expect(results[50].error).toContain('Rate limit exceeded');
//     });

//     it('should provide retry information when rate limited', async () => {
//       // First, fill up the rate limit
//       (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
//         ok: true,
//         json: async () => ({ text: 'Test' }),
//       } as Response);

//       // Fill rate limit
//       const fillRequests = Array.from({ length: 50 }, () =>
//         sttService.processAudio({
//           audio: 'test-audio',
//           format: 'webm',
//           language: 'en'
//         })
//       );
//       await Promise.all(fillRequests);

//       // Next request should be rate limited
//       const rateLimitedResult = await sttService.processAudio({
//         audio: 'test-audio',
//         format: 'webm',
//         language: 'en'
//       });

//       expect(rateLimitedResult.success).toBe(false);
//       expect(rateLimitedResult.retryAfter).toBeGreaterThan(0);
//     });
//   });

//   describe('Provider Fallback', () => {
//     it('should fallback to Deepgram when Whisper fails', async () => {
//       // Mock Whisper failure
//       (fetch as jest.MockedFunction<typeof fetch>)
//         .mockResolvedValueOnce({
//           ok: false,
//           status: 429,
//           statusText: 'Rate Limited',
//         } as Response)
//         // Mock Deepgram success
//         .mockResolvedValueOnce({
//           ok: true,
//           json: async () => ({
//             results: {
//               channels: [{
//                 alternatives: [{
//                   transcript: 'Deepgram transcript',
//                   confidence: 0.95
//                 }]
//               }]
//             }
//           }),
//         } as Response);

//       const result = await sttService.processAudio({
//         audio: 'test-audio',
//         format: 'webm',
//         language: 'en'
//       });

//       expect(result.success).toBe(true);
//       expect(result.transcript).toBe('Deepgram transcript');
//       expect(result.provider).toBe('deepgram');
//     });

//     it('should fallback to basic implementation when all providers fail', async () => {
//       // Mock all providers failing
//       (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
//         new Error('Network error')
//       );

//       const result = await sttService.processAudio({
//         audio: 'test-audio',
//         format: 'webm',
//         language: 'en'
//       });

//       expect(result.success).toBe(true);
//       expect(result.provider).toBe('basic');
//       expect(result.transcript).toContain('basic implementation');
//     });
//   });

//   describe('Exponential Backoff', () => {
//     it('should implement exponential backoff on retries', async () => {
//       const startTime = Date.now();
      
//       // Mock rate limit error
//       (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
//         new Error('Rate limited')
//       );

//       await sttService.processAudio({
//         audio: 'test-audio',
//         format: 'webm',
//         language: 'en'
//       });

//       const endTime = Date.now();
      
//       // Should have taken time for retries with backoff
//       // (1s + 2s + 4s = ~7s minimum with 3 attempts)
//       expect(endTime - startTime).toBeGreaterThan(6000);
//     });
//   });
// });

// // ============================================================================
// // VOICE PIPELINE HOOK TESTS
// // ============================================================================

// describe('useVoicePipeline Hook', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
    
//     // Mock successful media access
//     (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue({
//       getTracks: () => [{ stop: jest.fn() }],
//     });
//   });

//   describe('Rate Limiting Integration', () => {
//     it('should handle rate limit responses from API', async () => {
//       (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
//         ok: false,
//         status: 429,
//         json: async () => ({
//           success: false,
//           error: 'Rate limit exceeded',
//           retryAfter: 60,
//           providerStatus: [
//             { name: 'whisper', available: false, remaining: 0, resetTime: Date.now() + 60000 }
//           ]
//         }),
//       } as Response);

//       const { result } = renderHook(() => useVoicePipeline({
//         rateLimiting: { enabled: true, maxRetries: 1, baseDelay: 100, maxDelay: 1000 }
//       }));

//       await act(async () => {
//         await result.current.startListening();
//       });

//       // Should show rate limited state
//       expect(result.current.rateLimitState.isRateLimited).toBe(true);
//       expect(result.current.rateLimitState.retryAfter).toBe(60);
//       expect(result.current.canMakeRequest).toBe(false);
//     });

//     it('should auto-retry with exponential backoff', async () => {
//       let callCount = 0;
      
//       (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => {
//         callCount++;
//         if (callCount < 3) {
//           return Promise.resolve({
//             ok: false,
//             status: 500,
//             json: async () => ({ success: false, error: 'Server error' }),
//           } as Response);
//         }
//         return Promise.resolve({
//           ok: true,
//           json: async () => ({ success: true, transcript: 'Success!' }),
//         } as Response);
//       });

//       const { result } = renderHook(() => useVoicePipeline({
//         rateLimiting: { enabled: true, maxRetries: 3, baseDelay: 100, maxDelay: 1000 }
//       }));

//       await act(async () => {
//         // Simulate audio processing
//         const audioBlob = new Blob(['test'], { type: 'audio/webm' });
//         await result.current.startListening();
//         // Mock processing would happen here
//       });

//       // Should eventually succeed after retries
//       await waitFor(() => {
//         expect(callCount).toBeGreaterThanOrEqual(3);
//       });
//     });
//   });

//   describe('Error Recovery', () => {
//     it('should provide retry functionality', async () => {
//       const { result } = renderHook(() => useVoicePipeline());

//       // Set an error state
//       act(() => {
//         result.current.clearError();
//       });

//       expect(result.current.error).toBeNull();
//     });

//     it('should reset conversation state', async () => {
//       const { result } = renderHook(() => useVoicePipeline());

//       act(() => {
//         result.current.resetConversation();
//       });

//       expect(result.current.messages).toHaveLength(0);
//       expect(result.current.currentQuestionIndex).toBe(0);
//       expect(result.current.isComplete).toBe(false);
//     });
//   });
// });

// // ============================================================================
// // VOICE INTERFACE COMPONENT TESTS
// // ============================================================================

// describe('VoiceInterface Component', () => {
//   const defaultProps = {
//     userName: 'Test User',
//     userId: 'user123',
//     type: 'interview' as const,
//     questions: ['Question 1', 'Question 2'],
//     interviewType: 'technical' as const,
//   };

//   beforeEach(() => {
//     jest.clearAllMocks();
    
//     // Mock successful media access
//     (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue({
//       getTracks: () => [{ stop: jest.fn() }],
//     });
//   });

//   it('should show status panel when there are errors', async () => {
//     // Mock error response
//     (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
//       ok: false,
//       status: 500,
//       json: async () => ({ success: false, error: 'API Error' }),
//     } as Response);

//     render(<VoiceInterface {...defaultProps} />);

//     const micButton = screen.getByRole('button', { name: /microphone/i });
//     await userEvent.click(micButton);

//     // Status panel should auto-open due to error
//     await waitFor(() => {
//       expect(screen.getByText('Status & Troubleshooting')).toBeInTheDocument();
//     });
//   });

//   it('should allow manual toggle of status panel', async () => {
//     render(<VoiceInterface {...defaultProps} />);

//     const settingsButton = screen.getByTitle('Show Status & Troubleshooting');
//     await userEvent.click(settingsButton);

//     expect(screen.getByText('Status & Troubleshooting')).toBeInTheDocument();

//     // Close it
//     const closeButton = screen.getByText('×');
//     await userEvent.click(closeButton);

//     expect(screen.queryByText('Status & Troubleshooting')).not.toBeInTheDocument();
//   });

//   it('should handle push-to-talk mode', async () => {
//     render(<VoiceInterface {...defaultProps} />);

//     // Switch to push mode
//     const pushButton = screen.getByText('Push');
//     await userEvent.click(pushButton);

//     // Start listening first
//     const micButton = screen.getByRole('button', { name: /microphone/i });
//     await userEvent.click(micButton);

//     // Should show push-to-talk button
//     await waitFor(() => {
//       expect(screen.getByText('Hold to Talk')).toBeInTheDocument();
//     });
//   });

//   it('should display rate limit warnings', async () => {
//     // Mock rate limit response
//     (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
//       ok: false,
//       status: 429,
//       json: async () => ({
//         success: false,
//         error: 'Rate limited',
//         retryAfter: 30,
//       }),
//     } as Response);

//     render(<VoiceInterface {...defaultProps} />);

//     const micButton = screen.getByRole('button', { name: /microphone/i });
//     await userEvent.click(micButton);

//     await waitFor(() => {
//       expect(screen.getByText(/Rate limited - wait 30s/)).toBeInTheDocument();
//     });
//   });
// });

// // ============================================================================
// // STATUS COMPONENT TESTS
// // ============================================================================

// describe('VoicePipelineStatus Component', () => {
//   const defaultProps = {
//     rateLimitState: {
//       isRateLimited: false,
//       retryAfter: 0,
//       failedAttempts: 0,
//       providerStatus: [
//         { name: 'whisper', available: true, remaining: 45, resetTime: Date.now() + 60000 },
//         { name: 'deepgram', available: true, remaining: 95, resetTime: Date.now() + 60000 },
//       ],
//     },
//     connectionStatus: 'connected' as const,
//     isProcessing: false,
//     error: null,
//     onRetry: jest.fn(),
//     onReset: jest.fn(),
//   };

//   it('should display provider status correctly', () => {
//     render(<VoicePipelineStatus {...defaultProps} />);

//     expect(screen.getByText('whisper')).toBeInTheDocument();
//     expect(screen.getByText('45 remaining')).toBeInTheDocument();
//     expect(screen.getByText('deepgram')).toBeInTheDocument();
//     expect(screen.getByText('95 remaining')).toBeInTheDocument();
//   });

//   it('should show rate limit countdown', () => {
//     const rateLimitedProps = {
//       ...defaultProps,
//       rateLimitState: {
//         ...defaultProps.rateLimitState,
//         isRateLimited: true,
//         retryAfter: 45,
//       },
//     };

//     render(<VoicePipelineStatus {...rateLimitedProps} />);

//     expect(screen.getByText(/Rate Limited/)).toBeInTheDocument();
//     expect(screen.getByText(/wait 45 seconds/)).toBeInTheDocument();
//   });

//   it('should display error with retry option', () => {
//     const errorProps = {
//       ...defaultProps,
//       error: 'Connection failed',
//     };

//     render(<VoicePipelineStatus {...errorProps} />);

//     expect(screen.getByText('Connection failed')).toBeInTheDocument();
//     expect(screen.getByText('Try Again')).toBeInTheDocument();
//   });

//   it('should call retry function when retry button clicked', async () => {
//     const onRetry = jest.fn();
//     const errorProps = {
//       ...defaultProps,
//       error: 'Test error',
//       onRetry,
//     };

//     render(<VoicePipelineStatus {...errorProps} />);

//     const retryButton = screen.getByText('Try Again');
//     await userEvent.click(retryButton);

//     expect(onRetry).toHaveBeenCalledTimes(1);
//   });

//   it('should show processing indicator', () => {
//     const processingProps = {
//       ...defaultProps,
//       isProcessing: true,
//     };

//     render(<VoicePipelineStatus {...processingProps} />);

//     expect(screen.getByText('Processing audio...')).toBeInTheDocument();
//   });
// });

// // ============================================================================
// // INTEGRATION TESTS
// // ============================================================================

// describe('Full Integration Tests', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
    
//     // Mock successful media access
//     (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue({
//       getTracks: () => [{ stop: jest.fn() }],
//     });
//   });

//   it('should handle complete voice pipeline flow', async () => {
//     // Mock successful API responses
//     (fetch as jest.MockedFunction<typeof fetch>)
//       .mockResolvedValueOnce({
//         ok: true,
//         json: async () => ({
//           success: true,
//           transcript: 'Hello world',
//           response: 'Hi there!',
//           audio: 'base64-audio-data',
//           format: 'mp3',
//         }),
//       } as Response);

//     const { result } = renderHook(() => useVoicePipeline({
//       questions: ['Tell me about yourself'],
//       interviewType: 'technical',
//     }));

//     // Start listening
//     await act(async () => {
//       await result.current.startListening();
//     });

//     expect(result.current.isListening).toBe(true);
//     expect(result.current.connectionStatus).toBe('connected');

//     // Simulate processing completion
//     await act(async () => {
//       // Mock would trigger processAudio here
//     });

//     // Should handle conversation flow
//     expect(result.current.canMakeRequest).toBe(true);
//   });

//   it('should recover from rate limit scenario', async () => {
//     let callCount = 0;
    
//     (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => {
//       callCount++;
//       if (callCount === 1) {
//         return Promise.resolve({
//           ok: false,
//           status: 429,
//           json: async () => ({
//             success: false,
//             error: 'Rate limited',
//             retryAfter: 1, // Short retry for test
//           }),
//         } as Response);
//       }
//       return Promise.resolve({
//         ok: true,
//         json: async () => ({
//           success: true,
//           transcript: 'Recovered!',
//         }),
//       } as Response);
//     });

//     const { result } = renderHook(() => useVoicePipeline({
//       rateLimiting: { enabled: true, maxRetries: 2, baseDelay: 100, maxDelay: 500 }
//     }));

//     await act(async () => {
//       await result.current.startListening();
//     });

//     // Should eventually recover
//     await waitFor(() => {
//       expect(result.current.rateLimitState.isRateLimited).toBe(false);
//     }, { timeout: 5000 });
//   });
// });