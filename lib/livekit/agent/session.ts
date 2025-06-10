// lib/livekit/agent/session.ts
import { 
    Room, 
    RoomEvent, 
    RemoteAudioTrack, 
    LocalAudioTrack,
    TrackPublication,
    Participant,
    AudioCaptureOptions,
    RoomOptions
  } from 'livekit-client';
  
  import { 
    RoomServiceClient, 
    AccessToken, 
    WebhookReceiver 
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
  
    constructor(room: Room, config: InterviewSessionConfig) {
      this.room = room;
      this.config = config;
      this.setupRoomEvents();
    }
  
    async start(): Promise<void> {
      console.log('🚀 Starting Interview Agent Session...');
      
      try {
        // Setup audio capture
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
  
      this.room.on(RoomEvent.TrackSubscribed, (track: any, publication: TrackPublication, participant: Participant) => {
        if (track instanceof RemoteAudioTrack && participant.identity !== 'interview-agent') {
          console.log('🎤 User audio track subscribed');
          this.handleUserAudioTrack(track);
        }
      });
  
      this.room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: Participant) => {
        if (participant && participant.identity !== 'interview-agent') {
          this.handleDataReceived(payload, participant);
        }
      });
    }
  
    private async setupAudioCapture(): Promise<void> {
      try {
        // Create audio context for processing
        this.audioContext = new AudioContext({ sampleRate: 16000 });
        
        // Create local audio track for the agent
        const audioTrack = await LocalAudioTrack.createAudioTrack({
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } as AudioCaptureOptions);
  
        // Publish the agent's audio track
        await this.room.localParticipant.publishTrack(audioTrack, {
          name: 'agent-audio',
          source: 'microphone',
        });
  
        console.log('✅ Agent audio capture setup complete');
        
      } catch (error) {
        console.error('❌ Failed to setup audio capture:', error);
        throw error;
      }
    }
  
    private async handleUserAudioTrack(track: RemoteAudioTrack): Promise<void> {
      try {
        // Attach the track to get the MediaStream
        const element = track.attach();
        
        if (element instanceof HTMLAudioElement && element.srcObject instanceof MediaStream) {
          // Setup speech recognition on the user's audio
          await this.setupSpeechRecognition(element.srcObject);
        }
        
      } catch (error) {
        console.error('❌ Error handling user audio track:', error);
      }
    }
  
    private async setupSpeechRecognition(stream: MediaStream): Promise<void> {
      try {
        // Use Web Speech API for speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
  
          recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            this.handleUserSpeech(transcript.trim());
          };
  
          recognition.onerror = (error: any) => {
            console.error('Speech recognition error:', error);
          };
  
          recognition.start();
          
        } else {
          // Fallback: Use MediaRecorder for audio capture and send to external STT
          await this.setupMediaRecorderSTT(stream);
        }
        
      } catch (error) {
        console.error('❌ Failed to setup speech recognition:', error);
      }
    }
  
    private async setupMediaRecorderSTT(stream: MediaStream): Promise<void> {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
  
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
  
      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        
        // Send to speech-to-text service
        await this.transcribeAudio(audioBlob);
      };
  
      // Record in chunks
      this.mediaRecorder.start();
      setInterval(() => {
        if (this.mediaRecorder?.state === 'recording') {
          this.mediaRecorder.stop();
          this.mediaRecorder.start();
        }
      }, 3000); // 3-second chunks
    }
  
    private async transcribeAudio(audioBlob: Blob): Promise<void> {
      try {
        // Use OpenAI Whisper API
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');
  
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: formData,
        });
  
        if (response.ok) {
          const data = await response.json();
          const transcript = data.text.trim();
          
          if (transcript) {
            this.handleUserSpeech(transcript);
          }
        }
        
      } catch (error) {
        console.error('❌ Transcription error:', error);
      }
    }
  
    private async handleUserSpeech(transcript: string): Promise<void> {
      if (this.isProcessing || !transcript.trim()) return;
      
      try {
        this.isProcessing = true;
        
        console.log('👤 User said:', transcript);
        
        // Add user message to conversation
        const userMessage = {
          id: `user-${Date.now()}`,
          role: 'user' as const,
          content: transcript,
          timestamp: Date.now(),
        };
        this.messages.push(userMessage);
  
        // Generate AI response
        const aiResponse = await this.generateResponse(transcript);
        
        // Add AI message to conversation
        const aiMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant' as const,
          content: aiResponse,
          timestamp: Date.now(),
        };
        this.messages.push(aiMessage);
  
        // Convert to speech and play
        await this.speakResponse(aiResponse);
        
        // Send transcript data to participant
        this.sendDataToParticipant({
          type: 'transcript',
          text: aiResponse,
          speaker: 'agent'
        });
  
        // Check if interview is complete
        if (this.isInterviewComplete()) {
          await this.completeInterview();
        }
        
      } catch (error) {
        console.error('❌ Error processing user speech:', error);
      } finally {
        this.isProcessing = false;
      }
    }
  
    private async generateResponse(userInput: string): Promise<string> {
      try {
        // Create conversation context
        const context = this.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
  
        // Add system prompt
        const systemPrompt = this.getSystemPrompt();
        const messages = [
          { role: 'system', content: systemPrompt },
          ...context,
          { role: 'user', content: userInput }
        ];
  
        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.7,
            max_tokens: 200,
          }),
        });
  
        if (response.ok) {
          const data = await response.json();
          return data.choices[0]?.message?.content || 'I understand. Let me think about that.';
        }
        
        return this.getFallbackResponse();
        
      } catch (error) {
        console.error('❌ Error generating response:', error);
        return this.getFallbackResponse();
      }
    }
  
    private async speakResponse(text: string): Promise<void> {
      try {
        // Option 1: Use OpenAI TTS
        if (process.env.OPENAI_API_KEY) {
          await this.speakWithOpenAI(text);
        } 
        // Option 2: Use Web Speech API (fallback)
        else {
          await this.speakWithWebSpeech(text);
        }
        
      } catch (error) {
        console.error('❌ Error speaking response:', error);
        // Fallback to Web Speech
        await this.speakWithWebSpeech(text);
      }
    }
  
    private async speakWithOpenAI(text: string): Promise<void> {
      try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: 'nova',
            response_format: 'mp3',
          }),
        });
  
        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          await this.playAudioBuffer(audioBuffer);
        }
        
      } catch (error) {
        console.error('❌ OpenAI TTS error:', error);
        throw error;
      }
    }
  
    private async speakWithWebSpeech(text: string): Promise<void> {
      return new Promise((resolve) => {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          // Find a good English voice
          const voices = speechSynthesis.getVoices();
          const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
          if (englishVoice) {
            utterance.voice = englishVoice;
          }
  
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve(); // Continue even if TTS fails
  
          speechSynthesis.speak(utterance);
        } else {
          resolve();
        }
      });
    }
  
    private async playAudioBuffer(audioBuffer: ArrayBuffer): Promise<void> {
      try {
        if (!this.audioContext) return;
        
        const audioData = await this.audioContext.decodeAudioData(audioBuffer);
        const source = this.audioContext.createBufferSource();
        
        source.buffer = audioData;
        source.connect(this.audioContext.destination);
        
        return new Promise((resolve) => {
          source.onended = () => resolve();
          source.start();
        });
        
      } catch (error) {
        console.error('❌ Error playing audio:', error);
      }
    }
  
    private getSystemPrompt(): string {
      const basePrompt = `You are a professional AI interviewer conducting a ${this.config.interviewType} interview. `;
      
      const questionsPrompt = `
  INTERVIEW QUESTIONS:
  ${this.config.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
  
  CURRENT PROGRESS: Question ${this.currentQuestionIndex + 1} of ${this.config.questions.length}
  `;
  
      const guidelines = `
  GUIDELINES:
  - Keep responses concise (2-3 sentences max for voice)
  - Ask one question at a time
  - Provide brief acknowledgments before moving to next question
  - Be encouraging and professional
  - If answer is incomplete, ask a brief follow-up
  - When ready, move to the next question in the list
  `;
  
      return basePrompt + questionsPrompt + guidelines;
    }
  
    private getFallbackResponse(): string {
      const responses = [
        "That's interesting. Can you tell me more about that?",
        "I see. What was your role in that situation?",
        "Thank you for sharing that. Let me ask you another question.",
        "That's a good point. Can you elaborate on that?",
      ];
      
      return responses[Math.floor(Math.random() * responses.length)];
    }
  
    private async sendWelcomeMessage(): Promise<void> {
      const welcomeText = `Hello ${this.config.userName}! Welcome to your ${this.config.interviewType} interview practice session. I'm here to help you improve your interview skills. Let's begin with our first question: ${this.config.questions[0]}`;
      
      await this.speakResponse(welcomeText);
      
      this.sendDataToParticipant({
        type: 'transcript',
        text: welcomeText,
        speaker: 'agent'
      });
    }
  
    private sendDataToParticipant(data: any): void {
      try {
        const encoder = new TextEncoder();
        const payload = encoder.encode(JSON.stringify(data));
        this.room.localParticipant.publishData(payload);
      } catch (error) {
        console.error('❌ Error sending data:', error);
      }
    }
  
    private handleDataReceived(payload: Uint8Array, participant: Participant): void {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));
        console.log('📨 Received data from participant:', data);
      } catch (error) {
        console.error('❌ Error handling received data:', error);
      }
    }
  
    private handleParticipantJoined(participant: Participant): void {
      console.log(`👋 Welcome ${participant.identity}!`);
      // Send initial greeting when participant joins
      setTimeout(() => {
        this.sendWelcomeMessage();
      }, 2000);
    }
  
    private handleParticipantLeft(participant: Participant): void {
      console.log(`👋 Goodbye ${participant.identity}!`);
      // End the session when participant leaves
      this.completeInterview();
    }
  
    private isInterviewComplete(): boolean {
      return this.currentQuestionIndex >= this.config.questions.length;
    }
  
    private async completeInterview(): Promise<void> {
      try {
        const closingMessage = "Thank you for completing the interview! We'll now generate your feedback. Have a great day!";
        
        await this.speakResponse(closingMessage);
        
        this.sendDataToParticipant({
          type: 'interview_complete',
          messages: this.messages
        });
  
        // Generate feedback if we have the interview ID
        if (this.config.interviewId && this.config.userId) {
          await this.generateFeedback();
        }
  
        // Disconnect after a short delay
        setTimeout(() => {
          this.room.disconnect();
        }, 3000);
        
      } catch (error) {
        console.error('❌ Error completing interview:', error);
      }
    }
  
    private async generateFeedback(): Promise<void> {
      try {
        // Call your existing feedback generation API
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewId: this.config.interviewId,
            userId: this.config.userId,
            transcript: this.messages,
          }),
        });
  
        if (response.ok) {
          console.log('✅ Feedback generated successfully');
        }
        
      } catch (error) {
        console.error('❌ Error generating feedback:', error);
      }
    }
  }
  
  export default InterviewAgentSession;