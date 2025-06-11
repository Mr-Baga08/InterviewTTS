// lib/livekit/agent/session.ts - Corrected LiveKit Agent Session
import {
    Room,
    RoomEvent,
    RemoteTrack,
    RemoteParticipant,
    RemoteTrackPublication,
    Track,
    ConnectionState,
    LocalAudioTrack,
    createLocalAudioTrack
} from 'livekit-client';
import { OpusEncoder } from '@discordjs/opus';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// A simple in-memory store for our audio buffers
const audioBuffer = new Map<string, Buffer>();

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
        role: 'user' | 'assistant' | 'system';
        content: string;
    }> = [];

    private isProcessing = false;
    private localAudioTrack?: LocalAudioTrack;
    private remoteAudioTrack?: RemoteTrack;
    private encoder: OpusEncoder;

    constructor(room: Room, config: InterviewSessionConfig) {
        this.room = room;
        this.config = config;
        this.encoder = new OpusEncoder(48000, 2); // Recommended settings for LiveKit
        this.setupRoomEvents();

        // Initialize with a system prompt
        if (config.systemPrompt) {
            this.messages.push({ role: 'system', content: config.systemPrompt });
        }
    }

    async start(): Promise<void> {
        console.log('🚀 Starting Interview Agent Session...');
        try {
            await this.sendWelcomeMessage();
            console.log('✅ Agent session started successfully.');
        } catch (error) {
            console.error('❌ Failed to start agent session:', error);
            throw error;
        }
    }

    private setupRoomEvents(): void {
        this.room.on(
            RoomEvent.TrackSubscribed,
            (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
                if (track.kind === Track.Kind.Audio && participant.identity === this.config.userId) {
                    console.log('🎤 User audio track subscribed');
                    this.remoteAudioTrack = track;
                    this.handleUserAudio();
                }
            }
        );

        this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
            console.log('📶 Agent connection state changed:', state);
        });
    }

    private handleUserAudio(): void {
        if (!this.remoteAudioTrack) return;

        // This event fires whenever a new audio frame is received from the user
        this.remoteAudioTrack.on('audioFrame', async (frame: { data: any; }) => {
            if (this.isProcessing) {
                // Don't process new audio while the agent is "thinking" or "speaking"
                return;
            }
            
            // Here, you would implement Voice Activity Detection (VAD)
            // For simplicity, we'll start processing on any frame and use a timeout.
            // A more robust solution would buffer audio and wait for a pause.
            
            // For now, let's assume we capture a short segment and process it.
            // This is a simplified stand-in for a full VAD + buffering implementation.
            this.isProcessing = true; // Lock processing
            
            console.log('🔊 Received audio frame from user. Processing...');
            
            // In a real app, you'd buffer frames into a complete audio clip
            const pcmBuffer = Buffer.from(frame.data); // This is raw PCM data
            
            // 1. Process with STT
            const transcript = await this.processSTT(pcmBuffer);

            if (transcript && transcript.trim().length > 0) {
                console.log(`📝 User said: "${transcript}"`);
                this.messages.push({ role: 'user', content: transcript });

                // 2. Get LLM response
                const llmResponse = await this.processLLM(this.messages);
                console.log(`🤖 AI Response: "${llmResponse}"`);
                this.messages.push({ role: 'assistant', content: llmResponse });

                // 3. Get TTS audio
                const ttsAudioBuffer = await this.processTTS(llmResponse);

                // 4. Play TTS audio back into the room
                await this.playAudioInRoom(ttsAudioBuffer);
            }
            
            this.isProcessing = false; // Unlock processing
        });
    }

    private async sendWelcomeMessage(): Promise<void> {
        this.isProcessing = true;
        const welcomeText = `Hello ${this.config.userName}. Welcome to your ${this.config.interviewType} interview. Are you ready to begin?`;
        this.messages.push({ role: 'assistant', content: welcomeText });
        
        console.log(`🤖 Sending Welcome: "${welcomeText}"`);
        const audioBuffer = await this.processTTS(welcomeText);
        await this.playAudioInRoom(audioBuffer);
        this.isProcessing = false;
    }
    
    private async playAudioInRoom(audioBuffer: Buffer): Promise<void> {
        if (!this.localAudioTrack) {
            this.localAudioTrack = await createLocalAudioTrack({
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            });
            await this.room.localParticipant.publishTrack(this.localAudioTrack);
        }
    
        // This is a simplified way to push raw audio.
        // For continuous streaming, you'd need a more robust buffer management system.
        // The `captureStream` on the track expects raw PCM data.
        // We assume the TTS service provides compatible audio.
        await this.localAudioTrack.pushAudioFrame(new Int16Array(audioBuffer));
        console.log('🔊 Played AI audio response in room.');
    }

    // --- AI Pipeline Methods ---

    private async processSTT(audioBuffer: Buffer): Promise<string> {
        // This makes a call to your Next.js API route for STT
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: audioBuffer,
            });
            const data = await response.json();
            return data.transcript || '';
        } catch (error) {
            console.error('❌ STT API error:', error);
            return '';
        }
    }

    private async processLLM(messages: any[]): Promise<string> {
        // This makes a call to your Next.js API route for LLM
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/llm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages }),
            });
            const data = await response.json();
            return data.response || 'I am sorry, I had an issue processing that.';
        } catch (error) {
            console.error('❌ LLM API error:', error);
            return 'I am unable to respond right now.';
        }
    }

    private async processTTS(text: string): Promise<Buffer> {
        // This makes a call to your Next.js API route for TTS
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            const audioArrayBuffer = await response.arrayBuffer();
            return Buffer.from(audioArrayBuffer);
        } catch (error) {
            console.error('❌ TTS API error:', error);
            return Buffer.alloc(0); // Return empty buffer on error
        }
    }
}