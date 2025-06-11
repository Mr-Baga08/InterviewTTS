// lib/livekit/agent/session.ts - Fixed LiveKit Session with Correct Types
import { 
    Room, 
    RoomEvent, 
    RemoteTrack,
    LocalAudioTrack,
    RemoteTrackPublication,
    RemoteParticipant,
    Track,
    ConnectionState,
    AudioCaptureOptions
  } from 'livekit-client';
  
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
    
    // Audio streaming for TTS playback
    private ttsAudioQueue: ArrayBuffer[] = [];
    private isPlayingTTS = false;
  
    constructor(room: Room, config: InterviewSessionConfig) {
      this.room = room;
      this.config = config;
      this.setupRoomEvents();
      
      // Initialize with system prompt
      if (config.systemPrompt) {
        this.addMessage('system', config.systemPrompt);
      }
    }
  
    async start(): Promise<void> {
      console.log('🚀 Starting Interview Agent Session...');
      
      try {
        // Setup audio capture for TTS playback
        await this.setupTTSAudioTrack();
        
        // Send welcome message
        await this.sendWelcomeMessage();
        
        console.log('✅ Agent session started successfully');
        
      } catch (error) {
        console.error('❌ Failed to start agent session:', error);
        throw error;
      }
    }
  
    private setupRoomEvents(): void {
      // Use correct types in event handlers
      this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log(`👤 Participant joined: ${participant.identity}`);
        if (participant.identity !== 'interview-agent') {
          this.handleParticipantJoined(participant);
        }
      });
  
      this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log(`👤 Participant left: ${participant.identity}`);
        if (participant.identity !== 'interview-agent') {
          this.handleParticipantLeft(participant);
        }
      });
  
      // Fixed: Use correct event handler signature
      this.room.on(RoomEvent.TrackSubscribed, (
        track: RemoteTrack, 
        publication: RemoteTrackPublication, 
        participant: RemoteParticipant
      ) => {
        if (track.kind === Track.Kind.Audio && participant.identity !== 'interview-agent') {
          console.log('🎤 User audio track subscribed');
          // Cast to specific type after checking kind
          this.handleUserAudioTrack(track);
        }
      });
  
      this.room.on(RoomEvent.DataReceived, (
        payload: Uint8Array, 
        participant?: RemoteParticipant
      ) => {
        if (participant && participant.identity !== 'interview-agent') {
          this.handleDataReceived(payload, participant);
        }
      });
  
      this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        console.log('📶 Connection state changed:', state);
      });
    }
  
    private async setupTTSAudioTrack(): Promise<void> {
      try {
        // Create audio context for processing TTS audio
        this.audioContext = new AudioContext({ sampleRate: 16000 });
        
        // Create a silent audio track that we can use to play TTS audio
        // We'll create an oscillator with zero volume to maintain the track
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const destination = this.audioContext.createMediaStreamDestination();
        
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime); // Silent
        
        oscillator.connect(gainNode);
        gainNode.connect(destination);
        oscillator.start();
        
        // Create LocalAudioTrack from the destination stream
        const mediaStream = destination.stream;
        this.localAudioTrack = new LocalAudioTrack(
          mediaStream.getAudioTracks()[0],
          undefined,
          false // not user-facing microphone
        );
  
        // Publish the agent's audio track
        await this.room.localParticipant.publishTrack(this.localAudioTrack, {
          name: 'agent-audio',
          source: Track.Source.Microphone,
        });
  
        console.log('✅ Agent TTS audio track setup complete');
        
      } catch (error) {
        console.error('❌ Failed to setup TTS audio track:', error);
        throw error;
      }
    }
  
    // Fixed: Accept RemoteTrack instead of RemoteAudioTrack
    private async handleUserAudioTrack(track: RemoteTrack): Promise<void> {
      try {
        // Cast to specific audio track type for audio-specific operations
        const audioTrack = track as any; // We know it's audio from the kind check
        
        // Attach the track to get the MediaStream
        const element = audioTrack.attach() as HTMLAudioElement;
        
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
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
  
      if (!selectedMimeType) {
        throw new Error('No supported audio format found for MediaRecorder');
      }
  
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000
      });
  
      this.audioChunks = [];
  
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
  
      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length > 0) {
          const audioBlob = new Blob(this.audioChunks, { type: selectedMimeType });
          await this.processUserAudio(audioBlob);
        }
        this.audioChunks = [];
      };
  
      // Start continuous recording with time slices
      this.mediaRecorder.start(1000); // Capture 1-second chunks
      
      console.log('✅ Speech recognition setup complete');
    }
  
    private async processUserAudio(audioBlob: Blob): Promise<void> {
      if (this.isProcessing) {
        console.log('⏳ Already processing, skipping audio chunk');
        return;
      }
  
      try {
        this.isProcessing = true;
        console.log('🎤 Processing user audio...');
        
        // Convert blob to buffer for API call
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = new Uint8Array(arrayBuffer);
        
        // Send to STT API
        const transcript = await this.processSTT(audioBuffer);
        
        if (transcript && transcript.trim().length > 0) {
          console.log(`📝 User said: "${transcript}"`);
          this.addMessage('user', transcript);
          
          // Send data to other participants
          await this.sendDataToParticipants({
            type: 'transcript',
            role: 'user',
            content: transcript,
            timestamp: Date.now()
          });
          
          // Generate AI response
          await this.generateAndPlayResponse();
        }
        
      } catch (error) {
        console.error('❌ Error processing user audio:', error);
      } finally {
        this.isProcessing = false;
      }
    }
  
    private async generateAndPlayResponse(): Promise<void> {
      try {
        console.log('🤖 Generating AI response...');
        
        // Get LLM response
        const llmResponse = await this.processLLM(this.messages);
        
        if (llmResponse && llmResponse.trim().length > 0) {
          console.log(`🤖 AI Response: "${llmResponse}"`);
          this.addMessage('assistant', llmResponse);
          
          // Send data to other participants
          await this.sendDataToParticipants({
            type: 'response',
            role: 'assistant',
            content: llmResponse,
            timestamp: Date.now()
          });
          
          // Convert to speech and play
          await this.generateAndPlayTTS(llmResponse);
        }
        
      } catch (error) {
        console.error('❌ Error generating response:', error);
      }
    }
  
    private async generateAndPlayTTS(text: string): Promise<void> {
      try {
        console.log('🔊 Generating TTS audio...');
        
        // Get TTS audio
        const audioBuffer = await this.processTTS(text);
        
        if (audioBuffer && audioBuffer.byteLength > 0) {
          // Play the audio through the browser's audio system
          // This will be picked up by the LocalAudioTrack
          await this.playTTSAudio(audioBuffer);
        }
        
      } catch (error) {
        console.error('❌ Error generating TTS:', error);
      }
    }
  
    private async playTTSAudio(audioBuffer: ArrayBuffer): Promise<void> {
      if (!this.audioContext) {
        console.error('❌ Audio context not available');
        return;
      }
  
      try {
        // Decode the audio data
        const audioData = await this.audioContext.decodeAudioData(audioBuffer.slice(0));
        
        // Create audio source
        const source = this.audioContext.createBufferSource();
        source.buffer = audioData;
        
        // Connect to destination (this will be captured by LocalAudioTrack)
        source.connect(this.audioContext.destination);
        
        // Play the audio
        source.start();
        
        console.log('🔊 Playing TTS audio in room');
        
        // Wait for audio to finish
        return new Promise((resolve) => {
          source.onended = () => {
            console.log('✅ TTS audio playback complete');
            resolve();
          };
        });
        
      } catch (error) {
        console.error('❌ Error playing TTS audio:', error);
      }
    }
  
    private async sendWelcomeMessage(): Promise<void> {
      const welcomeText = `Hello ${this.config.userName}. Welcome to your ${this.config.interviewType} interview. I'm ready when you are. Please start by telling me about yourself.`;
      
      this.addMessage('assistant', welcomeText);
      console.log(`🤖 Sending Welcome: "${welcomeText}"`);
      
      // Send welcome as data message
      await this.sendDataToParticipants({
        type: 'welcome',
        role: 'assistant',
        content: welcomeText,
        timestamp: Date.now()
      });
      
      // Generate and play welcome TTS
      await this.generateAndPlayTTS(welcomeText);
    }
  
    private async sendDataToParticipants(data: any): Promise<void> {
      try {
        const payload = new TextEncoder().encode(JSON.stringify(data));
        await this.room.localParticipant.publishData(payload, { reliable: true });
      } catch (error) {
        console.error('❌ Error sending data:', error);
      }
    }
  
    private addMessage(role: 'user' | 'assistant' | 'system', content: string): void {
      this.messages.push({
        id: `${role}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role,
        content,
        timestamp: Date.now()
      });
    }
  
    private handleParticipantJoined(participant: RemoteParticipant): void {
      console.log(`👋 Welcome ${participant.identity}!`);
    }
  
    private handleParticipantLeft(participant: RemoteParticipant): void {
      console.log(`👋 Goodbye ${participant.identity}!`);
    }
  
    private handleDataReceived(payload: Uint8Array, participant: RemoteParticipant): void {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        console.log('📨 Received data from participant:', data);
      } catch (error) {
        console.error('❌ Error parsing received data:', error);
      }
    }
  
    // --- AI Pipeline Methods ---
  
    private async processSTT(audioBuffer: Uint8Array): Promise<string> {
      try {
        const base64Audio = btoa(String.fromCharCode(...audioBuffer));
        
        const response = await fetch('/api/voice/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'stt',
            audio: base64Audio,
            format: 'webm',
            language: 'en'
          }),
        });
        
        const data = await response.json();
        return data.success ? data.transcript || '' : '';
      } catch (error) {
        console.error('❌ STT API error:', error);
        return '';
      }
    }
  
    private async processLLM(messages: Array<{role: string, content: string}>): Promise<string> {
      try {
        const response = await fetch('/api/voice/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'llm',
            message: messages[messages.length - 1]?.content || '',
            context: messages.slice(-10), // Last 10 messages for context
            interviewConfig: {
              type: this.config.interviewType,
              questions: this.config.questions,
              currentIndex: this.currentQuestionIndex
            }
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update question index if there's a next question
          if (data.nextQuestion && !data.isComplete) {
            this.currentQuestionIndex++;
          }
          
          return data.response || 'I apologize, I had trouble processing that.';
        }
        
        return 'I apologize, I\'m experiencing technical difficulties.';
      } catch (error) {
        console.error('❌ LLM API error:', error);
        return 'I apologize, I\'m unable to respond right now.';
      }
    }
  
    private async processTTS(text: string): Promise<ArrayBuffer> {
      try {
        const response = await fetch('/api/voice/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'tts',
            text: text,
            voice: 'nova',
            provider: 'openai'
          }),
        });
        
        const data = await response.json();
        
        if (data.success && data.audio) {
          // Convert base64 to ArrayBuffer
          const binaryString = atob(data.audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes.buffer;
        }
        
        return new ArrayBuffer(0);
      } catch (error) {
        console.error('❌ TTS API error:', error);
        return new ArrayBuffer(0);
      }
    }
  
    // Public methods for external control
    public async stop(): Promise<void> {
      try {
        // Stop media recorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
  
        // Stop local audio track
        if (this.localAudioTrack) {
          this.localAudioTrack.stop();
        }
  
        // Close audio context
        if (this.audioContext) {
          await this.audioContext.close();
        }
  
        console.log('✅ Interview agent session stopped');
      } catch (error) {
        console.error('❌ Error stopping session:', error);
      }
    }
  
    public getMessages(): Array<{id: string, role: string, content: string, timestamp: number}> {
      return [...this.messages];
    }
  
    public getCurrentQuestionIndex(): number {
      return this.currentQuestionIndex;
    }
  
    public isProcessingAudio(): boolean {
      return this.isProcessing;
    }
  }