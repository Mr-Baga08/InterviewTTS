// lib/livekit/agent/session.ts - Fixed LiveKit Session
import { 
    Room, 
    RoomEvent, 
    RemoteAudioTrack, 
    LocalAudioTrack,
    TrackPublication,
    Participant,
    Track,
    ConnectionState,
    RoomOptions,
    AudioCaptureOptions
  } from 'livekit-client';
  
  import { 
    RoomServiceClient, 
    AccessToken
  } from 'livekit-server-sdk';
  
  export interface InterviewSessionConfig {
    interviewId?: string;
    userId: string;
    userName: string;
    questions: string[];
    interviewType: 'technical' | 'behavioral' | 'mixed';
    systemPrompt?: string;
  }
  
  export class InterviewAgentSession {
    private room: Room;
    private config: InterviewSessionConfig;
    private currentQuestionIndex = 0;
    private messages: Array<{
      id: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: number;
    }> = [];
    
    private isProcessing = false;
    private audioContext?: AudioContext;
    private mediaRecorder?: MediaRecorder;
    private audioChunks: Blob[] = [];
    private localAudioTrack?: LocalAudioTrack;
  
    constructor(room: Room, config: InterviewSessionConfig) {
      this.room = room;
      this.config = config;
      this.setupRoomEvents();
    }
  
    async start(): Promise<void> {
      console.log('🚀 Starting Interview Agent Session...');
      
      try {
        // Setup audio capture with correct API
        await this.setupAudioCapture();
        
        // Send welcome message
        await this.sendWelcomeMessage();
        
        console.log('✅ Agent session started successfully');
        
      } catch (error) {
        console.error('❌ Failed to start agent session:', error);
        throw error;
      }
    }
  
    private setupRoomEvents(): void {
      this.room.on(RoomEvent.ParticipantConnected, (participant: Participant) => {
        console.log(`👤 Participant joined: ${participant.identity}`);
        if (participant.identity !== 'interview-agent') {
          this.handleParticipantJoined(participant);
        }
      });
  
      this.room.on(RoomEvent.ParticipantDisconnected, (participant: Participant) => {
        console.log(`👤 Participant left: ${participant.identity}`);
        if (participant.identity !== 'interview-agent') {
          this.handleParticipantLeft(participant);
        }
      });
  
      this.room.on(RoomEvent.TrackSubscribed, (
        track: RemoteAudioTrack, 
        publication: TrackPublication, 
        participant: Participant
      ) => {
        if (track.kind === Track.Kind.Audio && participant.identity !== 'interview-agent') {
          console.log('🎤 User audio track subscribed');
          this.handleUserAudioTrack(track);
        }
      });
  
      this.room.on(RoomEvent.DataReceived, (
        payload: Uint8Array, 
        participant?: Participant
      ) => {
        if (participant && participant.identity !== 'interview-agent') {
          this.handleDataReceived(payload, participant);
        }
      });
  
      this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        console.log('📶 Connection state changed:', state);
      });
    }
  
    private async setupAudioCapture(): Promise<void> {
      try {
        // Create audio context for processing
        this.audioContext = new AudioContext({ sampleRate: 16000 });
        
        // Create local audio track for the agent with correct API
        const audioTrack = await LocalAudioTrack.create({
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        } as AudioCaptureOptions);
  
        // Publish the agent's audio track with correct API
        await this.room.localParticipant.publishTrack(audioTrack, {
          name: 'agent-audio',
          source: Track.Source.Microphone,
        });
  
        this.localAudioTrack = audioTrack;
        console.log('✅ Agent audio capture setup complete');
        
      } catch (error) {
        console.error('❌ Failed to setup audio capture:', error);
        throw error;
      }
    }
  
    private async handleUserAudioTrack(track: RemoteAudioTrack): Promise<void> {
      try {
        // Attach the track to get the MediaStream
        const element = track.attach() as HTMLAudioElement;
        
        if (element && element.srcObject instanceof MediaStream) {
          // Setup speech recognition on the user's audio
          await this.setupSpeechRecognition(element.srcObject);
        }
        
      } catch (error) {
        console.error('❌ Error handling user audio track:', error);
      }
    }
  
    private async setupSpeechRecognition(stream: MediaStream): Promise<void> {
      try {
        // Use MediaRecorder for audio capture and send to external STT
        await this.setupMediaRecorderSTT(stream);
        
      } catch (error) {
        console.error('❌ Failed to setup speech recognition:', error);
      }
    }
  
    private async setupMediaRecorderSTT(stream: MediaStream): Promise<void> {
      // Check if MediaRecorder supports the desired format
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
  
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if