import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// Interface for JWT token payload
interface TokenPayload {
  account_id: number;
  username: string;
  exp: number;
}

// Simple JWT-like token generation (for demo purposes)
const generateToken = (payload: TokenPayload): string => {
  // Create a simple JWT-like structure: header.payload.signature
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadEncoded = btoa(JSON.stringify(payload));
  const signature = btoa('mock-signature-for-demo'); // In production, use proper JWT signing
  
  return `${header}.${payloadEncoded}.${signature}`;
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Auth endpoint called');
    
    const { username, password } = await request.json();
    console.log('📝 Login attempt for username:', username);

    if (!username || !password) {
      console.log('❌ Missing username or password');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log('🔧 Getting database service...');
    const dbService = await getDatabaseService();
    
    // Debug: Check if we're using SQLite or PostgreSQL
    console.log('📊 Database service type:', dbService.constructor.name);
    console.log('🌍 Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      USE_SUPABASE: process.env.USE_SUPABASE,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
    
    // Ensure admin user exists (for development)
    if (dbService.constructor.name === 'DatabaseService') {
      try {
        console.log('🔍 Checking for admin user in SQLite...');
        const existingAdmin = await dbService.getUserByUsername('admin');
        if (!existingAdmin) {
          console.log('👤 Creating admin user...');
          await dbService.createUser({
            account_name: 'admin',
            username: 'admin',
            password: 'admin'
          });
          console.log('✅ Admin user created successfully');
        } else {
          console.log('✅ Admin user already exists');
        }
      } catch (error) {
        console.log('⚠️ Error ensuring admin user exists:', error);
      }
    }
    
    console.log('🔍 Looking up user:', username);
    const user = await dbService.getUserByUsername(username);

    console.log("👤 User found:", user ? 'Yes' : 'No');

    if (!user || user.password !== password) {
      console.log('❌ Invalid credentials');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('✅ Login successful for user:', username);

    // Create a proper JWT-like token
    const tokenPayload: TokenPayload = {
      account_id: user.account_id,
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours from now
    };
    
    const token = generateToken(tokenPayload);
    console.log('🎫 Token generated successfully');

    // Return user data that matches the AuthContext interface
    return NextResponse.json({
      success: true,
      user: {
        account_id: user.account_id,
        account_name: user.account_name,
        username: user.username,
        role: 'admin' // Add the role field back
      },
      token: token
    });

  } catch (error) {
    console.error('💥 Authentication error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 