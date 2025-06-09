// app/api/clear-cookies/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Clear all possible auth cookies
    cookieStore.delete('session');
    cookieStore.delete('session_secure');
    cookieStore.delete('__session');
    
    return NextResponse.json({ 
      success: true, 
      message: 'All cookies cleared' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear cookies' 
    }, { status: 500 });
  }
}