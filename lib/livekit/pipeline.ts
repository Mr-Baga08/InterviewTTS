// // lib/livekit/pipeline.ts - Main Voice Pipeline Controller
// import { 
//     Room, 
//     RoomEvent, 
//     RemoteTrack, 
//     RemoteTrackPublication,
//     LocalAudioTrack,
//     AudioCaptureOptions,
//     RoomOptions,
//     ConnectOptions
//   } from 'livekit-client';
  
//   import { 
//     VoicePipelineConfig, 
//     VoiceMessage, 
//     PipelineState, 
//     InterviewSession,
//     LiveKitEvents,
//     STTComponent,
//     LLMComponent, 
//     TTSComponent,
//     VADComponent
//   } from '@/types/livekit';
  
//   import { LIVEKIT_CONFIG, DEFAULT_PIPELINE_CONFIG } from './config';
//   import { WhisperSTTComponent } from './components/stt/whisper';
//   import { createLLMComponent, InterviewLLMComponent } from './components/llm';
//   import { createTTSComponent, AudioUtils } from './components/tts';
//   import { createVADComponent } from './components/vad/silero';
  
//   export class LiveKitVoicePipeline {
//     private room: Room;
//     private localAudioTrack?: LocalAudioTrack;
//     private audioContext?: AudioContext;
//     private audioWorkletNode?: AudioWorkletNode;
    
//     // Pipeline Components
//     private stt: STTComponent;
//     private llm: LLMComponent;
//     private tts: TTSComponent;
//     private vad: VADComponent;
//     private interviewLLM?: InterviewLLMComponent;
    
//     // State Management
//     private state: PipelineState = {
//       isListening: false,
//       isSpeaking: false,
//       isProcessing: false,
//       connectionStatus: 'disconnected'
//     };
    
//     private session?: InterviewSession;
//     private messages: VoiceMessage[] = [];
//     private eventCallbacks: Partial<LiveKitEvents> = {};
    
//     constructor(
//       private config: VoicePipelineConfig = DEFAULT_PIPELINE_CONFIG
//     ) {
//       // Initialize LiveKit Room
//       this.room = new Room();
//       this.setupRoomEvents();
      
//       // Initialize Pipeline Components
//       this.stt = new WhisperSTTComponent();
//       this.llm = createLLMComponent(config.llm.provider);
//       this.tts = createTTSComponent(config.tts.provider);
//       this.vad = createVADComponent('simple'); // Use simple VAD for reliability
      
//       this.setupPipelineEvents();
//     }
    
//     // Public API Methods
//     async connect(token: string): Promise<void> {
//       try {
//         this.setState({ connectionStatus: 'connecting' });
        
//         const connectOptions: ConnectOptions = {
//           autoSubscribe: true,
//         };
        
//         await this.room.connect(LIVEKIT_CONFIG.server.url, token, connectOptions);
        
//         this.setState({ connectionStatus: 'connected' });
//         this.eventCallbacks.onConnectionStatusChanged?.('connected');
        
//       } catch (error) {
//         console.error('❌ Failed to connect to LiveKit:', error);
//         this.setState({ connectionStatus: 'error', error: error instanceof Error ? error.message : 'Connection failed' });
//         this.eventCallbacks.onConnectionStatusChanged?.('error');
//         throw error;
//       }
//     }
    
//     async disconnect(): Promise<void> {
//       try {
//         await this.stopPipeline();
//         await this.room.disconnect();
//         this.setState({ connectionStatus: 'disconnected' });
//         this.eventCallbacks.onConnectionStatusChanged?.('disconnected');
        
//       } catch (error) {
//         console.error('❌ Failed to disconnect from LiveKit:', error);
//       }
//     }
    
//     async startInterview(questions: string[], interviewType: 'technical' | 'behavioral' | 'mixed'): Promise<void> {
//       try {
//         // Initialize interview session
//         this.session = {
//           id: `interview-${Date.now()}`,
//           userId: 'current-user', // This should come from auth context
//           interviewId: 'current-interview', // This should come from props
//           questions,
//           currentQuestionIndex: 0,
//           messages: [],
//           startTime: Date.now(),
//           status: 'active'
//         };
        
//         // Setup interview-specific LLM
//         this.interviewLLM = new InterviewLLMComponent(this.llm, interviewType);
//         this.interviewLLM.setQuestions(questions);
        
//         // Set appropriate system prompt
//         const systemPrompt = this.getSystemPromptForType(interviewType);
//         this.interviewLLM.setSystemPrompt(systemPrompt);
        
//         // Start audio pipeline
//         await this.startPipeline();
        
//         // Begin with first question
//         await this.askFirstQuestion();
        
//       } catch (error) {
//         console.error('❌ Failed to start interview:', error);
//         throw error;
//       }
//     }
    
//     async stopInterview(): Promise<void> {
//       try {
//         if (this.session) {
//           this.session.endTime = Date.now();
//           this.session.status = 'completed';
//         }
        
//         await this.stopPipeline();
        
//       } catch (error) {
//         console.error('❌ Failed to stop interview:', error);
//       }
//     }
    
//     // Event Handlers Registration
//     on<K extends keyof LiveKitEvents>(event: K, callback: LiveKitEvents[K]): void {
//       this.eventCallbacks[event] = callback;
//     }
    
//     off<K extends keyof LiveKitEvents>(event: K): void {
//       delete this.eventCallbacks[event];
//     }
    
//     // Getters
//     getState(): PipelineState {
//       return { ...this.state };
//     }
    
//     getSession(): InterviewSession | undefined {
//       return this.session ? { ...this.session } : undefined;
//     }
    
//     getMessages(): VoiceMessage[] {
//       return [...this.messages];
//     }
    
//     // Private Methods
//     private async startPipeline(): Promise<void> {
//       try {
//         // Setup audio capture
//         await this.setupAudioCapture();
        
//         // Start pipeline components
//         await this.vad.start();
//         await this.stt.start();
        
//         this.setState({ isListening: true });
        
//       } catch (error) {
//         console.error('❌ Failed to start pipeline:', error);
//         throw error;
//       }
//     }
    
//     private async stopPipeline(): Promise<void> {
//       try {
//         // Stop pipeline components
//         await this.vad.stop();
//         await this.stt.stop();
        
//         // Stop audio capture
//         if (this.localAudioTrack) {
//           this.localAudioTrack.stop();
//           this.localAudioTrack = undefined;
//         }
        
//         if (this.audioWorkletNode) {
//           this.audioWorkletNode.disconnect();
//           this.audioWorkletNode = undefined;
//         }
        
//         this.setState({ 
//           isListening: false, 
//           isSpeaking: false, 
//           isProcessing: false 
//         });
        
//       } catch (error) {
//         console.error('❌ Failed to stop pipeline:', error);
//       }
//     }
    
//     private async setupAudioCapture(): Promise<void> {
//       try {
//         // Create audio context
//         this.audioContext = new AudioContext({ sampleRate: LIVEKIT_CONFIG.audio.sampleRate });
        
//         // Create local audio track
//         const captureOptions: AudioCaptureOptions = {
//           echoCancellation: true,
//           noiseSuppression: true,
//           autoGainControl: true,
//           sampleRate: LIVEKIT_CONFIG.audio.sampleRate,
//           channelCount: LIVEKIT_CONFIG.audio.channels,
//         };
        
//         this.localAudioTrack = await LocalAudioTrack.createAudioTrack(captureOptions);
        
//         // Publish to room
//         await this.room.localParticipant.publishTrack(this.localAudioTrack);
        
//         // Setup audio processing worklet
//         await this.setupAudioWorklet();
        
//       } catch (error) {
//         console.error('❌ Failed to setup audio capture:', error);
//         throw error;
//       }
//     }
    
//     private async setupAudioWorklet(): Promise<void> {
//       try {
//         if (!this.audioContext || !this.localAudioTrack) return;
        
//         // Load audio worklet processor
//         await this.audioContext.audioWorklet.addModule('/worklets/audio-processor.js');
        
//         // Create worklet node
//         this.audioWorkletNode = new AudioWorkletNode(
//           this.audioContext,
//           'audio-processor',
//           {
//             processorOptions: {
//               frameSize: LIVEKIT_CONFIG.audio.frameSize
//             }
//           }
//         );
        
//         // Connect audio processing chain
//         const mediaStreamSource = this.audioContext.createMediaStreamSource(
//           this.localAudioTrack.mediaStream!
//         );
        
//         mediaStreamSource.connect(this.audioWorkletNode);
//         this.audioWorkletNode.connect(this.audioContext.destination);
        
//         // Handle processed audio data
//         this.audioWorkletNode.port.onmessage = (event) => {
//           const { audioData } = event.data;
//           this.processAudioFrame(new Float32Array(audioData));
//         };
        
//       } catch (error) {
//         console.error('❌ Failed to setup audio worklet:', error);
//         // Fallback to ScriptProcessorNode for older browsers
//         await this.setupScriptProcessor();
//       }
//     }
    
//     private async setupScriptProcessor(): Promise<void> {
//       if (!this.audioContext || !this.localAudioTrack) return;
      
//       const bufferSize = 4096;
//       const processor = this.audioContext.createScriptProcessor(
//         bufferSize, 
//         LIVEKIT_CONFIG.audio.channels, 
//         LIVEKIT_CONFIG.audio.channels
//       );
      
//       processor.onaudioprocess = (event) => {
//         const inputBuffer = event.inputBuffer;
//         const audioData = inputBuffer.getChannelData(0);
//         this.processAudioFrame(audioData);
//       };
      
//       const mediaStreamSource = this.audioContext.createMediaStreamSource(
//         this.localAudioTrack.mediaStream!
//       );
      
//       mediaStreamSource.connect(processor);
//       processor.connect(this.audioContext.destination);
//     }
    
//     private processAudioFrame(audioData: Float32Array): void {
//       // Process with VAD first
//       const isSpeechDetected = this.vad.onAudioData(audioData);
      
//       // Send to STT if speech is detected or we're currently listening
//       if (isSpeechDetected || this.state.isListening) {
//         this.stt.onAudioData(audioData);
//       }
//     }
    
//     private setupPipelineEvents(): void {
//       // VAD Events
//       this.vad.onSpeechStart(() => {
//         console.log('🎤 Speech started');
//         this.eventCallbacks.onSpeechStarted?.();
//       });
      
//       this.vad.onSpeechEnd(() => {
//         console.log('🎤 Speech ended');
//         this.eventCallbacks.onSpeechEnded?.();
//       });
      
//       // STT Events
//       this.stt.onTranscript((text: string, isFinal: boolean) => {
//         console.log(`📝 Transcript (${isFinal ? 'final' : 'partial'}):`, text);
        
//         this.eventCallbacks.onTranscriptReceived?.(text, isFinal);
        
//         if (isFinal && text.trim()) {
//           this.handleUserMessage(text.trim());
//         }
//       });
//     }
    
//     private setupRoomEvents(): void {
//       this.room.on(RoomEvent.Connected, () => {
//         console.log('✅ Connected to LiveKit room');
//       });
      
//       this.room.on(RoomEvent.Disconnected, () => {
//         console.log('❌ Disconnected from LiveKit room');
//       });
      
//       this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication) => {
//         if (track.kind === 'audio') {
//           console.log('🔊 Subscribed to remote audio track');
//         }
//       });
      
//       this.room.on(RoomEvent.ConnectionQualityChanged, (quality: any, participant: { identity: any; }) => {
//         console.log(`📶 Connection quality: ${quality} for ${participant?.identity}`);
//       });
//     }
    
//     private async handleUserMessage(text: string): Promise<void> {
//       try {
//         this.setState({ isProcessing: true });
        
//         // Create user message
//         const userMessage: VoiceMessage = {
//           id: `msg-${Date.now()}-user`,
//           type: 'user',
//           content: text,
//           timestamp: Date.now()
//         };
        
//         this.addMessage(userMessage);
        
//         // Generate AI response
//         let aiResponse: string;
        
//         if (this.interviewLLM) {
//           // Interview mode
//           if (this.interviewLLM.isInterviewComplete()) {
//             aiResponse = "Thank you for completing the interview. We'll now generate your feedback.";
//             await this.completeInterview();
//           } else {
//             aiResponse = await this.interviewLLM.processResponse(text, this.messages);
            
//             // If response doesn't include next question, get it
//             if (!aiResponse.includes('Question')) {
//               const nextQuestion = await this.interviewLLM.getNextQuestion();
//               aiResponse += ` ${nextQuestion}`;
//             }
//           }
//         } else {
//           // General conversation mode
//           aiResponse = await this.llm.generateResponse(text, this.messages);
//         }
        
//         // Create AI message
//         const aiMessage: VoiceMessage = {
//           id: `msg-${Date.now()}-ai`,
//           type: 'assistant',
//           content: aiResponse,
//           timestamp: Date.now()
//         };
        
//         this.addMessage(aiMessage);
        
//         // Convert to speech and play
//         await this.speakMessage(aiResponse);
        
//       } catch (error) {
//         console.error('❌ Error processing user message:', error);
//         this.eventCallbacks.onError?.(error instanceof Error ? error : new Error('Processing failed'));
//       } finally {
//         this.setState({ isProcessing: false });
//       }
//     }
    
//     private async speakMessage(text: string): Promise<void> {
//       try {
//         this.setState({ isSpeaking: true });
        
//         // Generate audio
//         const audioBuffer = await this.tts.synthesize(text);
        
//         // Play audio
//         await AudioUtils.playAudioBuffer(audioBuffer);
        
//       } catch (error) {
//         console.error('❌ Error speaking message:', error);
//       } finally {
//         this.setState({ isSpeaking: false });
//       }
//     }
    
//     private async askFirstQuestion(): Promise<void> {
//       if (!this.interviewLLM) return;
      
//       try {
//         const firstQuestion = await this.interviewLLM.getNextQuestion();
//         const welcomeMessage = `Welcome to your interview! Let's begin. ${firstQuestion}`;
        
//         const aiMessage: VoiceMessage = {
//           id: `msg-${Date.now()}-ai`,
//           type: 'assistant',
//           content: welcomeMessage,
//           timestamp: Date.now()
//         };
        
//         this.addMessage(aiMessage);
//         await this.speakMessage(welcomeMessage);
        
//       } catch (error) {
//         console.error('❌ Error asking first question:', error);
//       }
//     }
    
//     private async completeInterview(): Promise<void> {
//       try {
//         if (this.session) {
//           this.session.endTime = Date.now();
//           this.session.status = 'completed';
//           this.session.messages = [...this.messages];
//         }
        
//         // Stop the pipeline
//         await this.stopPipeline();
        
//         console.log('✅ Interview completed');
        
//       } catch (error) {
//         console.error('❌ Error completing interview:', error);
//       }
//     }
    
//     private addMessage(message: VoiceMessage): void {
//       this.messages.push(message);
      
//       if (this.session) {
//         this.session.messages.push(message);
//       }
      
//       this.eventCallbacks.onMessageReceived?.(message);
//     }
    
//     private setState(updates: Partial<PipelineState>): void {
//       this.state = { ...this.state, ...updates };
//     }
    
//     private getSystemPromptForType(type: 'technical' | 'behavioral' | 'mixed'): string {
//       const basePrompt = `You are a professional AI interviewer conducting a ${type} interview. `;
      
//       switch (type) {
//         case 'technical':
//           return basePrompt + `Focus on technical skills, problem-solving, and implementation details. Ask follow-up questions to understand the candidate's thought process. Keep responses concise and under 30 seconds when spoken.`;
          
//         case 'behavioral':
//           return basePrompt + `Use the STAR method (Situation, Task, Action, Result) to guide responses. Focus on past experiences, teamwork, and soft skills. Be encouraging and help candidates structure their answers.`;
          
//         case 'mixed':
//           return basePrompt + `Alternate between technical and behavioral questions. Adapt your questioning style based on the current question type. Maintain a professional but supportive tone throughout.`;
          
//         default:
//           return basePrompt + `Conduct a comprehensive interview covering various aspects. Be professional, encouraging, and help the candidate perform their best.`;
//       }
//     }
    
//     // Token Management for LiveKit
//     static async generateToken(roomName: string, participantName: string): Promise<string> {
//       try {
//         const response = await fetch('/api/livekit/token', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             roomName,
//             participantName,
//           }),
//         });
        
//         if (!response.ok) {
//           throw new Error(`Failed to generate token: ${response.statusText}`);
//         }
        
//         const { token } = await response.json();
//         return token;
        
//       } catch (error) {
//         console.error('❌ Error generating LiveKit token:', error);
//         throw error;
//       }
//     }
//   }
  
//   // Pipeline Factory
//   export class PipelineFactory {
//     static createVoicePipeline(config?: Partial<VoicePipelineConfig>): LiveKitVoicePipeline {
//       const mergedConfig = {
//         ...DEFAULT_PIPELINE_CONFIG,
//         ...config
//       };
      
//       return new LiveKitVoicePipeline(mergedConfig);
//     }
    
//     static createInterviewPipeline(
//       interviewType: 'technical' | 'behavioral' | 'mixed',
//       questions: string[]
//     ): LiveKitVoicePipeline {
//       const config = {
//         ...DEFAULT_PIPELINE_CONFIG,
//         llm: {
//           ...DEFAULT_PIPELINE_CONFIG.llm,
//           systemPrompt: this.getSystemPromptForType(interviewType)
//         }
//       };
      
//       const pipeline = new LiveKitVoicePipeline(config);
//       return pipeline;
//     }
    
//     private static getSystemPromptForType(type: 'technical' | 'behavioral' | 'mixed'): string {
//       // Same logic as in the main class
//       const basePrompt = `You are a professional AI interviewer conducting a ${type} interview. `;
      
//       switch (type) {
//         case 'technical':
//           return basePrompt + `Focus on technical skills, problem-solving, and implementation details. Ask follow-up questions to understand the candidate's thought process. Keep responses concise and under 30 seconds when spoken.`;
          
//         case 'behavioral':
//           return basePrompt + `Use the STAR method (Situation, Task, Action, Result) to guide responses. Focus on past experiences, teamwork, and soft skills. Be encouraging and help candidates structure their answers.`;
          
//         case 'mixed':
//           return basePrompt + `Alternate between technical and behavioral questions. Adapt your questioning style based on the current question type. Maintain a professional but supportive tone throughout.`;
          
//         default:
//           return basePrompt + `Conduct a comprehensive interview covering various aspects. Be professional, encouraging, and help the candidate perform their best.`;
//       }
//     }
//   }