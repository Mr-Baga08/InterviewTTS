// app/api/livekit/agent/route.ts - Agent Session Management (Fixed TypeScript Errors)
import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { InterviewAgentSession } from '@/lib/livekit/agent/session';
import { Room } from 'livekit-client';

const activeAgentSessions = new Map<string, InterviewAgentSession>();

// Helper function to safely get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export async function POST(request: NextRequest) {
  try {
    const { roomName, participantName, interviewConfig } = await request.json();

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { error: 'LiveKit credentials not configured' },
        { status: 500 }
      );
    }

    // Create room if it doesn't exist
    const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);
    
    try {
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 300, // 5 minutes
        maxParticipants: 10,
      });
    } catch (roomError: unknown) {
      // Room might already exist, which is fine
      console.log(`Room ${roomName} might already exist:`, getErrorMessage(roomError));
    }

    // Generate token for the participant
    const participantToken = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: participantName,
    });

    participantToken.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Generate token for the agent
    const agentToken = new AccessToken(apiKey, apiSecret, {
      identity: 'interview-agent',
      name: 'AI Interviewer',
    });

    agentToken.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Create and start agent session (in a real app, this might be in a separate service)
    if (process.env.NODE_ENV === 'development') {
      // For development, we can run the agent in the same process
      setTimeout(async () => {
        try {
          const agentRoom = new Room();
          const agentSession = new InterviewAgentSession(agentRoom, interviewConfig);
          
          await agentRoom.connect(wsUrl, await agentToken.toJwt());
          await agentSession.start();
          
          activeAgentSessions.set(roomName, agentSession);
          
          console.log(`🤖 Agent connected to room: ${roomName}`);
        } catch (agentError: unknown) {
          console.error('Failed to start agent session:', getErrorMessage(agentError));
        }
      }, 1000); // Give the participant a moment to connect first
    }

    return NextResponse.json({
      participantToken: await participantToken.toJwt(),
      agentToken: await agentToken.toJwt(),
      url: wsUrl,
      roomName,
    });
  } catch (error: unknown) {
    console.error('Error creating agent session:', getErrorMessage(error));
    return NextResponse.json(
      { error: 'Failed to create agent session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName');

    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    // Stop agent session if it exists
    const agentSession = activeAgentSessions.get(roomName);
    if (agentSession) {
      await agentSession.stop();
      activeAgentSessions.delete(roomName);
      console.log(`🤖 Agent session stopped for room: ${roomName}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error stopping agent session:', getErrorMessage(error));
    return NextResponse.json(
      { error: 'Failed to stop agent session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      activeSessions: activeAgentSessions.size,
      rooms: Array.from(activeAgentSessions.keys()),
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error getting agent status:', getErrorMessage(error));
    return NextResponse.json(
      { error: 'Failed to get agent status' },
      { status: 500 }
    );
  }
}

// Health check endpoint for the agent service
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}