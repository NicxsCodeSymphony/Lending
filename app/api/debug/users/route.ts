import { NextResponse } from 'next/server';
import { getDatabaseService, User } from '@/app/lib/database';

export async function GET() {
  try {
    const dbService = await getDatabaseService();
    
    console.log('Database service type:', dbService.constructor.name);
    
    // Check environment variables for Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' || 
                        process.env.USE_SUPABASE === 'true';
    
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      USE_SUPABASE: process.env.USE_SUPABASE,
      isProduction,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    });
    
    // Get all users using the getAllUsers method
    let users: User[] = [];
    let error: Error | null = null;
    const debugInfo: Record<string, unknown> = {};
    
    try {
      users = await dbService.getAllUsers();
      console.log(`${dbService.constructor.name} users found:`, users.length);
      debugInfo.methodUsed = 'getAllUsers';
    } catch (dbError) {
      error = dbError instanceof Error ? dbError : new Error(String(dbError));
      console.error('Error getting users:', dbError);
      debugInfo.errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    return NextResponse.json({
      databaseType: dbService.constructor.name,
      users: users,
      totalUsers: users.length,
      error: error ? error.message : null,
      timestamp: new Date().toISOString(),
      note: users.length > 0 ? 'All users retrieved successfully' : 'No users found',
      debugInfo: debugInfo,
      environment: {
        isProduction,
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}