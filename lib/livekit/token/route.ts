// app/api/livekit/token/route.ts - LiveKit Token Generation API
import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { LIVEKIT_CONFIG } from '@/lib/livekit/config';

export async function POST(request: NextRequest) {
  try {
    const { roomName, participantName, metadata } = await request.json();
    
    // Validate required fields
    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: 'roomName and participantName are required' },
        { status: 400 }
      );
    }
    
    // Validate environment variables
    if (!LIVEKIT_CONFIG.server.apiKey || !LIVEKIT_CONFIG.server.apiSecret) {
      console.error('❌ LiveKit API credentials not configured');
      return NextResponse.json(
        { error: 'LiveKit server not configured' },
        { status: 500 }
      );
    }
    
    // Create access token
    const token = new AccessToken(
      LIVEKIT_CONFIG.server.apiKey,
      LIVEKIT_CONFIG.server.apiSecret,
      {
        identity: participantName,
        ttl: '10m', // Token valid for 10 minutes
        metadata: JSON.stringify(metadata || {}),
      }
    );
    
    // Grant permissions
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
    });
    
    const jwt = await token.toJwt();
    
    console.log('✅ Generated LiveKit token for:', { roomName, participantName });
    
    return NextResponse.json({
      token: jwt,
      url: LIVEKIT_CONFIG.server.url,
    });
    
  } catch (error) {
    console.error('❌ Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const isConfigured = !!(LIVEKIT_CONFIG.server.apiKey && LIVEKIT_CONFIG.server.apiSecret);
    
    return NextResponse.json({
      status: 'ok',
      configured: isConfigured,
      url: LIVEKIT_CONFIG.server.url,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}