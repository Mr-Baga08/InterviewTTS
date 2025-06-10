// lib/livekit/agent/runner.ts
import { Room, RoomOptions } from 'livekit-client';
import { AccessToken } from 'livekit-server-sdk';
import { InterviewAgentSession, InterviewSessionConfig } from './session';
import { LIVEKIT_CONFIG } from '../config';

export class InterviewAgentRunner {
  private sessions = new Map<string, InterviewAgentSession>();

  async createSession(config: InterviewSessionConfig): Promise<string> {
    try {
      console.log('🚀 Creating new interview agent session...');

      // Generate room name
      const roomName = `interview-${config.interviewId || Date.now()}`;

      // Create agent token
      const agentToken = new AccessToken(
        LIVEKIT_CONFIG.server.apiKey,
        LIVEKIT_CONFIG.server.apiSecret,
        {
          identity: 'interview-agent',
          ttl: '1h',
        }
      );

      agentToken.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      // Create room instance
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      } as RoomOptions);

      // Connect to room
      const jwt = await agentToken.toJwt();
      await room.connect(LIVEKIT_CONFIG.server.url, jwt);

      // Create and start agent session
      const session = new InterviewAgentSession(room, config);
      await session.start();

      // Store session
      this.sessions.set(roomName, session);

      console.log('✅ Agent session created successfully');
      return roomName;

    } catch (error) {
      console.error('❌ Failed to create agent session:', error);
      throw error;
    }
  }

  async stopSession(roomName: string): Promise<void> {
    const session = this.sessions.get(roomName);
    if (session) {
      // Session cleanup will happen automatically when room disconnects
      this.sessions.delete(roomName);
      console.log('✅ Agent session stopped');
    }
  }

  getActiveSessionCount(): number {
    return this.sessions.size;
  }
}

// Singleton instance
export const agentRunner = new InterviewAgentRunner();