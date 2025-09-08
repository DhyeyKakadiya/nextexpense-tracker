import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Optional: Check if Authorization header is present (for consistency)
    const authorization = request.headers.get('authorization');
    
    // In a stateless JWT implementation, we don't need to invalidate anything on the server
    // The client will remove the token from storage
    
    return NextResponse.json({ 
      message: "Logged out successfully" 
    }, { status: 200 });
    
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}