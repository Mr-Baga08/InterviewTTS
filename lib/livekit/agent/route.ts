// app/api/livekit/agent/route.ts (Updated)
import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { LIVEKIT_CONFIG } from '@/lib/livekit/config';
import { agentRunner } from '@/lib/livekit/agent/runner';

export async function POST(request: NextRequest) {
  try {
    const { 
      roomName, 
      participantName, 
      interviewConfig 
    } = await request.json();

    console.log('🎭 Creating interview session:', { roomName, participantName });

    // Create participant token
    const participantToken = new AccessToken(
      LIVEKIT_CONFIG.server.apiKey,
      LIVEKIT_CONFIG.server.apiSecret,
      {
        identity: participantName,
        ttl: '1h',
      }
    );

    participantToken.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Start agent session
    const sessionId = await agentRunner.createSession({
      ...interviewConfig,
      roomName,
    });

    const participantJWT = await participantToken.toJwt();

    return NextResponse.json({
      participantToken: participantJWT,
      url: LIVEKIT_CONFIG.server.url,
      roomName: sessionId,
      sessionId,
    });

  } catch (error) {
    console.error('❌ Error in agent API:', error);
    return NextResponse.json(
      { error: 'Failed to create agent session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      await agentRunner.stopSession(sessionId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error stopping session:', error);
    return NextResponse.json(
      { error: 'Failed to stop session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    activeSessions: agentRunner.getActiveSessionCount(),
    timestamp: new Date().toISOString(),
  });
}